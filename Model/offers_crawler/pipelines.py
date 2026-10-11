"""Scrapy pipelines."""

import sys
from pathlib import Path

from itemadapter import ItemAdapter

from offers_crawler.db import (
    mark_page_offers_missing,
    persist_offer_with_dedup,
    upsert_page,
)
from offers_crawler.items import PageItem

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from ai.extractor_factory import get_extractor
from ai.offer_detector import analyze_page
from ai.validators import validate_extraction


class PagesPipeline:
    """Persist crawled pages to the database."""

    def process_item(self, item, spider):
        if not isinstance(item, PageItem):
            return item

        adapter = ItemAdapter(item)
        offer_result = analyze_page(
            title=adapter.get("title"),
            content=adapter.get("content"),
        )

        content_changed, page_id = upsert_page(
            shop_id=adapter["shop_id"],
            url=adapter["url"],
            canonical_url=adapter["canonical_url"],
            page_type=adapter["page_type"],
            title=adapter.get("title"),
            content=adapter.get("content"),
            content_hash=adapter.get("content_hash"),
            http_status=adapter.get("http_status"),
            offer_score=offer_result.score,
            is_offer_candidate=offer_result.is_offer_candidate,
        )

        adapter["page_id"] = page_id
        adapter["offer_score"] = offer_result.score
        adapter["is_offer_candidate"] = offer_result.is_offer_candidate
        adapter["is_strong_candidate"] = offer_result.is_strong_candidate
        adapter["content_changed"] = content_changed

        if content_changed:
            spider.crawler.stats.inc_value("pages_changed")
            if not offer_result.is_offer_candidate:
                for _offer_id, status in mark_page_offers_missing(page_id):
                    spider.crawler.stats.inc_value(f"offer_status_{status}")
        if offer_result.is_offer_candidate:
            spider.crawler.stats.inc_value("offer_candidates")
        if offer_result.is_strong_candidate:
            spider.crawler.stats.inc_value("strong_offer_candidates")
        spider.crawler.stats.inc_value("pages_persisted")
        return item


class OfferExtractionPipeline:
    """Extract offers (rule-based by default, LLM optional) and persist drafts."""

    def __init__(self):
        self.extractor = get_extractor()

    @classmethod
    def from_crawler(cls, crawler):
        pipeline = cls()
        pipeline.extractor = get_extractor(
            api_key=crawler.settings.get("LLM_API_KEY"),
            mode=crawler.settings.get("EXTRACTION_MODE"),
        )
        return pipeline

    def _should_extract(self, adapter) -> bool:
        if not adapter.get("content_changed"):
            return False
        # Free rule extractor runs on any offer candidate; LLM stays on strong only.
        if getattr(self.extractor, "extract_on_candidates", False):
            return bool(adapter.get("is_offer_candidate"))
        return bool(adapter.get("is_strong_candidate"))

    def process_item(self, item, spider):
        if not isinstance(item, PageItem):
            return item

        adapter = ItemAdapter(item)
        if not self._should_extract(adapter):
            return item

        extraction = self.extractor.extract(
            title=adapter.get("title"),
            content=adapter.get("content"),
        )
        draft = validate_extraction(
            extraction=extraction,
            shop_id=adapter["shop_id"],
            page_id=adapter["page_id"],
            source_url=adapter["url"],
        )
        if draft is None:
            spider.crawler.stats.inc_value("offers_extracted_skipped")
            mark_page_offers_missing(adapter["page_id"])
            return item

        offer_id, created = persist_offer_with_dedup(draft)
        if created:
            spider.crawler.stats.inc_value("offers_extracted")
        else:
            spider.crawler.stats.inc_value("offers_deduplicated")
        adapter["offer_id"] = offer_id
        adapter["offer_confidence"] = draft.confidence_score
        adapter["offer_created"] = created
        return item
