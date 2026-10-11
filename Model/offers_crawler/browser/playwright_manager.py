"""Long-lived async Playwright browser pool with sync bridge for Scrapy."""

from __future__ import annotations

import asyncio
import logging
import sys
import threading
from typing import TYPE_CHECKING

from offers_crawler.config import USER_AGENT
from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    async_playwright,
)

if TYPE_CHECKING:
    from collections.abc import Coroutine

logger = logging.getLogger(__name__)


class PlaywrightManager:
    """Reuse browser contexts/pages across URLs instead of one browser per URL."""

    def __init__(self, pool_size: int = 2, user_agent: str = USER_AGENT) -> None:
        self.pool_size = pool_size
        self.user_agent = user_agent
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._ready = threading.Event()
        self._start_error: BaseException | None = None
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page_queue: asyncio.Queue[Page] | None = None

    def start(self) -> None:
        if self._thread is not None:
            return

        self._thread = threading.Thread(target=self._run_loop, name="playwright-manager", daemon=True)
        self._thread.start()
        if not self._ready.wait(timeout=120):
            raise RuntimeError("Playwright manager failed to start (timeout)")
        if self._start_error is not None:
            raise RuntimeError(f"Playwright manager failed to start: {self._start_error}") from self._start_error

    def _create_loop(self) -> asyncio.AbstractEventLoop:
        # Scrapy on Windows installs SelectorEventLoopPolicy, which cannot spawn
        # subprocesses. Playwright needs ProactorEventLoop for browser launch.
        if sys.platform == "win32":
            return asyncio.ProactorEventLoop()
        return asyncio.new_event_loop()

    def _run_loop(self) -> None:
        self._loop = self._create_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._async_start())
            self._ready.set()
            self._loop.run_forever()
        except BaseException as exc:
            self._start_error = exc
            logger.exception("Playwright browser pool failed to start")
            self._ready.set()
        finally:
            try:
                if self._loop.is_running():
                    self._loop.stop()
                if not self._loop.is_closed():
                    self._loop.run_until_complete(self._async_close())
            except Exception:
                logger.exception("Playwright cleanup failed")
            try:
                self._loop.close()
            except Exception:
                pass

    async def _async_start(self) -> None:
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(headless=True)
        self._context = await self._browser.new_context(user_agent=self.user_agent)
        self._page_queue = asyncio.Queue()
        for _ in range(self.pool_size):
            page = await self._context.new_page()
            await self._page_queue.put(page)
        logger.info("Playwright browser pool started with %s pages", self.pool_size)

    async def _fetch(self, url: str) -> str:
        if self._page_queue is None:
            raise RuntimeError("Playwright manager is not started")

        page = await self._page_queue.get()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            return await page.content()
        finally:
            await self._page_queue.put(page)

    async def _async_close(self) -> None:
        if self._context is not None:
            await self._context.close()
            self._context = None
        if self._browser is not None:
            await self._browser.close()
            self._browser = None
        if self._playwright is not None:
            await self._playwright.stop()
            self._playwright = None
        logger.info("Playwright browser pool stopped")

    def _run_coroutine(self, coro: Coroutine) -> object:
        if self._loop is None or self._loop.is_closed():
            raise RuntimeError("Playwright manager is not started")
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result(timeout=90)

    def fetch_sync(self, url: str) -> str:
        """Fetch rendered HTML synchronously for Scrapy middleware."""
        html = self._run_coroutine(self._fetch(url))
        return str(html)

    def close(self) -> None:
        if self._loop is None or self._thread is None:
            return
        try:
            if not self._loop.is_closed():
                self._loop.call_soon_threadsafe(self._loop.stop)
        except RuntimeError:
            pass
        self._thread.join(timeout=30)
        self._thread = None
