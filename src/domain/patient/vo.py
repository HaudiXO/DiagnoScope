"""Patient domain value objects."""

from enum import Enum

from src.domain.common.vo.string import NonEmptyString
from src.domain.common.vo.uuid import UUIDValueObject


class PatientId(UUIDValueObject):
    """Patient ID value object (UUID)."""

    pass


class FirstName(NonEmptyString):
    """Patient first name value object."""

    min_length = 1
    max_length = 64


class LastName(NonEmptyString):
    """Patient last name value object."""

    min_length = 1
    max_length = 64


class MessageRole(Enum):
    """Message role (user or assistant)."""

    USER = "user"
    ASSISTANT = "assistant"
