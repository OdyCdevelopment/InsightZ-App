"""Generic page metadata extraction."""

from urllib.parse import urlparse

PAGE_TYPE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "homepage": ("/", ""),
    "product": ("/product/", "/products/", "/p/"),
    "category": ("/category/", "/categories/", "/collection/", "/collections/"),
    "promotion": ("/promotion/", "/promotions/", "/campaign/", "/campaigns/"),
    "sale": ("/sale/", "/sales/", "/deals/", "/offers/"),
    "blog": ("/blog/", "/news/"),
}


def guess_page_type(url: str) -> str:
    """Guess page type from URL path heuristics."""
    path = urlparse(url).path.lower()
    if path in ("", "/"):
        return "homepage"

    for page_type, patterns in PAGE_TYPE_KEYWORDS.items():
        if page_type == "homepage":
            continue
        for pattern in patterns:
            if pattern in path:
                return page_type

    return "unknown"
