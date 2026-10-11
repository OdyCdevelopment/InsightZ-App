"""URL normalization and filtering utilities."""

from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

TRACKING_PARAMS = frozenset(
    {
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "fbclid",
        "gclid",
    }
)

EXCLUDED_URL_PATTERNS = (
    "/login",
    "/account",
    "/cart",
    "/checkout",
    "/wishlist",
)

URL_PRIORITY_KEYWORDS = (
    "offer",
    "offers",
    "promotion",
    "promotions",
    "sale",
    "deals",
    "discount",
    "clearance",
    "special",
    "campaign",
    "cashback",
)


def normalize_url(url: str) -> str:
    """Normalize URL: lowercase host, strip tracking params, trim trailing slash."""
    parsed = urlparse(url.strip())
    scheme = parsed.scheme.lower() or "https"
    host = parsed.netloc.lower()
    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")

    filtered_query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key.lower() not in TRACKING_PARAMS
    ]
    query = urlencode(filtered_query, doseq=True)

    return urlunparse((scheme, host, path, "", query, ""))


def is_same_domain(url: str, domain: str) -> bool:
    """Return True when the URL host matches the shop domain."""
    host = urlparse(url).netloc.lower()
    domain_normalized = domain.lower()
    return host == domain_normalized or host.endswith(f".{domain_normalized}")


def is_excluded_url(url: str) -> bool:
    """Return True when the URL path matches excluded patterns."""
    path = urlparse(url).path.lower()
    return any(pattern in path for pattern in EXCLUDED_URL_PATTERNS)


def url_priority_score(url: str) -> int:
    """Score URL path for crawl frontier ordering (higher = crawl sooner)."""
    path = urlparse(url).path.lower()
    return sum(10 for keyword in URL_PRIORITY_KEYWORDS if keyword in path)


def resolve_url(base_url: str, href: str) -> str | None:
    """Resolve and normalize a hyperlink if it is crawlable."""
    if not href or href.startswith(("#", "mailto:", "javascript:", "tel:")):
        return None
    absolute = urljoin(base_url, href)
    parsed = urlparse(absolute)
    if parsed.scheme not in ("http", "https"):
        return None
    return normalize_url(absolute)
