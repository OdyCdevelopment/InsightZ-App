"""Sync helpers for crawl job persistence from Celery workers."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    create_engine,
    func,
    select,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from worker.config import SYNC_DATABASE_URL


class Base(DeclarativeBase):
    pass


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    website_url: Mapped[str] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean)
    scraping_allowed: Mapped[bool] = mapped_column(Boolean)
    crawl_frequency_minutes: Mapped[int] = mapped_column(Integer)


class CrawlJob(Base):
    __tablename__ = "crawl_jobs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    shop_id: Mapped[int] = mapped_column(BigInteger)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30))
    urls_discovered: Mapped[int] = mapped_column(Integer, default=0)
    urls_crawled: Mapped[int] = mapped_column(Integer, default=0)
    pages_changed: Mapped[int] = mapped_column(Integer, default=0)
    offers_found: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


engine = create_engine(SYNC_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@dataclass(slots=True)
class ShopScheduleRecord:
    id: int
    website_url: str
    crawl_frequency_minutes: int
    active: bool
    scraping_allowed: bool



@dataclass(slots=True)
class CrawlStats:
    urls_discovered: int = 0
    urls_crawled: int = 0
    pages_changed: int = 0
    offers_found: int = 0
    error_count: int = 0
    error_message: str | None = None


@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_crawl_job(shop_id: int) -> int:
    now = datetime.now(timezone.utc)
    with get_session() as session:
        job = CrawlJob(
            shop_id=shop_id,
            started_at=now,
            completed_at=None,
            status="running",
            urls_discovered=0,
            urls_crawled=0,
            pages_changed=0,
            offers_found=0,
            error_count=0,
            error_message=None,
        )
        session.add(job)
        session.flush()
        return job.id


def complete_crawl_job(job_id: int, stats: CrawlStats, status: str = "completed") -> None:
    now = datetime.now(timezone.utc)
    with get_session() as session:
        job = session.get(CrawlJob, job_id)
        if job is None:
            raise ValueError(f"Crawl job {job_id} not found")
        job.completed_at = now
        job.status = status
        job.urls_discovered = stats.urls_discovered
        job.urls_crawled = stats.urls_crawled
        job.pages_changed = stats.pages_changed
        job.offers_found = stats.offers_found
        job.error_count = stats.error_count
        job.error_message = stats.error_message


def get_shop_for_crawl(shop_id: int) -> ShopScheduleRecord | None:
    with get_session() as session:
        shop = session.get(Shop, shop_id)
        if shop is None:
            return None
        return ShopScheduleRecord(
            id=shop.id,
            website_url=shop.website_url,
            crawl_frequency_minutes=shop.crawl_frequency_minutes,
            active=shop.active,
            scraping_allowed=shop.scraping_allowed,
        )


def list_due_shop_ids(now: datetime | None = None) -> list[int]:
    """Return active, scrape-allowed shops whose cadence has elapsed."""
    now = now or datetime.now(timezone.utc)
    due: list[int] = []
    with get_session() as session:
        shops = session.execute(
            select(Shop).where(Shop.active.is_(True), Shop.scraping_allowed.is_(True))
        ).scalars().all()

        for shop in shops:
            last_completed = session.execute(
                select(func.max(CrawlJob.completed_at)).where(
                    CrawlJob.shop_id == shop.id,
                    CrawlJob.status.in_(("completed", "failed")),
                )
            ).scalar_one()

            if last_completed is None:
                due.append(shop.id)
                continue

            if last_completed.tzinfo is None:
                last_completed = last_completed.replace(tzinfo=timezone.utc)

            elapsed = now - last_completed
            if elapsed >= timedelta(minutes=shop.crawl_frequency_minutes):
                due.append(shop.id)

    return due
