"""Tests for content hashing."""

from offers_crawler.utils.hashing import content_hash


def test_content_hash_is_stable_for_normalized_text():
    first = content_hash("hello   world")
    second = content_hash("hello world")
    assert first == second
    assert len(first) == 64
