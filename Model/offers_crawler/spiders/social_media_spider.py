"""Spider for scraping offers from social media profiles (Instagram, Facebook, TikTok, Twitter/X)."""

from __future__ import annotations

import scrapy
from scrapy.http import Response

from ai.offer_detector import score_text
from offers_crawler.db import load_shop
from offers_crawler.items import PageItem
from offers_crawler.utils.hashing import content_hash
from offers_crawler.utils.text import extract_visible_text


class SocialMediaSpider(scrapy.Spider):
    name = "social_media"

    def __init__(self, shop_id: str | None = None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if shop_id is None:
            raise ValueError("shop_id spider argument is required")
        self.shop_id = int(shop_id)
        self.shop = load_shop(self.shop_id)
        if self.shop is None:
            raise ValueError(f"Shop {self.shop_id} not found")
        
        self.base_url = self.shop.website_url

    async def start(self):
        """Scrapy 2.13+ entrypoint. Yields a Playwright request for the profile URL."""
        yield scrapy.Request(
            url=self.base_url,
            callback=self.parse_profile,
            meta={
                "playwright": True,
                "playwright_rendered": True,
            },
            dont_filter=True,
        )

    def parse_profile(self, response: Response):
        url_lower = response.url.lower()
        posts: list[dict[str, str]] = []

        if "instagram.com" in url_lower:
            posts = self._parse_instagram(response)
        elif "facebook.com" in url_lower:
            posts = self._parse_facebook(response)
        elif "tiktok.com" in url_lower:
            posts = self._parse_tiktok(response)
        elif "twitter.com" in url_lower or "x.com" in url_lower:
            posts = self._parse_twitter(response)

        # General text-based fallback if no platform-specific elements were matched
        if not posts:
            self.logger.info("No platform-specific posts extracted. Trying general text analysis.")
            posts = self._parse_general_text(response)

        if not posts:
            self.logger.warning("No posts or offer content could be extracted from %s", response.url)
            return

        self.logger.info("Extracted %d social media posts/items", len(posts))

        for post in posts:
            yield PageItem(
                shop_id=self.shop_id,
                url=post["url"],
                canonical_url=post["url"],
                page_type="product",  # Runs through extraction pipeline
                title=post["title"],
                content=post["content"],
                content_hash=content_hash(post["content"]),
                http_status=200,
            )

    def _parse_instagram(self, response: Response) -> list[dict[str, str]]:
        posts: list[dict[str, str]] = []
        # Find anchors containing '/p/' (posts)
        anchors = response.css('a[href*="/p/"]')
        for idx, a in enumerate(anchors):
            href = a.css("::attr(href)").get()
            if not href:
                continue
            post_url = response.urljoin(href)
            
            # Captions are typically inside img alt attribute within the post link
            alt = a.css("img::attr(alt)").get()
            if alt:
                posts.append({
                    "url": post_url,
                    "content": alt.strip(),
                    "title": f"Instagram Post {idx + 1}"
                })
            else:
                # If no alt text, check surrounding text or siblings
                text = a.css("::text").getall()
                combined_text = " ".join(text).strip()
                if combined_text:
                    posts.append({
                        "url": post_url,
                        "content": combined_text,
                        "title": f"Instagram Post {idx + 1}"
                    })
        return posts

    def _parse_facebook(self, response: Response) -> list[dict[str, str]]:
        posts: list[dict[str, str]] = []
        # Facebook post message containers
        message_elements = response.css(
            'div[data-ad-preview="message"], div[data-ad-comet-preview="message"], div[data-testid="post_message"]'
        )
        if not message_elements:
            # General fallback to div/span dir="auto" inside article elements
            message_elements = response.css('div[role="article"] div[dir="auto"], article div[dir="auto"]')

        for idx, elem in enumerate(message_elements):
            text = elem.css("::text").getall()
            combined_text = " ".join(text).strip()
            if len(combined_text) < 15:
                continue
            
            # Find closest post URL or make a relative status link
            post_link_el = elem.xpath('ancestor::*//a[contains(@href, "/posts/") or contains(@href, "/photos/") or contains(@href, "/permalink.php") or contains(@href, "/videos/")]')
            href = post_link_el.css("::attr(href)").get()
            post_url = response.urljoin(href) if href else f"{response.url}/posts/{idx + 1}"

            posts.append({
                "url": post_url,
                "content": combined_text,
                "title": f"Facebook Post {idx + 1}"
            })
        return posts

    def _parse_tiktok(self, response: Response) -> list[dict[str, str]]:
        posts: list[dict[str, str]] = []
        anchors = response.css('a[href*="/video/"]')
        for idx, a in enumerate(anchors):
            href = a.css("::attr(href)").get()
            if not href:
                continue
            post_url = response.urljoin(href)
            
            caption = (
                a.css("::attr(title)").get()
                or a.css("img::attr(alt)").get()
                or a.css('div[data-e2e="user-post-item-desc"]::text').get()
            )
            if caption:
                posts.append({
                    "url": post_url,
                    "content": caption.strip(),
                    "title": f"TikTok Post {idx + 1}"
                })
        return posts

    def _parse_twitter(self, response: Response) -> list[dict[str, str]]:
        posts: list[dict[str, str]] = []
        articles = response.css('article[data-testid="tweet"]')
        for idx, article in enumerate(articles):
            # Extract tweet text
            tweet_text_el = article.css('div[data-testid="tweetText"]')
            if not tweet_text_el:
                continue
            text = tweet_text_el.css("::text").getall()
            combined_text = " ".join(text).strip()
            
            # Extract tweet link
            href_el = article.xpath('.//a[contains(@href, "/status/")]')
            href = href_el.css("::attr(href)").get()
            post_url = response.urljoin(href) if href else f"{response.url}/status/{idx + 1}"
            
            posts.append({
                "url": post_url,
                "content": combined_text,
                "title": f"Twitter Post {idx + 1}"
            })
        return posts

    def _parse_general_text(self, response: Response) -> list[dict[str, str]]:
        """Fallback to extract any text elements on the page that look like offers."""
        posts: list[dict[str, str]] = []
        visible_text = extract_visible_text(response.text)
        if not visible_text:
            return posts

        lines = [line.strip() for line in visible_text.splitlines() if len(line.strip()) > 20]
        # De-duplicate lines
        seen = set()
        unique_lines = []
        for line in lines:
            if line not in seen:
                seen.add(line)
                unique_lines.append(line)

        idx = 1
        for line in unique_lines:
            # Score each line to see if it represents a promotion/offer candidate
            res = score_text(line)
            if res.is_offer_candidate:
                posts.append({
                    "url": f"{response.url}#item-{idx}",
                    "content": line,
                    "title": f"Scraped Offer Item {idx}"
                })
                idx += 1
        return posts
