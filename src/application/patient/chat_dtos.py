"""Chat message application DTOs."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class ChatMessageDTO:
    """DTO for a chat message."""

    id: str
    role: str
    content: str
    created_at: datetime


@dataclass
class GetChatMessagesInputDTO:
    """Input DTO for getting chat messages."""

    patient_id: str
    doctor_id: str
    limit: int = 100
    offset: int = 0


@dataclass
class GetChatMessagesOutputDTO:
    """Output DTO for getting chat messages."""

    items: list[ChatMessageDTO]
    total: int
    limit: int
    offset: int


@dataclass
class SendMessageInputDTO:
    """Input DTO for sending a message."""

    patient_id: str
    doctor_id: str
    content: str


@dataclass
class SendMessageOutputDTO:
    """Output DTO for sending a message."""

    user_message: ChatMessageDTO
    assistant_message: ChatMessageDTO
