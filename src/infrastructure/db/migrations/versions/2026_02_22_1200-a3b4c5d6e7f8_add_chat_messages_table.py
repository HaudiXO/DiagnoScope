"""add_chat_messages_table

Revision ID: a3b4c5d6e7f8
Revises: f2a8b9c1d3e4
Create Date: 2026-02-22 12:00:00.000000

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from src.infrastructure.db.models.types.chat_message import MessageRoleType
from src.infrastructure.db.models.types.patient import PatientIdType

# revision identifiers, used by Alembic.
revision: str = "a3b4c5d6e7f8"
down_revision: str | Sequence[str] | None = "f2a8b9c1d3e4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create chat_messages table."""
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("patient_id", PatientIdType(), nullable=False, index=True),
        sa.Column("role", MessageRoleType(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            name="fk_chat_messages_patient_id_patients",
        ),
    )


def downgrade() -> None:
    """Drop chat_messages table."""
    op.drop_table("chat_messages")
