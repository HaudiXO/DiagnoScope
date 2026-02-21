from dataclasses import dataclass

from src.application.user.dtos import UserRoleDTO


@dataclass
class AdminCreateUserInputDTO:
    """Input DTO for admin creating a user."""

    id: int
    username: str | None
    first_name: str
    last_name: str | None
    role: UserRoleDTO
    password: str | None = None
    password: str | None = None


@dataclass
class AdminCreateUserOutputDTO:
    """Output DTO for admin creating a user."""

    id: int
    username: str | None
    first_name: str
    last_name: str | None
    role: UserRoleDTO
    language_code: str | None = None
    is_new: bool = False
