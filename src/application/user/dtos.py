from enum import StrEnum


class UserRoleDTO(StrEnum):
    """User role enum for DTOs."""

    DOCTOR = "doctor"
    ADMIN = "admin"
