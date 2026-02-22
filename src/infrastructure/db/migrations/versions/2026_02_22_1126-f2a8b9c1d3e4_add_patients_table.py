"""add_patients_table

Revision ID: f2a8b9c1d3e4
Revises: 5898d32bea95
Create Date: 2026-02-22 11:26:00.000000

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

from src.infrastructure.db.models.types.patient import (
    PatientFirstNameType,
    PatientIdType,
    PatientLastNameType,
)
from src.infrastructure.db.models.types.user import UserIdType

# revision identifiers, used by Alembic.
revision: str = "f2a8b9c1d3e4"
down_revision: str | Sequence[str] | None = "5898d32bea95"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create patients table."""
    op.create_table(
        "patients",
        sa.Column("id", PatientIdType(), nullable=False),
        sa.Column("first_name", PatientFirstNameType(length=64), nullable=False),
        sa.Column("last_name", PatientLastNameType(length=64), nullable=False),
        sa.Column("doctor_id", UserIdType(), nullable=False, index=True),
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
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["users.id"],
            name="fk_patients_doctor_id_users",
        ),
    )


def downgrade() -> None:
    """Drop patients table."""
    op.drop_table("patients")
