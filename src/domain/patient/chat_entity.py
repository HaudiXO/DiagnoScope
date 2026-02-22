"""Chat message domain entity."""

from dataclasses import dataclass
from datetime import datetime

from .vo import MessageRole, PatientId


@dataclass
class ChatMessage:
    """Chat message entity representing a message in a patient conversation."""

    id: str
    patient_id: PatientId
    role: MessageRole
    content: str
    created_at: datetime

    def __str__(self) -> str:
        return (
            f"ChatMessage(id={self.id}, patient_id={self.patient_id.value}, "
            f"role={self.role.value}, content={self.content[:50]}...)"
        )
