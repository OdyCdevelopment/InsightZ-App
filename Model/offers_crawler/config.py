"""Crawler configuration from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
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


DATABASE_URL = get_sync_database_url()
USER_AGENT = os.getenv("USER_AGENT", "SriLankaOfferBot/1.0 (+mailto:you@example.com)")
DEFAULT_CRAWL_RATE_LIMIT_SECONDS = float(os.getenv("DEFAULT_CRAWL_RATE_LIMIT_SECONDS", "2.5"))
PLAYWRIGHT_POOL_SIZE = int(os.getenv("PLAYWRIGHT_POOL_SIZE", "2"))
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
# auto | rule | llm  — default auto uses free rules when no LLM key is set
EXTRACTION_MODE = os.getenv("EXTRACTION_MODE", "auto")
