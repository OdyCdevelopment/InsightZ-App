"""Initial schema for MySQL: core tables (embeddings stored as JSON)."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "shops",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("website_url", sa.Text(), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=100), server_default="Sri Lanka", nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("crawl_frequency_minutes", sa.Integer(), server_default="360", nullable=False),
        sa.Column("robots_txt_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scraping_allowed", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("domain"),
    )

    op.create_table(
        "pages",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("canonical_url", sa.String(length=512), nullable=False),
        sa.Column("page_type", sa.String(length=50), server_default="unknown", nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=True),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("is_offer_candidate", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("offer_score", sa.Numeric(precision=5, scale=2), server_default="0", nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("shop_id", "canonical_url", name="uq_pages_shop_canonical_url"),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("sku", sa.String(length=255), nullable=True),
        sa.Column("brand", sa.String(length=255), nullable=True),
        sa.Column("category", sa.String(length=255), nullable=True),
        sa.Column("product_url", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("currency", sa.String(length=10), server_default="LKR", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "offers",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=True),
        sa.Column("page_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("offer_type", sa.String(length=50), nullable=False),
        sa.Column("original_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("discounted_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("discount_percentage", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("discount_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=10), server_default="LKR", nullable=False),
        sa.Column("coupon_code", sa.String(length=100), nullable=True),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("terms_conditions", sa.Text(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="active", nullable=False),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("fingerprint", sa.String(length=64), nullable=True),
        sa.Column("embedding", sa.JSON(), nullable=True),
        sa.Column("missing_crawl_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("review_status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("fingerprint"),
    )

    op.create_table(
        "crawl_jobs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("shop_id", sa.BigInteger(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("urls_discovered", sa.Integer(), server_default="0", nullable=False),
        sa.Column("urls_crawled", sa.Integer(), server_default="0", nullable=False),
        sa.Column("pages_changed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("offers_found", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("crawl_jobs")
    op.drop_table("offers")
    op.drop_table("products")
    op.drop_table("pages")
    op.drop_table("shops")
