"""Scrapy extensions."""

import logging

from scrapy import signals

from offers_crawler.browser.playwright_manager import PlaywrightManager

logger = logging.getLogger(__name__)


class PlaywrightExtension:
    """Start and stop the shared Playwright browser pool per spider run."""

    def __init__(self, pool_size: int, user_agent: str):
        self.pool_size = pool_size
        self.user_agent = user_agent
        self.manager: PlaywrightManager | None = None

    @classmethod
    def from_crawler(cls, crawler):
        extension = cls(
            pool_size=int(crawler.settings.get("PLAYWRIGHT_POOL_SIZE", 2)),
            user_agent=crawler.settings.get("USER_AGENT"),
        )
        crawler.signals.connect(extension.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(extension.spider_closed, signal=signals.spider_closed)
        return extension

    def spider_opened(self, spider):
        spider.crawler.playwright_manager = None
        self.manager = PlaywrightManager(pool_size=self.pool_size, user_agent=self.user_agent)
        try:
            self.manager.start()
            spider.crawler.playwright_manager = self.manager
            spider.logger.info("Playwright fallback enabled")
        except Exception:
            spider.logger.warning(
                "Playwright failed to start; continuing with HTML-only crawling",
                exc_info=True,
            )
            try:
                self.manager.close()
            except Exception:
                pass
            self.manager = None
            spider.crawler.playwright_manager = None

    def spider_closed(self, spider):
        if self.manager is not None:
            try:
                self.manager.close()
            except Exception:
                logger.exception("Error while closing Playwright manager")
            self.manager = None
            spider.crawler.playwright_manager = None
