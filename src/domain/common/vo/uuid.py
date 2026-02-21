"""UUID value object."""

from typing import Self, override
import uuid

from src.domain.common.vo.base import BaseValueObject


class UUIDValueObject(BaseValueObject[str]):
    """UUID value object that validates and stores UUID strings."""

    __slots__ = ()

    @override
    @classmethod
    def _validate(cls, value: str | Self) -> None:
        cls._validate_type(value)
        cls._validate_uuid(value)

    @classmethod
    def _validate_type(cls, value: str | Self) -> None:
        if not isinstance(value, str) and not isinstance(value, cls):
            error_msg = (
                f"{cls.__name__} value must be a str, got {type(value).__name__!r}"
            )
            raise TypeError(error_msg)

    @classmethod
    def _validate_uuid(cls, value: str | Self) -> None:
        try:
            uuid.UUID(value if isinstance(value, str) else value.value)
        except ValueError as e:
            error_msg = f"{cls.__name__} value must be a valid UUID, got {value!r}"
            raise ValueError(error_msg) from e

    @classmethod
    def generate(cls) -> Self:
        """Generate a new UUID value object."""
        return cls(str(uuid.uuid4()))
