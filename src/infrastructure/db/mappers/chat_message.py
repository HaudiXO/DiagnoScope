"""Chat message mapper for converting between domain entity and ORM model."""

from uuid import uuid4

from src.domain.patient.chat_entity import ChatMessage
from src.domain.patient.vo import MessageRole, PatientId
from src.infrastructure.db.models.chat_message import ChatMessageModel


class ChatMessageMapper:
    """Maps between ChatMessage domain entity and ChatMessageModel ORM model."""

    @staticmethod
    def to_domain(model: ChatMessageModel) -> ChatMessage:
        """Convert ORM model to domain entity.

        Args:
            model: The ORM model to convert.

        Returns:
            The domain entity.
        """
        return ChatMessage(
            id=model.id,
            patient_id=model.patient_id,
            role=model.role,
            content=model.content,
            created_at=model.created_at,
        )

    @staticmethod
    def to_model(entity: ChatMessage) -> ChatMessageModel:
        """Convert domain entity to ORM model.

        Args:
            entity: The domain entity to convert.

        Returns:
            The ORM model.
        """
        return ChatMessageModel(
            id=entity.id,
            patient_id=entity.patient_id,
            role=entity.role,
            content=entity.content,
            created_at=entity.created_at,
        )

    @staticmethod
    def create_model(
        patient_id: PatientId,
        role: MessageRole,
        content: str,
    ) -> ChatMessageModel:
        """Create a new ORM model for a chat message.

        Args:
            patient_id: The patient ID.
            role: The message role.
            content: The message content.

        Returns:
            The new ORM model.
        """
        return ChatMessageModel(
            id=str(uuid4()),
            patient_id=patient_id,
            role=role,
            content=content,
        )
