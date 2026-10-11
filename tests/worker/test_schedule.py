"""Tests for crawl job scheduling helpers."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from worker.db import (
    CrawlStats,
    Shop,
    complete_crawl_job,
    create_crawl_job,
    list_due_shop_ids,
)


@patch("worker.db.get_session")
def test_create_and_complete_crawl_job(mock_get_session):
    session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = session

    def _assign_id(job):
        job.id = 7

    session.add.side_effect = _assign_id
    job = MagicMock()
    job.id = 7
    session.get.return_value = job

    job_id = create_crawl_job(1)
    assert job_id == 7

    complete_crawl_job(
        7,
        CrawlStats(
            urls_discovered=10,
            urls_crawled=8,
            pages_changed=3,
            offers_found=2,
            error_count=0,
        ),
        status="completed",
    )
    assert job.status == "completed"
    assert job.urls_discovered == 10
    assert job.offers_found == 2
    assert job.completed_at is not None


def _shop(shop_id: int = 1, frequency: int = 60) -> Shop:
    return Shop(
        id=shop_id,
        name="Shop",
        website_url="https://shop.example.com",
        domain="shop.example.com",
        active=True,
        scraping_allowed=True,
        crawl_frequency_minutes=frequency,
    )


@patch("worker.db.get_session")
def test_list_due_shop_ids_includes_never_crawled(mock_get_session):
    session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = session

    shops_result = MagicMock()
    shops_result.scalars.return_value.all.return_value = [_shop(1)]
    last_result = MagicMock()
    last_result.scalar_one.return_value = None
    session.execute.side_effect = [shops_result, last_result]

    assert list_due_shop_ids() == [1]


@patch("worker.db.get_session")
def test_list_due_shop_ids_respects_frequency(mock_get_session):
    session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = session

    shops_result = MagicMock()
    shops_result.scalars.return_value.all.return_value = [_shop(2, frequency=360)]

    recent = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent_result = MagicMock()
    recent_result.scalar_one.return_value = recent
    session.execute.side_effect = [shops_result, recent_result]
    assert list_due_shop_ids() == []

    shops_result_2 = MagicMock()
    shops_result_2.scalars.return_value.all.return_value = [_shop(2, frequency=360)]
    stale = datetime.now(timezone.utc) - timedelta(minutes=400)
    stale_result = MagicMock()
    stale_result.scalar_one.return_value = stale
    session.execute.side_effect = [shops_result_2, stale_result]
    assert list_due_shop_ids() == [2]
