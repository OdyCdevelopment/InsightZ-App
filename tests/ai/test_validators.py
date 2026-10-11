"""Tests for offer validation."""

from decimal import Decimal

from ai.llm_extractor import LLMExtractionResult
from ai.validators import (
    calculate_discount_percentage,
    validate_extraction,
)


def test_calculate_discount_percentage_from_prices():
    pct = calculate_discount_percentage(Decimal(1000), Decimal(750))
    assert pct == Decimal("25.00")


def test_mismatched_llm_math_downgrades_confidence():
    extraction = LLMExtractionResult(
        is_offer=True,
        offer_type="percentage_discount",
        title="Half price shirts",
        original_price=1000.0,
        discounted_price=500.0,
        discount_percentage=30.0,
        confidence=0.92,
    )
    draft = validate_extraction(
        extraction=extraction,
        shop_id=1,
        page_id=10,
        source_url="https://shop.example.com/offers/shirts",
    )
    assert draft is not None
    assert draft.discount_percentage == Decimal("50.00")
    assert draft.confidence_score <= Decimal("0.5")


def test_clean_offer_produces_fully_populated_draft():
    extraction = LLMExtractionResult(
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
    draft = validate_extraction(
        extraction=extraction,
        shop_id=2,
        page_id=20,
        source_url="https://shop.example.com/offers/mega-sale",
        image_url="https://shop.example.com/images/sale.jpg",
    )

    assert draft is not None
    assert draft.title == "Mega sale on shirts"
    assert draft.description == "Selected shirts at half price"
    assert draft.offer_type == "percentage_discount"
    assert draft.original_price == Decimal("2000.0")
    assert draft.discounted_price == Decimal("1000.0")
    assert draft.discount_percentage == Decimal("50.00")
    assert draft.discount_amount == Decimal("1000.0")
    assert draft.currency == "LKR"
    assert draft.coupon_code == "SAVE50"
    assert draft.terms_conditions == "Valid on selected items only"
    assert draft.source_url == "https://shop.example.com/offers/mega-sale"
    assert draft.image_url == "https://shop.example.com/images/sale.jpg"
    assert draft.confidence_score == Decimal("0.9300")
    assert draft.review_status == "approved"
