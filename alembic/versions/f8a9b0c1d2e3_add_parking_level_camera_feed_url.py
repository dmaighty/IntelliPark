"""add parking_levels.camera_feed_url

Revision ID: f8a9b0c1d2e3
Revises: a1b2c3d4e5f7
Create Date: 2026-05-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f8a9b0c1d2e3"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "parking_levels",
        sa.Column("camera_feed_url", sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("parking_levels", "camera_feed_url")
