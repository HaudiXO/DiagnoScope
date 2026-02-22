"""Patient-related custom SQLAlchemy types."""

from sqlalchemy import String, TypeDecorator

from src.domain.patient.vo import MessageRole


class MessageRoleType(TypeDecorator):
    """SQLAlchemy type for MessageRole value object."""

    impl = String

    def __init__(self, length: int = 16) -> None:
        super().__init__(length=length)

    def process_bind_param(
        self, value: MessageRole | None, dialect: object
    ) -> str | None:
        if value is None:
            return None
        return value.value

    def process_result_value(
        self, value: str | None, dialect: object
    ) -> MessageRole | None:
        if value is None:
            return None
        return MessageRole(value)
