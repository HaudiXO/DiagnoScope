from dataclasses import dataclass
from datetime import datetime

from src.presentation.api.base.schemas import BaseResponseDTO


@dataclass
class AdminCreateUserRequest:
    """Request schema for admin creating a user."""

    username: str
    first_name: str = ""
    last_name: str | None = None
    role: str = "doctor"
    password: str | None = None


@dataclass
class AdminCreateUserResponseData:
    """Response data for admin creating a user."""

    id: str
    username: str
    first_name: str
    last_name: str | None
    role: str
    language_code: str | None
    is_new: bool


class AdminCreateUserResponseSchema(BaseResponseDTO[AdminCreateUserResponseData]):
    """Response schema for admin creating a user."""


@dataclass
class AdminGetUserResponseData:
    """Response data for admin getting a user."""

    id: str
    username: str
    first_name: str
    last_name: str | None
    role: str
    language_code: str | None
    bio: str | None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime


class AdminGetUserResponseSchema(BaseResponseDTO[AdminGetUserResponseData]):
    """Response schema for admin getting a user."""


@dataclass
class AdminUserListItem(AdminGetUserResponseData):
    """Schema for a single user in the list."""


@dataclass
class AdminListUsersResponseData:
    """Response data for admin listing users."""

    users: list[AdminUserListItem]
    total: int
    limit: int
    offset: int


class AdminListUsersResponseSchema(BaseResponseDTO[AdminListUsersResponseData]):
    """Response schema for admin listing users."""
