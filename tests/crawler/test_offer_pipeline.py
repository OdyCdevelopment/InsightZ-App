"""Tests for offer scoring in pages pipeline."""

from unittest.mock import MagicMock, patch

from offers_crawler.items import PageItem
from offers_crawler.pipelines import PagesPipeline

STRONG_OFFER_TEXT = (
    "50% off everything. Buy 1 get 1 free. Special offer with free delivery, "
    "cashback promotion and sale prices. Rs 500 off selected items."
)


@patch("offers_crawler.pipelines.upsert_page", return_value=(True, 42))
def test_pages_pipeline_persists_offer_score(mock_upsert_page):
    pipeline = PagesPipeline()
    spider = MagicMock()
    spider.crawler.stats = MagicMock()

    item = PageItem(
        shop_id=1,
        url="https://shop.example.com/offers",
        canonical_url="https://shop.example.com/offers",
        page_type="sale",
        title="Mega sale",
        content=STRONG_OFFER_TEXT,
        content_hash="hash123",
        http_status=200,
    )

    pipeline.process_item(item, spider)

    mock_upsert_page.assert_called_once()
    kwargs = mock_upsert_page.call_args.kwargs
    assert kwargs["offer_score"] >= 50
    assert kwargs["is_offer_candidate"] is True
    spider.crawler.stats.inc_value.assert_any_call("strong_offer_candidates")
