"""add parking_lot metadata columns

Revision ID: a1b2c3d4e5f7
Revises: 8d2c4f6a1b90
Create Date: 2026-05-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, Sequence[str], None] = "8d2c4f6a1b90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("parking_lots", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("parking_lots", sa.Column("rating", sa.Float(), nullable=True))
    op.add_column(
        "parking_lots",
        sa.Column("rate_per_hour", sa.String(length=50), nullable=True),
    )
    op.add_column("parking_lots", sa.Column("details", sa.Text(), nullable=True))
    op.add_column("parking_lots", sa.Column("schedule", sa.Text(), nullable=True))
    op.add_column(
        "parking_lots",
        sa.Column("peak_times", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("parking_lots", sa.Column("spots_open", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("parking_lots", "spots_open")
    op.drop_column("parking_lots", "peak_times")
    op.drop_column("parking_lots", "schedule")
    op.drop_column("parking_lots", "details")
    op.drop_column("parking_lots", "rate_per_hour")
    op.drop_column("parking_lots", "rating")
    op.drop_column("parking_lots", "longitude")
