"""Tests for URL utilities."""

from offers_crawler.utils.urls import (
    is_excluded_url,
    is_same_domain,
    normalize_url,
    resolve_url,
    url_priority_score,
)


def test_normalize_url_strips_tracking_params_and_trailing_slash():
    url = "https://Example.com/deals/?utm_source=fb&fbclid=abc&keep=1"
    assert normalize_url(url) == "https://example.com/deals?keep=1"


def test_normalize_url_lowercases_host():
    assert normalize_url("https://SHOP.EXAMPLE.COM/Path") == "https://shop.example.com/Path"


def test_is_excluded_url_matches_patterns():
    assert is_excluded_url("https://shop.example.com/account/settings")
    assert not is_excluded_url("https://shop.example.com/offers")


def test_url_priority_score_counts_keywords():
    assert url_priority_score("https://shop.example.com/offers/sale") >= 20


def test_is_same_domain_accepts_subdomain():
    assert is_same_domain("https://www.shop.example.com/deals", "shop.example.com")


def test_resolve_url_rejects_fragment_and_mailto():
    assert resolve_url("https://shop.example.com/", "#section") is None
    assert resolve_url("https://shop.example.com/", "mailto:test@example.com") is None
