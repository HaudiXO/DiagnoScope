"""Chat message repository protocol."""

from abc import abstractmethod
from typing import Protocol

from .chat_entity import ChatMessage
from .vo import MessageRole, PatientId


class ChatMessageRepository(Protocol):
    """Repository for chat message entities."""

    @abstractmethod
    async def get_messages(
        self,
        patient_id: PatientId,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ChatMessage]: ...

    @abstractmethod
    async def create_message(
        self,
        patient_id: PatientId,
        role: MessageRole,
        content: str,
    ) -> ChatMessage: ...

    @abstractmethod
    async def count_messages(self, patient_id: PatientId) -> int: ...
