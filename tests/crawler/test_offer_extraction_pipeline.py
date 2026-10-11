"""End-to-end tests for offer extraction pipeline."""

from decimal import Decimal
from unittest.mock import MagicMock, patch

from offers_crawler.items import PageItem
from offers_crawler.pipelines import OfferExtractionPipeline

from ai.llm_extractor import LLMExtractionResult

CLEAN_EXTRACTION = LLMExtractionResult(
    is_offer=True,
    offer_type="percentage_discount",
    title="Mega sale on shirts",
    description="Selected shirts at half price",
    original_price=2000.0,
    discounted_price=1000.0,
    discount_percentage=50.0,
    discount_amount=1000.0,
    currency="LKR",
    coupon_code="SAVE50",
    valid_from="2026-08-01",
    valid_until="2026-08-31",
    terms_conditions="Valid on selected items only",
    confidence=0.93,
)

MISMATCHED_EXTRACTION = LLMExtractionResult(
    is_offer=True,
    offer_type="percentage_discount",
    title="Half price shirts",
    original_price=1000.0,
    discounted_price=500.0,
    discount_percentage=30.0,
    confidence=0.92,
)


@patch("offers_crawler.pipelines.persist_offer_with_dedup", return_value=(99, True))
def test_offer_extraction_pipeline_persists_clean_draft(mock_persist):
    pipeline = OfferExtractionPipeline()
    pipeline.extractor = MagicMock()
    pipeline.extractor.extract.return_value = CLEAN_EXTRACTION

    spider = MagicMock()
    spider.crawler.stats = MagicMock()

    item = PageItem(
        shop_id=1,
        url="https://shop.example.com/offers/mega-sale",
        canonical_url="https://shop.example.com/offers/mega-sale",
        page_type="sale",
        title="Mega sale",
        content="50% off shirts today",
        content_hash="hash",
        http_status=200,
        page_id=10,
        content_changed=True,
        is_strong_candidate=True,
        offer_score=Decimal(60),
        is_offer_candidate=True,
    )

    result = pipeline.process_item(item, spider)
    draft = mock_persist.call_args.args[0]

    assert result["offer_id"] == 99
    assert result["offer_created"] is True
    assert draft.title == "Mega sale on shirts"
    assert draft.discount_percentage == Decimal("50.00")
    assert draft.confidence_score == Decimal("0.9300")
    spider.crawler.stats.inc_value.assert_any_call("offers_extracted")


@patch("offers_crawler.pipelines.persist_offer_with_dedup", return_value=(100, True))
def test_offer_extraction_pipeline_downgrades_bad_math(mock_persist):
    pipeline = OfferExtractionPipeline()
    pipeline.extractor = MagicMock()
    pipeline.extractor.extract.return_value = MISMATCHED_EXTRACTION

    spider = MagicMock()
    spider.crawler.stats = MagicMock()

    item = PageItem(
        shop_id=1,
        url="https://shop.example.com/offers/shirts",
        canonical_url="https://shop.example.com/offers/shirts",
        page_type="sale",
        title="Sale",
        content="50% off shirts",
        content_hash="hash2",
        http_status=200,
        page_id=11,
        content_changed=True,
        is_strong_candidate=True,
        offer_score=Decimal(55),
        is_offer_candidate=True,
    )

    pipeline.process_item(item, spider)
    draft = mock_persist.call_args.args[0]
    assert draft.confidence_score <= Decimal("0.5")


@patch("offers_crawler.pipelines.persist_offer_with_dedup", return_value=(55, False))
def test_offer_extraction_pipeline_counts_deduplicated(mock_persist):
    pipeline = OfferExtractionPipeline()
    pipeline.extractor = MagicMock()
    pipeline.extractor.extract.return_value = CLEAN_EXTRACTION

    spider = MagicMock()
    spider.crawler.stats = MagicMock()

    item = PageItem(
        shop_id=1,
        url="https://shop.example.com/offers/mega-sale",
        canonical_url="https://shop.example.com/offers/mega-sale",
        page_type="sale",
        title="Mega sale",
        content="50% off shirts today",
        content_hash="hash",
        http_status=200,
        page_id=10,
        content_changed=True,
        is_strong_candidate=True,
        offer_score=Decimal(60),
        is_offer_candidate=True,
    )

    pipeline.process_item(item, spider)
    spider.crawler.stats.inc_value.assert_any_call("offers_deduplicated")


def test_offer_extraction_pipeline_skips_non_candidates():
    pipeline = OfferExtractionPipeline()
    pipeline.extractor = MagicMock()
    pipeline.extractor.extract_on_candidates = True

    spider = MagicMock()
    spider.crawler.stats = MagicMock()

    item = PageItem(
        shop_id=1,
        url="https://shop.example.com/about",
        canonical_url="https://shop.example.com/about",
        page_type="other",
        title="About us",
        content="Company history",
        content_hash="hash3",
        http_status=200,
        page_id=12,
        content_changed=True,
        is_strong_candidate=False,
        offer_score=Decimal(5),
        is_offer_candidate=False,
    )

    pipeline.process_item(item, spider)
    pipeline.extractor.extract.assert_not_called()


@patch("offers_crawler.pipelines.persist_offer_with_dedup", return_value=(77, True))
def test_rule_mode_extracts_offer_candidates(mock_persist):
    pipeline = OfferExtractionPipeline()
    pipeline.extractor = MagicMock()
    pipeline.extractor.extract_on_candidates = True
    pipeline.extractor.extract.return_value = CLEAN_EXTRACTION

    spider = MagicMock()
    spider.crawler.stats = MagicMock()

    item = PageItem(
        shop_id=1,
        url="https://shop.example.com/offers",
        canonical_url="https://shop.example.com/offers",
        page_type="sale",
        title="Sale",
        content="free delivery promotion 20% off",
        content_hash="hash3",
        http_status=200,
        page_id=12,
        content_changed=True,
        is_strong_candidate=False,
        offer_score=Decimal(25),
        is_offer_candidate=True,
    )

    pipeline.process_item(item, spider)
    pipeline.extractor.extract.assert_called_once()
    mock_persist.assert_called_once()
