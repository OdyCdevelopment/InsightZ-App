"""Scrapy middlewares."""

from scrapy.http import HtmlResponse


class EnforceRobotsTxtMiddleware:
    """No-op on Scrapy 2.13+ — robots are enforced by RobotsTxtMiddleware.

    Older Scrapy exposed crawler.robot_parser; that attribute no longer exists.
    Keeping this class avoids settings breakage while preventing AttributeError.
    """

    def __init__(self, crawler):
        self.crawler = crawler

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def process_request(self, request, spider=None):
        return None


class PlaywrightDownloaderMiddleware:
    """Fetch selected requests through the shared Playwright browser pool."""

    def __init__(self, crawler):
        self.crawler = crawler

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def process_request(self, request, spider=None):
        if not request.meta.get("playwright"):
            return None

        manager = getattr(self.crawler, "playwright_manager", None)
        if manager is None:
            self.crawler.spider.logger.error(
                "Playwright fetch requested but manager is unavailable: %s",
                request.url,
            )
            return None

        self.crawler.stats.inc_value("playwright_fetches")
        self.crawler.spider.logger.info("Playwright fetch: %s", request.url)
        html = manager.fetch_sync(request.url)
        return HtmlResponse(
            url=request.url,
            body=html.encode("utf-8"),
            encoding="utf-8",
            request=request,
        )
