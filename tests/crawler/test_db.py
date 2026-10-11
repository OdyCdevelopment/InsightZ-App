"""Tests for pages database upsert."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch

from offers_crawler.db import Page, upsert_page


@patch("offers_crawler.db.get_session")
def test_upsert_page_inserts_new_row(mock_get_session):
    session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = session
    session.execute.return_value.scalar_one_or_none.return_value = None

    def _assign_id(page):
        page.id = 1

    session.add.side_effect = _assign_id

    changed, page_id = upsert_page(
        shop_id=1,
        url="https://shop.example.com/offers",
        canonical_url="https://shop.example.com/offers",
        page_type="sale",
        title="Sale",
        content="Big sale",
        content_hash="abc123",
        http_status=200,
        offer_score=Decimal(4),
        is_offer_candidate=False,
    )

    assert changed is True
    assert page_id == 1
    session.add.assert_called_once()


@patch("offers_crawler.db.get_session")
def test_upsert_page_updates_existing_row(mock_get_session):
    session = MagicMock()
    mock_get_session.return_value.__enter__.return_value = session

    existing = Page(
        id=5,
        shop_id=1,
        url="https://shop.example.com/offers",
        canonical_url="https://shop.example.com/offers",
        page_type="sale",
        title="Sale",
        content="Old",
        content_hash="oldhash",
        http_status=200,
        first_seen_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc),
    )
    session.execute.return_value.scalar_one_or_none.return_value = existing

    changed, page_id = upsert_page(
        shop_id=1,
        url="https://shop.example.com/offers",
        canonical_url="https://shop.example.com/offers",
        page_type="sale",
        title="Sale Updated",
        content="New content",
        content_hash="newhash",
        http_status=200,
        offer_score=Decimal(54),
        is_offer_candidate=True,
    )

    assert changed is True
    assert page_id == 5
    assert existing.content_hash == "newhash"
    assert existing.offer_score == Decimal(54)
    assert existing.is_offer_candidate is True
