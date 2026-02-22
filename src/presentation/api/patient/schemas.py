from dataclasses import dataclass
from datetime import datetime

from src.presentation.api.base.schemas import BaseResponseDTO


@dataclass
class CreatePatientRequest:
    """Request schema for creating a patient."""

    first_name: str
    last_name: str


@dataclass
class PatientResponseData:
    """Response data for a patient."""

    id: str
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: datetime


class PatientResponseSchema(BaseResponseDTO[PatientResponseData]):
    """Response schema for a single patient."""


@dataclass
class PatientListItem(PatientResponseData):
    """Schema for a patient in the list."""


@dataclass
class PatientListResponseData:
    """Response data for listing patients."""

    items: list[PatientListItem]
    total: int
    limit: int
    offset: int


class PatientListResponseSchema(BaseResponseDTO[PatientListResponseData]):
    """Response schema for listing patients."""


# Chat message schemas


@dataclass
class ChatMessageResponseData:
    """Response data for a chat message."""

    id: str
    role: str
    content: str
    created_at: datetime


@dataclass
class ChatMessageListResponseData:
    """Response data for listing chat messages."""

    items: list[ChatMessageResponseData]
    total: int
    limit: int
    offset: int


class ChatMessageListResponseSchema(BaseResponseDTO[ChatMessageListResponseData]):
    """Response schema for listing chat messages."""


@dataclass
class SendMessageRequest:
    """Request schema for sending a message."""

    content: str


@dataclass
class SendMessageResponseData:
    """Response data for sending a message."""

    user_message: ChatMessageResponseData
    assistant_message: ChatMessageResponseData


class SendMessageResponseSchema(BaseResponseDTO[SendMessageResponseData]):
    """Response schema for sending a message."""
