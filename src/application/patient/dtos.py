"""Patient application DTOs."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class PatientListItemDTO:
    """DTO for a patient in the list."""

    id: str
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: datetime


@dataclass
class ListPatientsInputDTO:
    """Input DTO for listing patients."""

    doctor_id: str
    limit: int = 100
    offset: int = 0


@dataclass
class ListPatientsOutputDTO:
    """Output DTO for listing patients."""

    items: list[PatientListItemDTO]
    total: int
    limit: int
    offset: int


@dataclass
class GetPatientInputDTO:
    """Input DTO for getting a patient."""

    patient_id: str
    doctor_id: str


@dataclass
class GetPatientOutputDTO(PatientListItemDTO):
    """Output DTO for getting a patient."""


@dataclass
class CreatePatientInputDTO:
    """Input DTO for creating a patient."""

    first_name: str
    last_name: str
    doctor_id: str


@dataclass
class CreatePatientOutputDTO(PatientListItemDTO):
    """Output DTO for creating a patient."""


@dataclass
class DeletePatientInputDTO:
    """Input DTO for deleting a patient."""

    patient_id: str
    doctor_id: str
