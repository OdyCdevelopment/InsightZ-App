"""Tests for rule-based offer detection."""


import pytest

from ai.offer_detector import (
    CONTENT_REGEX_SIGNALS,
    OFFER_CANDIDATE_THRESHOLD,
    STRONG_CANDIDATE_THRESHOLD,
    analyze_page,
    score_text,
)

PERCENT_OFF_POSITIVE = "Save 25% off selected items this weekend"
PERCENT_OFF_NEGATIVE = "Cotton shirt size medium blue"

RS_OFF_POSITIVE = "Rs. 1,500 off on selected laptops"
RS_OFF_NEGATIVE = "Price Rs. 1,500 only"

BOGO_POSITIVE = "Buy 1 get 1 on all socks"
BOGO_NEGATIVE = "Buy socks in assorted colors"

CASHBACK_POSITIVE = "Earn 5% cashback on every purchase"
CASHBACK_NEGATIVE = "Cash back guarantee on build quality"

SPECIAL_OFFER_POSITIVE = "This week's special offer for members"
SPECIAL_OFFER_NEGATIVE = "Especially comfortable fabric"

FREE_DELIVERY_POSITIVE = "Enjoy free delivery on orders above Rs. 5000"
FREE_DELIVERY_NEGATIVE = "Fast delivery within Colombo"

PROMOTION_POSITIVE = "Bank promotion available this month"
PROMOTION_NEGATIVE = "Product image gallery"

SALE_POSITIVE = "Winter sale now on"
SALE_NEGATIVE = "New arrivals this week"

STRONG_OFFER_TEXT = (
    "50% off everything. Buy 1 get 1 free. Special offer with free delivery, "
    "cashback promotion and sale prices. Rs 500 off selected items."
)

PLAIN_PRODUCT_LISTING = (
    "Cotton shirt - blue. Size M. Price Rs. 2,500. "
    "Comfortable fabric for daily wear. Add to cart."
)


@pytest.mark.parametrize(
    ("positive", "negative"),
    [
        (PERCENT_OFF_POSITIVE, PERCENT_OFF_NEGATIVE),
        (RS_OFF_POSITIVE, RS_OFF_NEGATIVE),
        (BOGO_POSITIVE, BOGO_NEGATIVE),
        (CASHBACK_POSITIVE, CASHBACK_NEGATIVE),
        (SPECIAL_OFFER_POSITIVE, SPECIAL_OFFER_NEGATIVE),
        (FREE_DELIVERY_POSITIVE, FREE_DELIVERY_NEGATIVE),
        (PROMOTION_POSITIVE, PROMOTION_NEGATIVE),
        (SALE_POSITIVE, SALE_NEGATIVE),
    ],
)
def test_each_signal_positive_and_negative(positive: str, negative: str):
    positive_score = score_text(positive)
    negative_score = score_text(negative)
    assert positive_score.score > negative_score.score
    assert positive_score.matched_signals


def test_known_offer_text_scores_at_least_strong_threshold():
    result = score_text(STRONG_OFFER_TEXT)
    assert result.score >= STRONG_CANDIDATE_THRESHOLD
    assert result.is_offer_candidate
    assert result.is_strong_candidate


def test_plain_product_listing_scores_below_candidate_threshold():
    result = score_text(PLAIN_PRODUCT_LISTING)
    assert result.score < OFFER_CANDIDATE_THRESHOLD
    assert not result.is_offer_candidate
    assert not result.is_strong_candidate


def test_possible_offer_band_between_thresholds():
    text = "Enjoy free delivery, seasonal promotion, cashback and a sale event"
    result = score_text(text)
    assert OFFER_CANDIDATE_THRESHOLD <= result.score < STRONG_CANDIDATE_THRESHOLD
    assert result.is_offer_candidate
    assert not result.is_strong_candidate


def test_analyze_page_combines_title_and_content():
    result = analyze_page("Mega sale", STRONG_OFFER_TEXT)
    assert result.score >= STRONG_CANDIDATE_THRESHOLD


def test_score_when_all_signals_present():
    text = (
        "50% off Rs 500 off buy 1 get 1 earn cashback special offer "
        "free delivery promotion sale flash sale coupon code SAVE10 "
        "was Rs 2000 now Rs 1000"
    )
    result = score_text(text)
    assert result.score >= STRONG_CANDIDATE_THRESHOLD
    assert len(result.matched_signals) == len(CONTENT_REGEX_SIGNALS)


def test_all_signal_patterns_are_registered():
    assert len(CONTENT_REGEX_SIGNALS) == 11
