"""Tests for crawl trigger API endpoint."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from app.database import get_db
from app.main import app
from app.models import Shop
from fastapi.testclient import TestClient


def _shop() -> Shop:
    now = datetime.now(timezone.utc)
    return Shop(
        id=1,
        name="Test Shop",
        website_url="https://shop.example.com/",
        domain="shop.example.com",
        country="Sri Lanka",
        active=True,
        crawl_frequency_minutes=360,
        robots_txt_checked_at=now,
        scraping_allowed=True,
        created_at=now,
        updated_at=now,
    )


@patch("app.api.shops.enqueue_scrape_shop", return_value="task-abc-123")
def test_trigger_shop_crawl_enqueues_task(mock_enqueue):
    shop = _shop()
    session = AsyncMock()
    session.get = AsyncMock(return_value=shop)

    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        response = client.post("/api/v1/shops/1/crawl")
        assert response.status_code == 202, response.text
        payload = response.json()
        assert payload["shop_id"] == 1
        assert payload["task_id"] == "task-abc-123"
        assert payload["status"] == "queued"
        mock_enqueue.assert_called_once_with(1)
    finally:
        app.dependency_overrides.clear()
