"""initial_schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-02-21 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from src.infrastructure.db.models.types.user import (
    BioType,
    FirstNameType,
    LastNameType,
    UserIdType,
    UsernameType,
)

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create initial schema."""
    op.create_table(
        "users",
        sa.Column("id", UserIdType(), nullable=False),
        sa.Column("first_name", FirstNameType(length=64), nullable=False),
        sa.Column("last_name", LastNameType(length=64), nullable=True),
        sa.Column("username", UsernameType(length=32), nullable=False, unique=True),
        sa.Column("bio", BioType(length=160), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "last_login_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "language_code",
            sa.String(5),
            server_default="en",
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table("users")
