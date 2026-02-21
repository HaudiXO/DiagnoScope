from dataclasses import dataclass

from src.presentation.api.base.schemas import BaseResponseDTO


@dataclass
class AdminCreateUserRequest:
    """Request schema for admin creating a user."""

    username: str | None = None
    first_name: str = ""
    last_name: str | None = None
    role: str = "doctor"
    password: str | None = None


@dataclass
class AdminCreateUserResponseData:
    """Response data for admin creating a user."""

    id: str
    username: str | None
    first_name: str
    last_name: str | None
    role: str
    language_code: str | None
    is_new: bool


class AdminCreateUserResponseSchema(BaseResponseDTO[AdminCreateUserResponseData]):
    """Response schema for admin creating a user."""
