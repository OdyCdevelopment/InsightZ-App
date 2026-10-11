"""Scrapy settings."""

import os
from pathlib import Path

from dotenv import load_dotenv

from offers_crawler.config import EXTRACTION_MODE, LLM_API_KEY, PLAYWRIGHT_POOL_SIZE

_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env")

BOT_NAME = "offers_crawler"
SPIDER_MODULES = ["offers_crawler.spiders"]
NEWSPIDER_MODULE = "offers_crawler.spiders"

ROBOTSTXT_OBEY = True
USER_AGENT = os.getenv("USER_AGENT", "SriLankaOfferBot/1.0 (+mailto:you@example.com)")

AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = float(os.getenv("DEFAULT_CRAWL_RATE_LIMIT_SECONDS", "2.5"))
AUTOTHROTTLE_MAX_DELAY = float(os.getenv("DEFAULT_CRAWL_RATE_LIMIT_SECONDS", "2.5")) * 2
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

CONCURRENT_REQUESTS_PER_DOMAIN = 1
DOWNLOAD_DELAY = float(os.getenv("DEFAULT_CRAWL_RATE_LIMIT_SECONDS", "2.5"))

DOWNLOADER_MIDDLEWARES = {
    "scrapy.downloadermiddlewares.robotstxt.RobotsTxtMiddleware": 100,
    "offers_crawler.middlewares.EnforceRobotsTxtMiddleware": 101,
    "offers_crawler.middlewares.PlaywrightDownloaderMiddleware": 150,
}

ITEM_PIPELINES = {
    "offers_crawler.pipelines.PagesPipeline": 300,
    "offers_crawler.pipelines.OfferExtractionPipeline": 400,
}

EXTENSIONS = {
    "offers_crawler.extensions.PlaywrightExtension": 50,
}

PLAYWRIGHT_POOL_SIZE = PLAYWRIGHT_POOL_SIZE
LLM_API_KEY = LLM_API_KEY
EXTRACTION_MODE = EXTRACTION_MODE

LOG_LEVEL = "INFO"
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
