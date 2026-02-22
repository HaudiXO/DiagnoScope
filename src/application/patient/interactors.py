"""Patient application interactors."""

from datetime import UTC, datetime

from src.application.common.interactor import Interactor
from src.application.common.transaction import TransactionManager
from src.domain.patient.entity import Patient
from src.domain.patient.repository import PatientRepository
from src.domain.patient.vo import FirstName, LastName, PatientId
from src.domain.user.vo import UserId

from .dtos import (
    CreatePatientInputDTO,
    CreatePatientOutputDTO,
    DeletePatientInputDTO,
    GetPatientInputDTO,
    GetPatientOutputDTO,
    ListPatientsInputDTO,
    ListPatientsOutputDTO,
    PatientListItemDTO,
)
from .exceptions import PatientNotFoundError


class ListPatientsInteractor(Interactor[ListPatientsInputDTO, ListPatientsOutputDTO]):
    """Interactor for listing patients for a doctor."""

    def __init__(self, patient_repository: PatientRepository) -> None:
        self._patient_repository = patient_repository

    async def __call__(self, data: ListPatientsInputDTO) -> ListPatientsOutputDTO:
        """List patients for a doctor with pagination."""
        patients, total = await self._patient_repository.list_patients(
            doctor_id=UserId(data.doctor_id),
            limit=data.limit,
            offset=data.offset,
        )

        items = [
            PatientListItemDTO(
                id=patient.id.value,
                first_name=patient.first_name.value,
                last_name=patient.last_name.value,
                created_at=patient.created_at,
                updated_at=patient.updated_at,
            )
            for patient in patients
        ]

        return ListPatientsOutputDTO(
            items=items,
            total=total,
            limit=data.limit,
            offset=data.offset,
        )


class GetPatientInteractor(Interactor[GetPatientInputDTO, GetPatientOutputDTO]):
    """Interactor for getting a single patient."""

    def __init__(self, patient_repository: PatientRepository) -> None:
        self._patient_repository = patient_repository

    async def __call__(self, data: GetPatientInputDTO) -> GetPatientOutputDTO:
        """Get a patient by ID."""
        patient = await self._patient_repository.get_patient(
            patient_id=PatientId(data.patient_id),
            doctor_id=UserId(data.doctor_id),
        )

        if patient is None:
            raise PatientNotFoundError(data.patient_id)

        return GetPatientOutputDTO(
            id=patient.id.value,
            first_name=patient.first_name.value,
            last_name=patient.last_name.value,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
        )


class CreatePatientInteractor(
    Interactor[CreatePatientInputDTO, CreatePatientOutputDTO]
):
    """Interactor for creating a new patient."""

    def __init__(
        self,
        patient_repository: PatientRepository,
        transaction_manager: TransactionManager,
    ) -> None:
        self._patient_repository = patient_repository
        self._transaction_manager = transaction_manager

    async def __call__(self, data: CreatePatientInputDTO) -> CreatePatientOutputDTO:
        """Create a new patient."""
        now = datetime.now(UTC)
        patient = Patient(
            id=PatientId.generate(),
            first_name=FirstName(data.first_name),
            last_name=LastName(data.last_name),
            doctor_id=UserId(data.doctor_id),
            created_at=now,
            updated_at=now,
        )

        patient = await self._patient_repository.create_patient(patient)
        await self._transaction_manager.commit()

        return CreatePatientOutputDTO(
            id=patient.id.value,
            first_name=patient.first_name.value,
            last_name=patient.last_name.value,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
        )


class DeletePatientInteractor(Interactor[DeletePatientInputDTO, None]):
    """Interactor for deleting a patient."""

    def __init__(
        self,
        patient_repository: PatientRepository,
        transaction_manager: TransactionManager,
    ) -> None:
        self._patient_repository = patient_repository
        self._transaction_manager = transaction_manager

    async def __call__(self, data: DeletePatientInputDTO) -> None:
        """Delete a patient by ID.

        Args:
            data: The patient ID and doctor ID

        Raises:
            PatientNotFoundError: If the patient is not found
        """
        patient = await self._patient_repository.get_patient(
            patient_id=PatientId(data.patient_id),
            doctor_id=UserId(data.doctor_id),
        )
        if patient is None:
            raise PatientNotFoundError(data.patient_id)

        await self._patient_repository.delete_patient(
            patient_id=PatientId(data.patient_id),
            doctor_id=UserId(data.doctor_id),
        )
        await self._transaction_manager.commit()
