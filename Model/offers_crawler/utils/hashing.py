"""Content hashing utilities."""

import hashlib


def content_hash(text: str) -> str:
    """Return SHA-256 hex digest of normalized page text."""
    normalized = " ".join(text.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
