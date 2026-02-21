"""add_user_role_column

Revision ID: c62d76806248
Revises: a1b2c3d4e5f6
Create Date: 2026-02-21 00:01:00.000000

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from src.infrastructure.db.models.types.user import UserRoleType

# revision identifiers, used by Alembic.
revision: str = "c62d76806248"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add role column to users table."""
    op.add_column(
        "users",
        sa.Column("role", UserRoleType(), nullable=False, server_default="doctor"),
    )


def downgrade() -> None:
    """Remove role column from users table."""
    op.drop_column("users", "role")
