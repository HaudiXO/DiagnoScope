"""Patient repository implementation."""

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert

from src.domain.patient.entity import Patient
from src.domain.patient.repository import PatientRepository
from src.domain.patient.vo import PatientId
from src.domain.user.vo import UserId
from src.infrastructure.db.mappers.patient import PatientMapper
from src.infrastructure.db.models.patient import PatientModel
from src.infrastructure.db.repos.base import BaseSQLAlchemyRepo


class PatientRepositoryImpl(PatientRepository, BaseSQLAlchemyRepo):
    """SQLAlchemy implementation of PatientRepository."""

    async def get_patient(
        self, patient_id: PatientId, doctor_id: UserId
    ) -> Patient | None:
        """Get a patient by ID, scoped to a doctor."""
        stmt = select(PatientModel).where(
            PatientModel.id == patient_id.value,
            PatientModel.doctor_id == doctor_id.value,
        )
        result = await self._session.execute(stmt)
        patient_model = result.scalars().first()
        return PatientMapper.to_domain(patient_model) if patient_model else None

    async def list_patients(
        self, doctor_id: UserId, limit: int = 100, offset: int = 0
    ) -> tuple[list[Patient], int]:
        """List all patients for a doctor with pagination."""
        count_stmt = (
            select(func.count())
            .select_from(PatientModel)
            .where(PatientModel.doctor_id == doctor_id.value)
        )
        count_result = await self._session.execute(count_stmt)
        total = count_result.scalar_one()

        stmt = (
            select(PatientModel)
            .where(PatientModel.doctor_id == doctor_id.value)
            .order_by(PatientModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        patient_models = result.scalars().all()

        patients = [PatientMapper.to_domain(model) for model in patient_models]
        return patients, total

    async def create_patient(self, patient: Patient) -> Patient:
        """Create a new patient."""
        stmt = (
            insert(PatientModel)
            .values(
                id=patient.id.value,
                first_name=patient.first_name.value,
                last_name=patient.last_name.value,
                doctor_id=patient.doctor_id.value,
                created_at=patient.created_at,
                updated_at=patient.updated_at,
            )
            .returning(PatientModel)
        )
        result = await self._session.execute(stmt)
        orm_model = result.scalar_one()
        return PatientMapper.to_domain(orm_model)

    async def update_patient(self, patient: Patient) -> Patient:
        """Update an existing patient."""
        stmt = (
            update(PatientModel)
            .where(
                PatientModel.id == patient.id.value,
                PatientModel.doctor_id == patient.doctor_id.value,
            )
            .values(
                first_name=patient.first_name.value,
                last_name=patient.last_name.value,
                updated_at=patient.updated_at,
            )
            .returning(PatientModel)
        )
        result = await self._session.execute(stmt)
        orm_model = result.scalar_one()
        return PatientMapper.to_domain(orm_model)

    async def delete_patient(self, patient_id: PatientId, doctor_id: UserId) -> None:
        """Delete a patient by ID, scoped to a doctor."""
        stmt = delete(PatientModel).where(
            PatientModel.id == patient_id.value,
            PatientModel.doctor_id == doctor_id.value,
        )
        await self._session.execute(stmt)
