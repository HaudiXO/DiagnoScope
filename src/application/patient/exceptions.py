"""Patient application exceptions."""

from http import HTTPStatus

from src.application.common.exceptions import ApplicationError


class PatientNotFoundError(ApplicationError):
    """Raised when a patient is not found."""

    status_code: HTTPStatus = HTTPStatus.NOT_FOUND
    default_message = "Patient not found"

    def __init__(self, patient_id: str, message: str | None = None) -> None:
        self.patient_id = patient_id
        super().__init__(message or f"Patient with ID {patient_id} not found")


class PatientAccessDeniedError(ApplicationError):
    """Raised when a doctor tries to access a patient they don't own."""

    status_code: HTTPStatus = HTTPStatus.FORBIDDEN
    default_message = "Access denied to this patient"
