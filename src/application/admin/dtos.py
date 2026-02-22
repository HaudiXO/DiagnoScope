from dataclasses import dataclass
from datetime import datetime

from src.application.user.dtos import UserRoleDTO


@dataclass
class AdminCreateUserInputDTO:
    """Input DTO for admin creating a user."""

    username: str
    first_name: str
    last_name: str | None
    role: UserRoleDTO
    password: str | None = None


@dataclass
class AdminCreateUserOutputDTO:
    """Output DTO for admin creating a user."""

    id: str
    username: str
    first_name: str
    last_name: str | None
    role: UserRoleDTO
    language_code: str | None = None
    is_new: bool = False


@dataclass
class AdminGetUserInputDTO:
    """Input DTO for admin getting a user."""

    user_id: str


@dataclass
class AdminGetUserOutputDTO:
    """Output DTO for admin getting a user."""

    id: str
    username: str
    first_name: str
    last_name: str | None
    role: UserRoleDTO
    language_code: str | None
    bio: str | None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime


@dataclass
class AdminListUsersInputDTO:
    """Input DTO for admin listing users."""

    limit: int = 50
    offset: int = 0


@dataclass
class AdminListUsersOutputDTO:
    """Output DTO for admin listing users."""

    users: list[AdminGetUserOutputDTO]
    total: int
    limit: int
    offset: int


@dataclass
class AdminDeleteUserInputDTO:
    """Input DTO for admin deleting a user."""

    user_id: str
