from dataclasses import dataclass

from src.presentation.api.base.schemas import BaseResponseDTO


@dataclass
class LoginRequest:
    """Login request schema."""

    username: str
    password: str


@dataclass
class LoginResponseData:
    """Login response data."""

    access_token: str
    token_type: str


class LoginResponseSchema(BaseResponseDTO[LoginResponseData]):
    """Login response schema."""
