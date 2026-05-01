"""add vehicle ui fields

Revision ID: 8d2c4f6a1b90
Revises: 3f7c1b2d9a11
Create Date: 2026-05-01 00:03:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8d2c4f6a1b90"
down_revision: Union[str, Sequence[str], None] = "3f7c1b2d9a11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vehicles", sa.Column("year", sa.String(length=10), nullable=True))
    op.add_column("vehicles", sa.Column("title", sa.String(length=100), nullable=True))
    op.add_column("vehicles", sa.Column("color_id", sa.String(length=30), nullable=True))
    op.add_column("vehicles", sa.Column("image_url", sa.String(length=255), nullable=True))
    op.add_column("vehicles", sa.Column("parked_latitude", sa.Float(), nullable=True))
    op.add_column("vehicles", sa.Column("parked_longitude", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("vehicles", "parked_longitude")
    op.drop_column("vehicles", "parked_latitude")
    op.drop_column("vehicles", "image_url")
    op.drop_column("vehicles", "color_id")
    op.drop_column("vehicles", "title")
    op.drop_column("vehicles", "year")
