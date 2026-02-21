from http import HTTPStatus

from src.application.common.exceptions import ApplicationError


class AdminAccessRequiredError(ApplicationError):
    """Raised when a non-admin user attempts to access admin functionality."""

    status_code: HTTPStatus = HTTPStatus.FORBIDDEN
    default_message = "Admin access required"


class InvalidRoleError(ApplicationError):
    """Raised when an invalid role is provided."""

    status_code: HTTPStatus = HTTPStatus.BAD_REQUEST
    default_message = "Invalid role"

    def __init__(self, allowed_roles: list[str] | None = None) -> None:
        message = (
            f"Invalid role. Must be one of: {', '.join(allowed_roles)}"
            if allowed_roles
            else self.default_message
        )
        super().__init__(message)
