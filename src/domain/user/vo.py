"""User domain value objects."""

from src.domain.common.vo.integer import PositiveInteger
from src.domain.common.vo.string import NonEmptyString


class UserId(PositiveInteger):
    """User ID value object."""
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


class ReferralCount:
    """Non-negative integer for referral count."""

    def __init__(self, value: int) -> None:
        if not isinstance(value, int):
            raise TypeError("ReferralCount value must be an int")
        if value < 0:
            raise ValueError("ReferralCount cannot be negative")
        self._value = value

    @property
    def value(self) -> int:
        return self._value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, ReferralCount):
            return self._value == other._value
        return False

    def __hash__(self) -> int:
        return hash(self._value)

    def __repr__(self) -> str:
        return f"ReferralCount({self._value})"


class LanguageCode(NonEmptyString):
    """User language/locale code value object."""
    min_length = 2
    max_length = 5
