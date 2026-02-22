"""Chat message SQLAlchemy ORM model."""

from datetime import datetime

from sqlalchemy import TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from src.domain.patient.vo import MessageRole, PatientId

from .base import BaseORMModel
from .types.chat_message import MessageRoleType
from .types.patient import PatientIdType


class ChatMessageModel(BaseORMModel):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(primary_key=True)
    patient_id: Mapped[PatientId] = mapped_column(
        PatientIdType, ForeignKey("patients.id"), nullable=False, index=True
    )
    role: Mapped[MessageRole] = mapped_column(MessageRoleType, nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
