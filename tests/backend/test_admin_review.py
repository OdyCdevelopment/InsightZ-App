"""Tests for admin review workflow and JWT gating."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from app.database import get_db
from app.main import app
from app.models import Offer
from app.services.auth import create_access_token
from fastapi.testclient import TestClient

from ai.llm_extractor import LLMExtractionResult
from ai.validators import validate_extraction


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _offer(**overrides) -> Offer:
    data = {
        "id": 10,
        "shop_id": 1,
        "product_id": None,
        "page_id": 1,
        "title": "Medium confidence laptop deal",
        "description": "20% off",
        "offer_type": "percentage_discount",
        "original_price": Decimal("100000.00"),
        "discounted_price": Decimal("80000.00"),
        "discount_percentage": Decimal("20.00"),
        "discount_amount": Decimal("20000.00"),
        "currency": "LKR",
        "coupon_code": None,
        "valid_from": None,
        "valid_until": None,
        "terms_conditions": None,
        "source_url": "https://shop.example.com/offers/laptop",
        "image_url": None,
        "status": "active",
        "confidence_score": Decimal("0.8000"),
        "fingerprint": "pending-fp",
        "missing_crawl_count": 0,
        "review_status": "pending",
        "created_at": _now(),
        "updated_at": _now(),
    }
    data.update(overrides)
    return Offer(**data)


def test_confidence_0_80_lands_in_pending_review():
    extraction = LLMExtractionResult(
        is_offer=True,
        offer_type="percentage_discount",
        title="Laptop deal",
        original_price=100000.0,
        discounted_price=80000.0,
        discount_percentage=20.0,
        confidence=0.80,
    )
    draft = validate_extraction(
        extraction=extraction,
        shop_id=1,
        page_id=1,
        source_url="https://shop.example.com/offers/laptop",
    )
    assert draft is not None
    assert draft.confidence_score == Decimal("0.8000")
    assert draft.review_status == "pending"


def test_pending_offer_excluded_from_public_list_until_approved():
    pending = _offer(review_status="pending")
    approved = _offer(id=11, review_status="approved", title="Approved deal")

    # Public list session returns only approved (router also filters in SQL).
    session = AsyncMock()
    count_result = MagicMock()
    count_result.scalar_one.return_value = 1
    list_result = MagicMock()
    list_result.scalars.return_value.all.return_value = [approved]
    session.execute = AsyncMock(side_effect=[count_result, list_result])

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        response = client.get("/api/v1/offers")
        assert response.status_code == 200
        titles = [item["title"] for item in response.json()["items"]]
        assert "Approved deal" in titles
        assert pending.title not in titles
    finally:
        app.dependency_overrides.clear()


def test_admin_pending_review_and_approve_reject_flow():
    pending = _offer()
    token = create_access_token("admin")

    session = AsyncMock()
    count_result = MagicMock()
    count_result.scalar_one.return_value = 1
    list_result = MagicMock()
    list_result.scalars.return_value.all.return_value = [pending]

    call_count = {"n": 0}

    async def execute_side_effect(*_args, **_kwargs):
        call_count["n"] += 1
        return count_result if call_count["n"] % 2 == 1 else list_result

    session.execute = AsyncMock(side_effect=execute_side_effect)
    session.get = AsyncMock(return_value=pending)
    session.flush = AsyncMock()
    session.refresh = AsyncMock()

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    try:
        unauthorized = client.get("/admin/offers/pending-review")
        assert unauthorized.status_code in (401, 403)

        pending_resp = client.get("/admin/offers/pending-review", headers=headers)
        assert pending_resp.status_code == 200, pending_resp.text
        assert pending_resp.json()["items"][0]["review_status"] == "pending"
        assert float(pending_resp.json()["items"][0]["confidence_score"]) == 0.8

        approve_resp = client.patch("/admin/offers/10/approve", headers=headers)
        assert approve_resp.status_code == 200
        assert pending.review_status == "approved"
        assert pending.status == "active"

        pending.review_status = "pending"
        reject_resp = client.patch("/admin/offers/10/reject", headers=headers)
        assert reject_resp.status_code == 200
        assert pending.review_status == "rejected"
        assert pending.status == "removed"
    finally:
        app.dependency_overrides.clear()


def test_admin_login_returns_token():
    client = TestClient(app)
    response = client.post("/admin/login", json={"username": "admin", "password": "admin"})
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]
