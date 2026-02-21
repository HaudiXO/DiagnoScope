from http import HTTPStatus

from src.application.common.exceptions import ApplicationError, ValidationError


class InvalidInitDataError(ValidationError):
    """Raised when init data validation fails."""

    default_message = "Invalid init data"


class AuthenticationError(ApplicationError):
    """Base class for authentication errors."""

    status_code: HTTPStatus = HTTPStatus.UNAUTHORIZED
    default_message = "Authentication required"


class MissingUserIdError(AuthenticationError):
    """Raised when user ID header is missing."""

    default_message = "User ID header is required"


class InvalidUserIdError(ValidationError):
    """Raised when user ID header value is invalid."""

    status_code: HTTPStatus = HTTPStatus.BAD_REQUEST
    default_message = "Invalid UserID header value. Must be an integer."
