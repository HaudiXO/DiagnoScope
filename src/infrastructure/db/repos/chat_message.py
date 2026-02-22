"""Chat message repository implementation."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.patient.chat_entity import ChatMessage
from src.domain.patient.vo import MessageRole, PatientId
from src.infrastructure.db.mappers.chat_message import ChatMessageMapper
from src.infrastructure.db.models.chat_message import ChatMessageModel


class ChatMessageRepositoryImpl:
    """Repository implementation for chat messages."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_messages(
        self,
        patient_id: PatientId,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ChatMessage]:
        """Get chat messages for a patient.

        Args:
            patient_id: The patient ID.
            limit: Maximum number of messages to return.
            offset: Number of messages to skip.

        Returns:
            List of chat messages ordered by creation time.
        """
        result = await self._session.execute(
            select(ChatMessageModel)
            .where(ChatMessageModel.patient_id == patient_id)
            .order_by(ChatMessageModel.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        models = result.scalars().all()
        return [ChatMessageMapper.to_domain(model) for model in models]

    async def create_message(
        self,
        patient_id: PatientId,
        role: MessageRole,
        content: str,
    ) -> ChatMessage:
        """Create a new chat message.

        Args:
            patient_id: The patient ID.
            role: The message role.
            content: The message content.

        Returns:
            The created chat message.
        """
        model = ChatMessageMapper.create_model(
            patient_id=patient_id,
            role=role,
            content=content,
        )
        self._session.add(model)
        await self._session.flush()
        return ChatMessageMapper.to_domain(model)

    async def count_messages(self, patient_id: PatientId) -> int:
        """Count chat messages for a patient.

        Args:
            patient_id: The patient ID.

        Returns:
            The number of chat messages.
        """
        result = await self._session.execute(
            select(func.count()).where(ChatMessageModel.patient_id == patient_id)
        )
        return result.scalar() or 0
