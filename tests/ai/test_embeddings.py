"""Tests for embeddings and fuzzy deduplication."""

from unittest.mock import patch

from ai.deduplication import FUZZY_SIMILARITY_THRESHOLD, find_fuzzy_duplicate
from ai.embeddings import cosine_similarity


def test_cosine_similarity_identical_vectors():
    vector = [0.6, 0.8]
    assert cosine_similarity(vector, vector) == 1.0


def test_near_identical_product_names_match_above_threshold():
    """Simulate near-identical titles producing high embedding similarity."""
    base = [0.9, 0.1] + [0.0] * 382
    near = [0.88, 0.12] + [0.0] * 382
    score = cosine_similarity(base, near)
    assert score >= FUZZY_SIMILARITY_THRESHOLD

    match_id = find_fuzzy_duplicate(
        shop_id=1,
        embedding=base,
        candidates=[(42, near), (99, [0.0] * 384)],
    )
    assert match_id == 42


def test_dissimilar_embeddings_do_not_match():
    left = [1.0] + [0.0] * 383
    right = [0.0, 1.0] + [0.0] * 382
    assert cosine_similarity(left, right) < FUZZY_SIMILARITY_THRESHOLD
    assert find_fuzzy_duplicate(1, left, [(7, right)]) is None


@patch("ai.deduplication.generate_embedding")
def test_build_dedup_metadata_uses_title_embedding(mock_generate):
    from decimal import Decimal

    from ai.deduplication import build_dedup_metadata
    from ai.validators import ValidatedOfferDraft

    mock_generate.return_value = [0.1] * 384
    draft = ValidatedOfferDraft(
        shop_id=1,
        page_id=2,
        title="Nike Air Zoom Shoes Sale",
        description=None,
        offer_type="percentage_discount",
        original_price=Decimal(10000),
        discounted_price=Decimal(7000),
        discount_percentage=Decimal(30),
        discount_amount=Decimal(3000),
        currency="LKR",
        coupon_code=None,
        valid_from=None,
        valid_until=None,
        terms_conditions=None,
        source_url="https://shop.example.com/offers/nike",
        image_url=None,
        status="active",
        review_status="approved",
        confidence_score=Decimal("0.91"),
    )
    result = build_dedup_metadata(draft)
    assert len(result.fingerprint) == 64
    assert result.embedding == [0.1] * 384
    mock_generate.assert_called_once_with("Nike Air Zoom Shoes Sale")
