"""Tests for page type guessing."""

from offers_crawler.extractors.generic import guess_page_type


def test_guess_page_type_homepage():
    assert guess_page_type("https://shop.example.com/") == "homepage"


def test_guess_page_type_product():
    assert guess_page_type("https://shop.example.com/products/shirt") == "product"


def test_guess_page_type_sale():
    assert guess_page_type("https://shop.example.com/offers/sale") == "sale"
