"""migrate vehicles from driver_id to user_id

Revision ID: 3f7c1b2d9a11
Revises: b74e5ee31f63
Create Date: 2026-04-30 23:58:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3f7c1b2d9a11"
down_revision: Union[str, Sequence[str], None] = "b74e5ee31f63"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vehicles", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_vehicles_user_id_users",
        "vehicles",
        "users",
        ["user_id"],
        ["id"],
    )

    op.execute(
        sa.text(
            """
            UPDATE vehicles v
            SET user_id = d.user_id
            FROM drivers d
            WHERE v.driver_id = d.id
            """
        )
    )

    op.alter_column("vehicles", "user_id", nullable=False)

    op.drop_constraint("vehicles_driver_id_fkey", "vehicles", type_="foreignkey")
    op.drop_column("vehicles", "driver_id")


def downgrade() -> None:
    op.add_column("vehicles", sa.Column("driver_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "vehicles_driver_id_fkey",
        "vehicles",
        "drivers",
        ["driver_id"],
        ["id"],
    )

    op.execute(
        sa.text(
            """
            UPDATE vehicles v
            SET driver_id = d.id
            FROM drivers d
            WHERE v.user_id = d.user_id
            """
        )
    )

    op.alter_column("vehicles", "driver_id", nullable=False)

    op.drop_constraint("fk_vehicles_user_id_users", "vehicles", type_="foreignkey")
    op.drop_column("vehicles", "user_id")
