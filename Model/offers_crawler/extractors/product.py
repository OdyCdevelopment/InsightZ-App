"""Product detection heuristics for Playwright fallback."""

from parsel import Selector

SCRIPT_TAG_THRESHOLD = 10

PRODUCT_SELECTORS = (
    "[class*='product']",
    "[data-product]",
    "[data-product-id]",
    "article.product",
    ".product-item",
    ".product-card",
    ".product-grid .item",
)


def count_script_tags(html: str) -> int:
    """Count script tags in raw HTML."""
    return len(Selector(text=html).xpath("//script").getall())


def count_products(html: str) -> int:
    """Estimate product elements present in static HTML."""
    selector = Selector(text=html)
    matches: set[int] = set()
    for css in PRODUCT_SELECTORS:
        for node in selector.css(css):
            matches.add(id(node.root))
    return len(matches)


def needs_playwright_fallback(html: str) -> bool:
    """Return True when static HTML likely needs JS rendering."""
    return count_products(html) == 0 and count_script_tags(html) > SCRIPT_TAG_THRESHOLD
