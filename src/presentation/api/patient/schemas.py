from dataclasses import dataclass
from datetime import datetime

from src.presentation.api.base.schemas import BaseResponseDTO


@dataclass
class CreatePatientRequest:
    """Request schema for creating a patient."""

    first_name: str
    last_name: str


@dataclass
class PatientResponseData:
    """Response data for a patient."""

    id: str
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: datetime


class PatientResponseSchema(BaseResponseDTO[PatientResponseData]):
    """Response schema for a single patient."""


@dataclass
class PatientListItem(PatientResponseData):
    """Schema for a patient in the list."""


@dataclass
class PatientListResponseData:
    """Response data for listing patients."""

    items: list[PatientListItem]
    total: int
    limit: int
    offset: int


class PatientListResponseSchema(BaseResponseDTO[PatientListResponseData]):
    """Response schema for listing patients."""
