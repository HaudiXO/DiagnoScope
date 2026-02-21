"""User domain value objects."""

from src.domain.common.vo.string import NonEmptyString
from src.domain.common.vo.uuid import UUIDValueObject


class UserRole:
    """User role value object with validation."""

    ALLOWED_ROLES: frozenset[str] = frozenset({"doctor", "admin"})

    def __init__(self, value: str) -> None:
        if not isinstance(value, str):
            raise TypeError(
                f"UserRole value must be a str, got {type(value).__name__!r}"
            )
        if value not in self.ALLOWED_ROLES:
            raise ValueError(
                f"UserRole must be one of {self.ALLOWED_ROLES}, got {value!r}"
            )
        self._value = value

    @property
    def value(self) -> str:
        return self._value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, UserRole):
            return self._value == other._value
        return False

    def __hash__(self) -> int:
        return hash(self._value)

    def __repr__(self) -> str:
        return f"UserRole({self._value!r})"


class UserId(UUIDValueObject):
    """User ID value object (UUID)."""

    pass


class FirstName(NonEmptyString):
    """User first name value object."""

    min_length = 1
    max_length = 64


class LastName(NonEmptyString):
    """User last name value object."""

    min_length = 0
    max_length = 64


class Username(NonEmptyString):
    """User username/handle value object."""

    min_length = 4
    max_length = 32


class Bio(NonEmptyString):
    """User bio/description value object."""

    min_length = 0
    max_length = 160


class LanguageCode(NonEmptyString):
    """User language/locale code value object."""

    min_length = 2
    max_length = 5
