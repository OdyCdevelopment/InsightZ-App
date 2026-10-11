"""Generic shop spider with sitemap-first discovery and link crawl fallback."""

from __future__ import annotations

from urllib.parse import urljoin, urlparse

import scrapy
from scrapy.http import Response

from offers_crawler.db import load_shop
from offers_crawler.extractors.generic import guess_page_type
from offers_crawler.extractors.product import needs_playwright_fallback
from offers_crawler.items import PageItem
from offers_crawler.utils.hashing import content_hash
from offers_crawler.utils.text import extract_title, extract_visible_text
from offers_crawler.utils.urls import (
    is_excluded_url,
    is_same_domain,
    normalize_url,
    resolve_url,
    url_priority_score,
)


class GenericShopSpider(scrapy.Spider):
    name = "generic_shop"
    allowed_domains: list[str] = []  # noqa: RUF012

    custom_settings = {  # noqa: RUF012
        "ROBOTSTXT_OBEY": False,
    }

    def __init__(self, shop_id: str | None = None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if shop_id is None:
            raise ValueError("shop_id spider argument is required")

        self.shop_id = int(shop_id)
        self.shop = load_shop(self.shop_id)
        if self.shop is None:
            raise ValueError(f"Shop {self.shop_id} not found")

        if not self.shop.active:
            raise ValueError(f"Shop {self.shop_id} is not active")

        # Bypass robots.txt check
        # if not self.shop.scraping_allowed:
        #     raise ValueError(f"Shop {self.shop_id} is not allowed to scrape (robots.txt)")

        self.allowed_domains = [self.shop.domain]
        self.shop_domain = self.shop.domain
        self.scheduled_urls: set[str] = set()
        self.base_url = normalize_url(self.shop.website_url)

    async def start(self):
        """Scrapy 2.13+ entrypoint (start_requests is no longer auto-called)."""
        parsed = urlparse(self.base_url)
        origin = f"{parsed.scheme}://{parsed.netloc}"

        for sitemap_path in ("/sitemap.xml", "/sitemap_index.xml"):
            yield scrapy.Request(
                urljoin(origin, sitemap_path),
                callback=self.parse_sitemap,
                errback=self._sitemap_error,
                priority=100,
                dont_filter=True,
            )

        homepage = self._make_page_request(self.base_url, priority=50)
        if homepage is not None:
            yield homepage

    def start_requests(self):
        # Kept for older Scrapy; unused on 2.13+ when start() is defined.
        raise NotImplementedError("Use async start() on Scrapy 2.13+")

    def _sitemap_error(self, failure):
        self.logger.info("Sitemap unavailable: %s", failure.request.url)

    def parse_sitemap(self, response: Response):
        if response.status >= 400:
            self.logger.info("Sitemap not found: %s", response.url)
            return

        for loc in response.xpath("//sitemap/loc/text()").getall():
            normalized = normalize_url(loc.strip())
            if is_same_domain(normalized, self.shop_domain):
                yield scrapy.Request(
                    normalized,
                    callback=self.parse_sitemap,
                    priority=90,
                    dont_filter=True,
                )

        for loc in response.xpath("//url/loc/text()").getall():
            normalized = normalize_url(loc.strip())
            if not is_same_domain(normalized, self.shop_domain):
                continue
            request = self._make_page_request(normalized)
            if request is not None:
                yield request

    def parse_page(self, response: Response):
        request_meta = response.request.meta if response.request is not None else {}

        if (
            not request_meta.get("playwright_rendered")
            and needs_playwright_fallback(response.text)
        ):
            self.crawler.stats.inc_value("playwright_fallback_triggered")
            yield scrapy.Request(
                response.url,
                callback=self.parse_page,
                meta={
                    "playwright": True,
                    "playwright_rendered": True,
                },
                dont_filter=True,
                priority=response.request.priority if response.request else 0,
            )
            return

        yield from self._process_page(response)

    def _process_page(self, response: Response):
        canonical_url = normalize_url(response.url)
        self.crawler.stats.inc_value("urls_crawled")

        title = extract_title(response.text)
        content = extract_visible_text(response.text)
        page_hash = content_hash(content) if content else None

        yield PageItem(
            shop_id=self.shop_id,
            url=response.url,
            canonical_url=canonical_url,
            page_type=guess_page_type(canonical_url),
            title=title,
            content=content,
            content_hash=page_hash,
            http_status=response.status,
        )

        for href in response.css("a::attr(href)").getall():
            normalized = resolve_url(response.url, href)
            if normalized is None:
                continue
            if not is_same_domain(normalized, self.shop_domain):
                continue
            if is_excluded_url(normalized):
                continue

            request = self._make_page_request(normalized)
            if request is not None:
                yield request

    def _make_page_request(self, url: str, priority: int | None = None) -> scrapy.Request | None:
        canonical_url = normalize_url(url)
        if canonical_url in self.scheduled_urls:
            return None
        if is_excluded_url(canonical_url):
            return None

        self.scheduled_urls.add(canonical_url)
        if getattr(self, "crawler", None) is not None:
            self.crawler.stats.inc_value("urls_discovered")

        request_priority = priority if priority is not None else url_priority_score(canonical_url)
        return scrapy.Request(
            canonical_url,
            callback=self.parse_page,
            priority=request_priority,
            dont_filter=True,
        )
