"""Celery application configuration."""

from __future__ import annotations

try:
    import redis.connection
    import redis.utils
    redis.utils.DEFAULT_RESP_VERSION = 2  # type: ignore[attr-defined]
    redis.connection.DEFAULT_RESP_VERSION = 2  # type: ignore[attr-defined]
except Exception:  # noqa: BLE001
    pass

import os
from pathlib import Path

from celery import Celery
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(_ROOT / ".env")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "sri_lanka_offer_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    broker_transport_options={"protocol": 2},
    redis_backend_transport_options={"protocol": 2},
    beat_schedule={
        # Re-evaluate shop cadences every minute; enqueue shops that are due.
        "schedule-due-shop-crawls": {
            "task": "worker.tasks.schedule_due_shops",
            "schedule": 60.0,
        },
    },
)
