from http import HTTPStatus


class ApplicationError(Exception):
    status_code: HTTPStatus = HTTPStatus.INTERNAL_SERVER_ERROR
    default_message: str = "An error occurred"

    def __init__(self, message: str | None = None) -> None:
        self.message = message if message is not None else self.default_message

    def __str__(self) -> str:
        return self.message


class ValidationError(ApplicationError):
    status_code: HTTPStatus = HTTPStatus.BAD_REQUEST
    default_message = "Validation error"
