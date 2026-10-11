"""Tests for scrape_shop Celery task."""

from unittest.mock import patch

from worker.db import CrawlStats, ShopScheduleRecord
from worker.tasks import schedule_due_shops, scrape_shop


@patch("worker.tasks.complete_crawl_job")
@patch("worker.tasks.run_scrapy_for_shop")
@patch("worker.tasks.create_crawl_job", return_value=55)
@patch(
    "worker.tasks.get_shop_for_crawl",
    return_value=ShopScheduleRecord(
        id=1,
        website_url="https://shop.example.com/",
        crawl_frequency_minutes=60,
        active=True,
        scraping_allowed=True,
    ),
)
def test_scrape_shop_creates_crawl_job_with_stats(
    mock_get_shop,
    mock_create_job,
    mock_run,
    mock_complete,
):
    mock_run.return_value = CrawlStats(
        urls_discovered=12,
        urls_crawled=10,
        pages_changed=4,
        offers_found=3,
        error_count=0,
    )

    result = scrape_shop.run(1)

    assert result["crawl_job_id"] == 55
    assert result["status"] == "completed"
    assert result["urls_discovered"] == 12
    assert result["offers_found"] == 3
    mock_complete.assert_called_once()
    assert mock_complete.call_args.args[0] == 55
    assert mock_complete.call_args.kwargs.get("status") == "completed" or (
        len(mock_complete.call_args.args) > 2 and mock_complete.call_args.args[2] == "completed"
    )


@patch("worker.tasks.scrape_shop.delay")
@patch("worker.tasks.list_due_shop_ids", return_value=[1, 3])
def test_schedule_due_shops_enqueues_tasks(mock_list_due, mock_delay):
    result = schedule_due_shops.run()
    assert result["count"] == 2
    assert result["enqueued_shop_ids"] == [1, 3]
    assert mock_delay.call_count == 2
