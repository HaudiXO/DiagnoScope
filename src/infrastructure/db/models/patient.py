"""Patient SQLAlchemy ORM model."""

from datetime import datetime

from sqlalchemy import TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from src.domain.patient.vo import FirstName, LastName, PatientId
from src.domain.user.vo import UserId

from .base import BaseORMModel
from .types.patient import (
    PatientFirstNameType,
    PatientIdType,
    PatientLastNameType,
)
from .types.user import UserIdType


class PatientModel(BaseORMModel):
    __tablename__ = "patients"

    id: Mapped[PatientId] = mapped_column(PatientIdType, primary_key=True)
    first_name: Mapped[FirstName] = mapped_column(PatientFirstNameType, nullable=False)
    last_name: Mapped[LastName] = mapped_column(PatientLastNameType, nullable=False)
    doctor_id: Mapped[UserId] = mapped_column(
        UserIdType, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )
