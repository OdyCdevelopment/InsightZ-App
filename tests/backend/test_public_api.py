"""Tests for public REST API surface."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from app.database import get_db
from app.main import app
from app.models import CrawlJob, Offer, Product
from fastapi.testclient import TestClient


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _offer(**overrides) -> Offer:
    data = {
        "id": 1,
        "shop_id": 1,
        "product_id": 1,
        "page_id": 1,
        "title": "Samsung Galaxy A15 50% Off",
        "description": "Phone sale",
        "offer_type": "percentage_discount",
        "original_price": Decimal("50000.00"),
        "discounted_price": Decimal("25000.00"),
        "discount_percentage": Decimal("50.00"),
        "discount_amount": Decimal("25000.00"),
        "currency": "LKR",
        "coupon_code": "SAVE50",
        "valid_from": None,
        "valid_until": None,
        "terms_conditions": None,
        "source_url": "https://shop.example.com/offers/a15",
        "image_url": None,
        "status": "active",
        "confidence_score": Decimal("0.9300"),
        "fingerprint": "abc",
        "missing_crawl_count": 0,
        "review_status": "approved",
        "created_at": _now(),
        "updated_at": _now(),
    }
    data.update(overrides)
    return Offer(**data)


def _product(**overrides) -> Product:
    data = {
        "id": 1,
        "shop_id": 1,
        "name": "Samsung Galaxy A15",
        "sku": "A15",
        "brand": "Samsung",
        "category": "Electronics",
        "product_url": "https://shop.example.com/products/a15",
        "image_url": None,
        "currency": "LKR",
        "created_at": _now(),
        "updated_at": _now(),
    }
    data.update(overrides)
    return Product(**data)


def _crawl(**overrides) -> CrawlJob:
    data = {
        "id": 1,
        "shop_id": 1,
        "started_at": _now(),
        "completed_at": _now(),
        "status": "completed",
        "urls_discovered": 10,
        "urls_crawled": 8,
        "pages_changed": 3,
        "offers_found": 2,
        "error_count": 0,
        "error_message": None,
    }
    data.update(overrides)
    return CrawlJob(**data)


def _session_for_list(items: list) -> AsyncMock:
    session = AsyncMock()
    count_result = MagicMock()
    count_result.scalar_one.return_value = len(items)
    list_result = MagicMock()
    list_result.scalars.return_value.all.return_value = items
    session.execute = AsyncMock(side_effect=[count_result, list_result])
    return session


def test_openapi_includes_phase8_endpoints():
    schema = app.openapi()
    paths = schema["paths"]
    assert "/api/v1/offers" in paths
    assert "/api/v1/offers/{offer_id}" in paths
    assert "/api/v1/products" in paths
    assert "/api/v1/products/{product_id}" in paths
    assert "/api/v1/crawls" in paths
    assert "/api/v1/crawls/{crawl_id}" in paths

    offer_get = paths["/api/v1/offers"]["get"]
    params = {p["name"] for p in offer_get.get("parameters", [])}
    assert {"shop_id", "category", "min_discount", "max_price", "status", "q", "page", "page_size"} <= params


def test_list_offers_paginated():
    offers = [
        _offer(id=2, title="Laptop Deal", discounted_price=Decimal(90000), discount_percentage=Decimal(20)),
        _offer(id=1),
    ]
    session = _session_for_list(offers)

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        response = client.get("/api/v1/offers?page=1&page_size=20")
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["total"] == 2
        assert payload["page"] == 1
        assert len(payload["items"]) == 2
        assert payload["items"][0]["title"] == "Laptop Deal"
        assert payload["items"][0]["source_url"]
    finally:
        app.dependency_overrides.clear()


def test_get_update_delete_offer():
    offer = _offer()
    session = AsyncMock()
    session.get = AsyncMock(return_value=offer)
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        get_resp = client.get("/api/v1/offers/1")
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "Samsung Galaxy A15 50% Off"

        patch_resp = client.patch("/api/v1/offers/1", json={"title": "Updated Offer"})
        assert patch_resp.status_code == 200
        assert offer.title == "Updated Offer"

        delete_resp = client.delete("/api/v1/offers/1")
        assert delete_resp.status_code == 204
        session.delete.assert_awaited()
    finally:
        app.dependency_overrides.clear()


def test_list_and_get_products():
    products = [_product()]
    session = _session_for_list(products)
    session.get = AsyncMock(return_value=products[0])

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        list_resp = client.get("/api/v1/products?category=Electronics")
        assert list_resp.status_code == 200
        assert list_resp.json()["items"][0]["category"] == "Electronics"

        get_resp = client.get("/api/v1/products/1")
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Samsung Galaxy A15"
    finally:
        app.dependency_overrides.clear()


def test_list_and_get_crawls():
    crawls = [_crawl()]
    session = _session_for_list(crawls)
    session.get = AsyncMock(return_value=crawls[0])

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        list_resp = client.get("/api/v1/crawls?shop_id=1&status=completed")
        assert list_resp.status_code == 200
        payload = list_resp.json()
        assert payload["items"][0]["offers_found"] == 2
        assert payload["pages"] == 1

        get_resp = client.get("/api/v1/crawls/1")
        assert get_resp.status_code == 200
        assert get_resp.json()["status"] == "completed"
    finally:
        app.dependency_overrides.clear()
