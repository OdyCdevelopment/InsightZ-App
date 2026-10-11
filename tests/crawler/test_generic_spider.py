"""Tests for generic shop spider."""

from pathlib import Path
from unittest.mock import MagicMock, patch

from offers_crawler.db import ShopRecord
from offers_crawler.middlewares import EnforceRobotsTxtMiddleware
from offers_crawler.spiders.generic_spider import GenericShopSpider
from scrapy.http import HtmlResponse, TextResponse

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
def test_parse_page_yields_page_item(mock_load_shop):
    spider = GenericShopSpider(shop_id="1")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = FIXTURES / "sample_home.html"
    response = HtmlResponse(
        url="https://shop.example.com/",
        body=html.read_bytes(),
        encoding="utf-8",
    )

    results = list(spider.parse_page(response))
    items = [result for result in results if not hasattr(result, "callback")]
    follow_requests = [result for result in results if hasattr(result, "callback")]

    assert len(items) == 1
    item = items[0]
    assert item["shop_id"] == 1
    assert item["page_type"] == "homepage"
    assert item["title"] == "Home Deals"
    assert item["content_hash"] is not None
    assert item["http_status"] == 200


@patch("offers_crawler.spiders.generic_spider.load_shop", return_value=_shop())
def test_parse_page_skips_excluded_links(mock_load_shop):
    spider = GenericShopSpider(shop_id="1")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = FIXTURES / "sample_home.html"
    response = HtmlResponse(
        url="https://shop.example.com/",
        body=html.read_bytes(),
        encoding="utf-8",
    )

    follow_requests = []
    for result in spider.parse_page(response):
        if not hasattr(result, "callback"):
            continue
        follow_requests.append(result)

    follow_urls = [request.url for request in follow_requests]
    assert "https://shop.example.com/offers/summer-sale" in follow_urls
    assert all("/login" not in url for url in follow_urls)


@patch("offers_crawler.spiders.generic_spider.load_shop", return_value=_shop())
def test_parse_sitemap_schedules_urls(mock_load_shop):
    spider = GenericShopSpider(shop_id="1")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    sitemap = FIXTURES / "sample_sitemap.xml"
    response = TextResponse(
        url="https://shop.example.com/sitemap.xml",
        body=sitemap.read_bytes(),
        encoding="utf-8",
    )

    requests = list(spider.parse_sitemap(response))
    urls = [request.url for request in requests]
    assert "https://shop.example.com/offers/deals" in urls
    assert "https://shop.example.com/products/item-1" in urls


def test_enforce_robots_middleware_blocks_disallowed_url():
    crawler = MagicMock()
    middleware = EnforceRobotsTxtMiddleware(crawler)
    spider = MagicMock()
    request = MagicMock()
    request.url = "https://shop.example.com/private"

    assert middleware.process_request(request, spider) is None

