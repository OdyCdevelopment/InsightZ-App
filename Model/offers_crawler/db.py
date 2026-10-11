"""Sync database access for Scrapy pipelines."""

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    create_engine,
    select,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from offers_crawler.config import DATABASE_URL

MISSING_OFFER_THRESHOLD = 3


class Base(DeclarativeBase):
    pass


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    website_url: Mapped[str] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String(255))
    scraping_allowed: Mapped[bool] = mapped_column(Boolean)
    active: Mapped[bool] = mapped_column(Boolean)


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    shop_id: Mapped[int] = mapped_column(BigInteger)
    url: Mapped[str] = mapped_column(String(2048))
    canonical_url: Mapped[str] = mapped_column(String(512))
    page_type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_offer_candidate: Mapped[bool] = mapped_column(Boolean, default=False)
    offer_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal(0))
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    shop_id: Mapped[int] = mapped_column(BigInteger)
    product_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    page_id: Mapped[int] = mapped_column(BigInteger)
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    offer_type: Mapped[str] = mapped_column(String(50))
    original_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    discounted_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    discount_percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    discount_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="LKR")
    coupon_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    terms_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4), nullable=True)
    fingerprint: Mapped[str | None] = mapped_column(String(64), nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
    missing_crawl_count: Mapped[int] = mapped_column(Integer, default=0)
    review_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@dataclass(slots=True)
class ShopRecord:
    id: int
    name: str
    website_url: str
    domain: str
    scraping_allowed: bool
    active: bool


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


def load_shop(shop_id: int) -> ShopRecord | None:
    with get_session() as session:
        shop = session.get(Shop, shop_id)
        if shop is None:
            return None
        return ShopRecord(
            id=shop.id,
            name=shop.name,
            website_url=shop.website_url,
            domain=shop.domain,
            scraping_allowed=shop.scraping_allowed,
            active=shop.active,
        )


def upsert_page(
    shop_id: int,
    url: str,
    canonical_url: str,
    page_type: str,
    title: str | None,
    content: str | None,
    content_hash: str | None,
    http_status: int | None,
    offer_score: Decimal,
    is_offer_candidate: bool,
) -> tuple[bool, int]:
    """Insert or update a page row. Returns content_changed and page_id."""
    now = datetime.now(timezone.utc)
    with get_session() as session:
        existing = session.execute(
            select(Page).where(Page.shop_id == shop_id, Page.canonical_url == canonical_url)
        ).scalar_one_or_none()

        if existing is None:
            page = Page(
                shop_id=shop_id,
                url=url,
                canonical_url=canonical_url,
                page_type=page_type,
                title=title,
                content=content,
                content_hash=content_hash,
                http_status=http_status,
                offer_score=offer_score,
                is_offer_candidate=is_offer_candidate,
                first_seen_at=now,
                last_seen_at=now,
            )
            session.add(page)
            session.flush()
            return True, page.id

        content_changed = existing.content_hash != content_hash
        existing.url = url
        existing.page_type = page_type
        existing.title = title
        existing.content = content
        existing.content_hash = content_hash
        existing.http_status = http_status
        existing.offer_score = offer_score
        existing.is_offer_candidate = is_offer_candidate
        existing.last_seen_at = now
        session.flush()
        return content_changed, existing.id


def insert_offer_draft(draft) -> int:
    """Persist a validated offer draft with deduplication."""
    offer_id, _created = persist_offer_with_dedup(draft)
    return offer_id


def get_offer_by_fingerprint(fingerprint: str) -> int | None:
    with get_session() as session:
        offer = session.execute(
            select(Offer).where(Offer.fingerprint == fingerprint)
        ).scalar_one_or_none()
        return offer.id if offer is not None else None


def get_shop_embedding_candidates(shop_id: int) -> list[tuple[int, list[float]]]:
    with get_session() as session:
        rows = session.execute(
            select(Offer.id, Offer.embedding).where(
                Offer.shop_id == shop_id,
                Offer.embedding.is_not(None),
                Offer.status.in_(("active", "missing")),
            )
        ).all()
        candidates: list[tuple[int, list[float]]] = []
        for offer_id, embedding in rows:
            if embedding is not None:
                candidates.append((offer_id, list(embedding)))
        return candidates


def persist_offer_with_dedup(draft) -> tuple[int, bool]:
    """Insert or merge an offer using exact and fuzzy deduplication."""
    from ai.deduplication import build_dedup_metadata, find_fuzzy_duplicate

    metadata = build_dedup_metadata(draft)
    duplicate_id = get_offer_by_fingerprint(metadata.fingerprint)
    duplicate_reason = "fingerprint" if duplicate_id is not None else None

    if duplicate_id is None:
        fuzzy_id = find_fuzzy_duplicate(
            draft.shop_id,
            metadata.embedding,
            get_shop_embedding_candidates(draft.shop_id),
        )
        if fuzzy_id is not None:
            duplicate_id = fuzzy_id
            duplicate_reason = "embedding"

    now = datetime.now(timezone.utc)
    with get_session() as session:
        if duplicate_id is not None:
            offer = session.get(Offer, duplicate_id)
            if offer is None:
                raise ValueError(f"Duplicate offer {duplicate_id} not found")
            offer.page_id = draft.page_id
            offer.source_url = draft.source_url
            offer.title = draft.title
            offer.description = draft.description
            offer.offer_type = draft.offer_type
            offer.original_price = draft.original_price
            offer.discounted_price = draft.discounted_price
            offer.discount_percentage = draft.discount_percentage
            offer.discount_amount = draft.discount_amount
            offer.currency = draft.currency
            offer.coupon_code = draft.coupon_code
            offer.valid_from = draft.valid_from
            offer.valid_until = draft.valid_until
            offer.terms_conditions = draft.terms_conditions
            offer.image_url = draft.image_url
            offer.confidence_score = draft.confidence_score
            offer.review_status = draft.review_status
            offer.status = "active"
            offer.missing_crawl_count = 0
            offer.fingerprint = metadata.fingerprint
            offer.embedding = metadata.embedding
            offer.updated_at = now
            session.flush()
            return offer.id, False

        offer = Offer(
            shop_id=draft.shop_id,
            product_id=None,
            page_id=draft.page_id,
            title=draft.title,
            description=draft.description,
            offer_type=draft.offer_type,
            original_price=draft.original_price,
            discounted_price=draft.discounted_price,
            discount_percentage=draft.discount_percentage,
            discount_amount=draft.discount_amount,
            currency=draft.currency,
            coupon_code=draft.coupon_code,
            valid_from=draft.valid_from,
            valid_until=draft.valid_until,
            terms_conditions=draft.terms_conditions,
            source_url=draft.source_url,
            image_url=draft.image_url,
            status=draft.status,
            confidence_score=draft.confidence_score,
            fingerprint=metadata.fingerprint,
            embedding=metadata.embedding,
            missing_crawl_count=0,
            review_status=draft.review_status,
            created_at=now,
            updated_at=now,
        )
        session.add(offer)
        session.flush()
        return offer.id, True


def mark_page_offers_missing(page_id: int) -> list[tuple[int, str]]:
    """Increment missing counts for offers tied to a page. Returns id/status pairs."""
    now = datetime.now(timezone.utc)
    updated: list[tuple[int, str]] = []
    with get_session() as session:
        offers = session.execute(
            select(Offer).where(
                Offer.page_id == page_id,
                Offer.status.in_(("active", "missing")),
            )
        ).scalars().all()

        for offer in offers:
            offer.missing_crawl_count += 1
            if offer.missing_crawl_count >= MISSING_OFFER_THRESHOLD:
                offer.status = "removed"
            elif offer.status == "active":
                offer.status = "missing"
            offer.updated_at = now
            updated.append((offer.id, offer.status))
        return updated
