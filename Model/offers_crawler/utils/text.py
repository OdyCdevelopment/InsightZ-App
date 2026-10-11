"""Text extraction helpers."""

import re

from parsel import Selector


def extract_visible_text(html: str) -> str:
    """Extract visible text from HTML, collapsing whitespace."""
    selector = Selector(text=html)
    for tag in ("script", "style", "noscript"):
        for node in selector.xpath(f"//{tag}"):
            node.root.getparent().remove(node.root)

    chunks = selector.xpath("//body//text()").getall()
    text = " ".join(chunk.strip() for chunk in chunks if chunk and chunk.strip())
    return re.sub(r"\s+", " ", text).strip()


def extract_title(html: str) -> str | None:
    """Extract the page title from HTML."""
    selector = Selector(text=html)
    title = selector.xpath("//title/text()").get()
    if title:
        return title.strip()
    return None
