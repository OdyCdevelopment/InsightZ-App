"""Scrapy items for crawled pages."""

import scrapy


class PageItem(scrapy.Item):
    shop_id = scrapy.Field()
    url = scrapy.Field()
    canonical_url = scrapy.Field()
    page_type = scrapy.Field()
    title = scrapy.Field()
    content = scrapy.Field()
    content_hash = scrapy.Field()
    http_status = scrapy.Field()
    page_id = scrapy.Field()
    content_changed = scrapy.Field()
    offer_score = scrapy.Field()
    is_offer_candidate = scrapy.Field()
    is_strong_candidate = scrapy.Field()
    offer_id = scrapy.Field()
    offer_confidence = scrapy.Field()
    offer_created = scrapy.Field()
