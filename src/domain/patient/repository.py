"""Patient repository protocol."""

from abc import abstractmethod
from typing import Protocol

from src.domain.user.vo import UserId

from .entity import Patient
from .vo import PatientId


class PatientRepository(Protocol):
    """Repository for patient entities."""

    @abstractmethod
    async def get_patient(
        self, patient_id: PatientId, doctor_id: UserId
    ) -> Patient | None: ...

    @abstractmethod
    async def list_patients(
        self, doctor_id: UserId, limit: int = 100, offset: int = 0
    ) -> tuple[list[Patient], int]: ...

    @abstractmethod
    async def create_patient(self, patient: Patient) -> Patient: ...

    @abstractmethod
    async def update_patient(self, patient: Patient) -> Patient: ...

    @abstractmethod
    async def delete_patient(
        self, patient_id: PatientId, doctor_id: UserId
    ) -> None: ...
