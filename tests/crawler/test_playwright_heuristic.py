"""Tests for Playwright fallback heuristics."""

from pathlib import Path

from offers_crawler.extractors.product import (
    count_products,
    count_script_tags,
    needs_playwright_fallback,
)

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def test_static_page_does_not_need_playwright():
    html = (FIXTURES / "static_products.html").read_text(encoding="utf-8")
    assert count_products(html) > 0
    assert count_script_tags(html) <= 10
    assert needs_playwright_fallback(html) is False


def test_js_heavy_shell_needs_playwright():
    html = (FIXTURES / "js_heavy_static_shell.html").read_text(encoding="utf-8")
    assert count_products(html) == 0
    assert count_script_tags(html) > 10
    assert needs_playwright_fallback(html) is True


def test_rendered_js_page_does_not_need_playwright():
    html = (FIXTURES / "js_heavy_rendered.html").read_text(encoding="utf-8")
    assert count_products(html) > 0
    assert needs_playwright_fallback(html) is False
