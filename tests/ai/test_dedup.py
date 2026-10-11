"""Tests for offer fingerprinting."""

from decimal import Decimal

from ai.dedup import offer_fingerprint
from ai.validators import ValidatedOfferDraft


def _draft(**overrides) -> ValidatedOfferDraft:
    data = {
        "shop_id": 1,
        "page_id": 10,
        "title": "Samsung Galaxy A15 50% Off",
        "description": None,
        "offer_type": "percentage_discount",
        "original_price": Decimal("50000.00"),
        "discounted_price": Decimal("25000.00"),
        "discount_percentage": Decimal("50.00"),
        "discount_amount": Decimal("25000.00"),
        "currency": "LKR",
        "coupon_code": "SAVE50",
        "valid_from": None,
        "valid_until": None,
        "terms_conditions": None,
        "source_url": "https://shop.example.com/offers/a15",
        "image_url": None,
        "status": "active",
        "review_status": "approved",
        "confidence_score": Decimal("0.9300"),
    }
    data.update(overrides)
    return ValidatedOfferDraft(**data)  # type: ignore[arg-type]


def test_fingerprint_is_stable_for_same_offer():
    first = offer_fingerprint(_draft())
    second = offer_fingerprint(_draft())
    assert first == second
    assert len(first) == 64


def test_fingerprint_changes_when_price_changes():
    first = offer_fingerprint(_draft())
    second = offer_fingerprint(_draft(discounted_price=Decimal("20000.00")))
    assert first != second


def test_fingerprint_ignores_title_whitespace_casing_for_product_key():
    first = offer_fingerprint(_draft(title="Samsung Galaxy A15"))
    second = offer_fingerprint(_draft(title="  samsung   galaxy a15  "))
    assert first == second
