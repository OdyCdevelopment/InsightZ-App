"""Tests for social media profile scraping spider."""

from unittest.mock import MagicMock, patch

from offers_crawler.db import ShopRecord
from offers_crawler.items import PageItem
from offers_crawler.spiders.social_media_spider import SocialMediaSpider
from scrapy.http import HtmlResponse


def _shop(website_url: str) -> ShopRecord:
    return ShopRecord(
        id=2,
        name="Social Shop",
        website_url=website_url,
        domain="instagram.com",
        scraping_allowed=True,
        active=True,
    )


@patch("offers_crawler.spiders.social_media_spider.load_shop")
def test_social_media_spider_instagram_parsing(mock_load_shop):
    shop = _shop("https://instagram.com/my_shop")
    mock_load_shop.return_value = shop

    spider = SocialMediaSpider(shop_id="2")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = """
    <html>
        <body>
            <a href="/p/C-x123/">
                <img alt="Amazing 50% discount on shoes! RS 4,500 only." src="img.jpg" />
            </a>
            <a href="/p/D-y456/">
                <img alt="Buy 1 Get 1 Free this weekend!" src="img2.jpg" />
            </a>
        </body>
    </html>
    """
    response = HtmlResponse(
        url="https://instagram.com/my_shop",
        body=html.encode("utf-8"),
        encoding="utf-8",
    )

    results = list(spider.parse_profile(response))
    assert len(results) == 2
    assert all(isinstance(r, PageItem) for r in results)
    
    assert results[0]["url"] == "https://instagram.com/p/C-x123/"
    assert "50% discount" in results[0]["content"]
    assert results[1]["url"] == "https://instagram.com/p/D-y456/"
    assert "Buy 1 Get 1 Free" in results[1]["content"]


@patch("offers_crawler.spiders.social_media_spider.load_shop")
def test_social_media_spider_facebook_parsing(mock_load_shop):
    shop = _shop("https://facebook.com/my_shop")
    mock_load_shop.return_value = shop

    spider = SocialMediaSpider(shop_id="2")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = """
    <html>
        <body>
            <div role="article">
                <div data-ad-preview="message">
                    Mega Clearance Sale: LKR 10,000 off all smart TVs! Visit our outlet today.
                </div>
                <a href="https://facebook.com/my_shop/posts/999">Link</a>
            </div>
        </body>
    </html>
    """
    response = HtmlResponse(
        url="https://facebook.com/my_shop",
        body=html.encode("utf-8"),
        encoding="utf-8",
    )

    results = list(spider.parse_profile(response))
    assert len(results) == 1
    assert results[0]["url"] == "https://facebook.com/my_shop/posts/999"
    assert "Clearance Sale" in results[0]["content"]


@patch("offers_crawler.spiders.social_media_spider.load_shop")
def test_social_media_spider_tiktok_parsing(mock_load_shop):
    shop = _shop("https://tiktok.com/@my_shop")
    mock_load_shop.return_value = shop

    spider = SocialMediaSpider(shop_id="2")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    html = """
    <html>
        <body>
            <a href="https://tiktok.com/@my_shop/video/111" title="10% cashback using Commercial Bank cards.">
                Video
            </a>
        </body>
    </html>
    """
    response = HtmlResponse(
        url="https://tiktok.com/@my_shop",
        body=html.encode("utf-8"),
        encoding="utf-8",
    )

    results = list(spider.parse_profile(response))
    assert len(results) == 1
    assert results[0]["url"] == "https://tiktok.com/@my_shop/video/111"
    assert "cashback" in results[0]["content"]


@patch("offers_crawler.spiders.social_media_spider.load_shop")
def test_social_media_spider_general_fallback(mock_load_shop):
    shop = _shop("https://instagram.com/my_shop")
    mock_load_shop.return_value = shop

    spider = SocialMediaSpider(shop_id="2")
    spider.crawler = MagicMock()
    spider.crawler.stats = MagicMock()

    # Html with no platform-specific elements but containing text matching regex signals
    html = """
    <html>
        <body>
            <p>Welcome to our profile. We publish updates here.</p>
            <div>Special offer for today: 25% off all items!</div>
            <p>Contact us at support@shop.com</p>
        </body>
    </html>
    """
    response = HtmlResponse(
        url="https://instagram.com/my_shop",
        body=html.encode("utf-8"),
        encoding="utf-8",
    )

    results = list(spider.parse_profile(response))
    assert len(results) == 1
    assert "Special offer" in results[0]["content"]
    assert "item-1" in results[0]["url"]
