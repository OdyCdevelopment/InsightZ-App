"""Tests for missing-offer lifecycle transitions."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from offers_crawler.db import Offer, mark_page_offers_missing


def _offer(status: str = "active", missing_crawl_count: int = 0) -> Offer:
    now = datetime.now(timezone.utc)
    return Offer(
        id=1,
        shop_id=1,
        product_id=None,
        page_id=10,
        title="Samsung Galaxy A15 Offer",
        description=None,
        offer_type="percentage_discount",
        original_price=None,
        discounted_price=None,
        discount_percentage=None,
        discount_amount=None,
        currency="LKR",
        coupon_code=None,
        valid_from=None,
        valid_until=None,
        terms_conditions=None,
        source_url="https://shop.example.com/offers/a15",
        image_url=None,
        status=status,
        confidence_score=None,
        fingerprint="abc",
        embedding=None,
        missing_crawl_count=missing_crawl_count,
        review_status="approved",
        created_at=now,
        updated_at=now,
    )


@patch("offers_crawler.db.get_session")
def test_offer_missing_lifecycle_over_three_crawls(mock_get_session):
    session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = session
    offer = _offer(status="active", missing_crawl_count=0)
    session.execute.return_value.scalars.return_value.all.return_value = [offer]

    first = mark_page_offers_missing(10)
    assert first == [(1, "missing")]
    assert offer.missing_crawl_count == 1
    assert offer.status == "missing"

    second = mark_page_offers_missing(10)
    assert second == [(1, "missing")]
    assert offer.missing_crawl_count == 2
    assert offer.status == "missing"

    third = mark_page_offers_missing(10)
    assert third == [(1, "removed")]
    assert offer.missing_crawl_count == 3
    assert offer.status == "removed"
