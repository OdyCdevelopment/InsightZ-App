"""Tests for free rule-based offer extraction."""

from ai.extractor_factory import get_extractor, resolve_extraction_mode
from ai.rule_extractor import RuleBasedExtractor


def test_percentage_discount_extraction():
    result = RuleBasedExtractor().extract(
        "Weekend Mega Sale",
        "Get 40% off all sneakers. Was Rs. 12,000 now Rs. 7,200. Use code SAVE40.",
    )
    assert result.is_offer is True
    assert result.offer_type == "percentage_discount"
    assert result.discount_percentage == 40.0
    assert result.original_price == 12000.0
    assert result.discounted_price == 7200.0
    assert result.coupon_code == "SAVE40"
    assert result.confidence >= 0.7


def test_bogo_extraction():
    result = RuleBasedExtractor().extract(
        "Buy 1 Get 1 Free",
        "Buy one get one free on selected soft drinks this week.",
    )
    assert result.is_offer is True
    assert result.offer_type == "buy_one_get_one"


def test_non_offer_page():
    result = RuleBasedExtractor().extract(
        "About us",
        "We are a family retail business founded in 1998 in Colombo.",
    )
    assert result.is_offer is False


def test_factory_defaults_to_rule_without_key(monkeypatch):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.setenv("EXTRACTION_MODE", "auto")
    assert resolve_extraction_mode(api_key="") == "rule"
    assert isinstance(get_extractor(api_key="", mode="auto"), RuleBasedExtractor)


def test_factory_forces_rule_even_with_key():
    extractor = get_extractor(api_key="sk-test", mode="rule")
    assert isinstance(extractor, RuleBasedExtractor)
