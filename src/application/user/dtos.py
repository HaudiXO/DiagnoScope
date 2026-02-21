from dataclasses import dataclass
from enum import StrEnum

from src.domain.user import User


class UserRoleDTO(StrEnum):
    """User role enum for DTOs."""

    DOCTOR = "doctor"
    ADMIN = "admin"


@dataclass
class CreateUserInputDTO:
    id: str
    username: str | None
    first_name: str
    last_name: str | None
    role: UserRoleDTO


@dataclass
class CreateUserOutputDTO:
    id: str
    username: str | None
    first_name: str
    last_name: str | None
    role: UserRoleDTO
    language_code: str | None = None
    is_new: bool = False


def entity_to_dto(user: User) -> CreateUserOutputDTO:
    return CreateUserOutputDTO(
        id=user.id.value,
        username=user.username.value if user.username else None,
        first_name=user.first_name.value,
        last_name=user.last_name.value if user.last_name else None,
        role=UserRoleDTO(user.role.value),
        language_code=user.language_code.value if user.language_code else None,
        is_new=user.is_new,
    )
