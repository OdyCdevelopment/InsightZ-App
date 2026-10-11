"""Tests for Playwright integration."""

from pathlib import Path
from unittest.mock import MagicMock, patch

from offers_crawler.db import ShopRecord
from offers_crawler.middlewares import PlaywrightDownloaderMiddleware
from offers_crawler.spiders.generic_spider import GenericShopSpider
from scrapy.http import HtmlResponse, Request

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def _shop() -> ShopRecord:
    return ShopRecord(
        id=1,
        name="Test Shop",
        website_url="https://shop.example.com/",
        domain="shop.example.com",
        scraping_allowed=True,
        active=True,
    )


@patch("offers_crawler.spiders.generic_spider.load_shop", return_value=_shop())
def test_static_page_does_not_schedule_playwright(mock_load_shop):
    spider = GenericShopSpider(shop_id="1")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = FIXTURES / "static_products.html"
    response = HtmlResponse(
        url="https://shop.example.com/products",
        body=html.read_bytes(),
        encoding="utf-8",
        request=Request("https://shop.example.com/products"),
    )

    results = list(spider.parse_page(response))
    playwright_requests = [
        result for result in results if hasattr(result, "meta") and result.meta.get("playwright")
    ]
    items = [result for result in results if not hasattr(result, "callback")]

    assert playwright_requests == []
    assert len(items) == 1
    inc_calls = [call.args[0] for call in spider.crawler.stats.inc_value.call_args_list]
    assert "playwright_fallback_triggered" not in inc_calls


@patch("offers_crawler.spiders.generic_spider.load_shop", return_value=_shop())
def test_js_heavy_page_schedules_playwright(mock_load_shop):
    spider = GenericShopSpider(shop_id="1")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = FIXTURES / "js_heavy_static_shell.html"
    response = HtmlResponse(
        url="https://shop.example.com/products",
        body=html.read_bytes(),
        encoding="utf-8",
        request=Request("https://shop.example.com/products"),
    )

    results = list(spider.parse_page(response))
    playwright_requests = [
        result for result in results if hasattr(result, "meta") and result.meta.get("playwright")
    ]
    items = [result for result in results if not hasattr(result, "callback")]

    assert len(playwright_requests) == 1
    assert items == []
    spider.crawler.stats.inc_value.assert_any_call("playwright_fallback_triggered")


@patch("offers_crawler.spiders.generic_spider.load_shop", return_value=_shop())
def test_playwright_rendered_page_captures_product_content(mock_load_shop):
    spider = GenericShopSpider(shop_id="1")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    rendered = FIXTURES / "js_heavy_rendered.html"
    response = HtmlResponse(
        url="https://shop.example.com/products",
        body=rendered.read_bytes(),
        encoding="utf-8",
        request=Request(
            "https://shop.example.com/products",
            meta={"playwright": True, "playwright_rendered": True},
        ),
    )
    response.meta["playwright_rendered"] = True

    items = [
        result
        for result in spider.parse_page(response)
        if not hasattr(result, "callback")
    ]
    assert len(items) == 1
    assert "Rendered Phone" in items[0]["content"]


def test_playwright_middleware_returns_rendered_html():
    crawler = MagicMock()
    crawler.stats = MagicMock()
    crawler.playwright_manager = MagicMock()
    crawler.playwright_manager.fetch_sync.return_value = (
        FIXTURES / "js_heavy_rendered.html"
    ).read_text(encoding="utf-8")

    middleware = PlaywrightDownloaderMiddleware(crawler)
    spider = MagicMock()
    spider.logger = MagicMock()
    crawler.spider = spider

    request = Request(
        "https://shop.example.com/products",
        meta={"playwright": True, "playwright_rendered": True},
    )

    response = middleware.process_request(request, spider)
    assert response is not None
    assert "Rendered Phone" in response.text
    crawler.playwright_manager.fetch_sync.assert_called_once_with(
        "https://shop.example.com/products"
    )

