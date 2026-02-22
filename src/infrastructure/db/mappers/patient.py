"""Patient mapper between domain entity and ORM model."""

from src.domain.patient.entity import Patient
from src.infrastructure.db.models.patient import PatientModel


class PatientMapper:
    """Maps between Patient domain entity and PatientModel ORM model."""

    @staticmethod
    def to_domain(model: PatientModel) -> Patient:
        """Convert PatientModel to Patient domain entity."""
        return Patient(
            id=model.id,
            first_name=model.first_name,
            last_name=model.last_name,
            doctor_id=model.doctor_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(patient: Patient) -> PatientModel:
        """Convert Patient domain entity to PatientModel."""
        return PatientModel(
            id=patient.id.value if patient.id is not None else None,
            first_name=patient.first_name,
            last_name=patient.last_name,
            doctor_id=patient.doctor_id,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
        )
