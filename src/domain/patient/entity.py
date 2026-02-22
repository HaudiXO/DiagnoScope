"""Patient domain entity."""

from dataclasses import dataclass
from datetime import datetime

from ..user.vo import UserId
from .vo import FirstName, LastName, PatientId


@dataclass
class Patient:
    id: PatientId
    first_name: FirstName
    last_name: LastName
    created_at: datetime
    updated_at: datetime
    doctor_id: UserId

    def __str__(self) -> str:
        return (
            f"Patient(id={self.id.value}, first_name={self.first_name}, "
            f"last_name={self.last_name}, doctor_id={self.doctor_id})"
        )
