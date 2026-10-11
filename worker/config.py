"""Worker configuration from environment variables."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(_ROOT / ".env")


def get_sync_database_url() -> str:
    url = os.getenv(
        "DATABASE_URL",
        "mysql+aiomysql://root:password@127.0.0.1:3306/offers",
    )
    if url.startswith("mysql+aiomysql://"):
        return url.replace("mysql+aiomysql://", "mysql+pymysql://", 1)
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+pymysql://", 1)
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


SYNC_DATABASE_URL = get_sync_database_url()
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
PROJECT_ROOT = _ROOT
CRAWLER_DIR = _ROOT / "crawler"
