"""Celery background tasks for shop crawling."""

from __future__ import annotations

import logging
import os
import sys
from typing import Any

from worker.celery_app import celery_app
from worker.config import CRAWLER_DIR, PROJECT_ROOT
from worker.db import (
    CrawlStats,
    complete_crawl_job,
    create_crawl_job,
    get_shop_for_crawl,
    list_due_shop_ids,
)

logger = logging.getLogger(__name__)


def _run_scrapy_process(shop_id: int, queue: Any) -> None:
    """Helper target function to run in the spawned multiprocessing process."""
    try:
        try:
            import redis.connection
            import redis.utils
            redis.utils.DEFAULT_RESP_VERSION = 2  # type: ignore[attr-defined]
            redis.connection.DEFAULT_RESP_VERSION = 2  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001
            pass

        if str(CRAWLER_DIR) not in sys.path:
            sys.path.insert(0, str(CRAWLER_DIR))
        if str(PROJECT_ROOT) not in sys.path:
            sys.path.insert(0, str(PROJECT_ROOT))

        os.chdir(CRAWLER_DIR)

        from scrapy import signals
        from scrapy.crawler import CrawlerProcess
        from scrapy.utils.project import get_project_settings

        settings = get_project_settings()
        settings.set("LOG_LEVEL", "INFO")
        process = CrawlerProcess(settings)
        collected: dict[str, Any] = {}

        def _store_stats(spider):
            collected.update(spider.crawler.stats.get_stats())

        shop = get_shop_for_crawl(shop_id)
        is_social = False
        if shop:
            url_lower = shop.website_url.lower()
            is_social = any(s in url_lower for s in ["instagram.com", "facebook.com", "tiktok.com", "twitter.com", "x.com"])

        spider_name = "social_media" if is_social else "generic_shop"
        crawler = process.create_crawler(spider_name)
        crawler.signals.connect(_store_stats, signal=signals.spider_closed)
        process.crawl(crawler, shop_id=str(shop_id))

        process.start(stop_after_crawl=True)

        result = {
            "urls_discovered": int(collected.get("urls_discovered", 0) or 0),
            "urls_crawled": int(collected.get("urls_crawled", 0) or 0),
            "pages_changed": int(collected.get("pages_changed", 0) or 0),
            "offers_found": int(
                (collected.get("offers_extracted", 0) or 0)
                + (collected.get("offers_deduplicated", 0) or 0)
            ),
            "error_count": int(collected.get("log_count/ERROR", 0) or 0),
            "error_message": None,
        }
        queue.put((True, result))
    except Exception as exc:  # noqa: BLE001
        queue.put((False, str(exc)))


def run_scrapy_for_shop(shop_id: int) -> CrawlStats:
    """Run GenericShopSpider/SocialMediaSpider in a spawned subprocess to avoid Twisted's ReactorNotRestartable."""
    import multiprocessing
    ctx = multiprocessing.get_context("spawn")
    queue = ctx.Queue()
    process = ctx.Process(target=_run_scrapy_process, args=(shop_id, queue))

    logger.info("Spawning subprocess to crawl shop %s", shop_id)
    process.start()

    try:
        success, res = queue.get(timeout=180)
    except Exception as exc:
        logger.exception("Queue get failed or timed out for shop %s", shop_id)
        process.terminate()
        process.join()
        return CrawlStats(error_count=1, error_message=f"Crawl process timed out or failed: {exc}")

    process.join()

    if not success:
        logger.error("Crawl subprocess for shop %s failed with error: %s", shop_id, res)
        return CrawlStats(error_count=1, error_message=str(res)[:4000])

    return CrawlStats(
        urls_discovered=res["urls_discovered"],
        urls_crawled=res["urls_crawled"],
        pages_changed=res["pages_changed"],
        offers_found=res["offers_found"],
        error_count=res["error_count"],
        error_message=None,
    )


@celery_app.task(name="worker.tasks.scrape_shop", bind=True)
def scrape_shop(self, shop_id: int) -> dict[str, Any]:
    """Run the full crawl pipeline for one shop and record crawl_jobs stats."""
    shop = get_shop_for_crawl(shop_id)
    if shop is None:
        raise ValueError(f"Shop {shop_id} not found")
    if not shop.active:
        raise ValueError(f"Shop {shop_id} is not active")
    if not shop.scraping_allowed:
        raise ValueError(f"Shop {shop_id} is not allowed to scrape")

    job_id = create_crawl_job(shop_id)
    try:
        stats = run_scrapy_for_shop(shop_id)
        status = "failed" if stats.error_count and not stats.urls_crawled else "completed"
        if stats.error_message and not stats.urls_crawled:
            status = "failed"
        complete_crawl_job(job_id, stats, status=status)
        return {
            "shop_id": shop_id,
            "crawl_job_id": job_id,
            "status": status,
            "urls_discovered": stats.urls_discovered,
            "urls_crawled": stats.urls_crawled,
            "pages_changed": stats.pages_changed,
            "offers_found": stats.offers_found,
            "error_count": stats.error_count,
        }
    except Exception as exc:
        complete_crawl_job(
            job_id,
            CrawlStats(error_count=1, error_message=str(exc)[:4000]),
            status="failed",
        )
        raise


@celery_app.task(name="worker.tasks.schedule_due_shops")
def schedule_due_shops() -> dict[str, Any]:
    """Enqueue scrape_shop for shops whose crawl_frequency_minutes has elapsed."""
    due_ids = list_due_shop_ids()
    enqueued: list[int] = []
    for shop_id in due_ids:
        scrape_shop.delay(shop_id)
        enqueued.append(shop_id)
    logger.info("Scheduled crawls for shops: %s", enqueued)
    return {"enqueued_shop_ids": enqueued, "count": len(enqueued)}
