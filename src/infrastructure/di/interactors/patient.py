from dishka import Provider, Scope, provide

from src.application.common.transaction import TransactionManager
from src.application.patient.interactors import (
    CreatePatientInteractor,
    DeletePatientInteractor,
    GetPatientInteractor,
    ListPatientsInteractor,
)
from src.domain.patient.repository import PatientRepository
from src.infrastructure.db.holder import HolderDao


class PatientInteractorProvider(Provider):
    """Patient interactor provider."""

    scope = Scope.REQUEST

    @provide
    async def get_patient_repository(
        self,
        holder_dao: HolderDao,
    ) -> PatientRepository:
        return holder_dao.patient_repo

    @provide
    def provide_list_patients_interactor(
        self,
        patient_repository: PatientRepository,
    ) -> ListPatientsInteractor:
        return ListPatientsInteractor(patient_repository)

    @provide
    def provide_get_patient_interactor(
        self,
        patient_repository: PatientRepository,
    ) -> GetPatientInteractor:
        return GetPatientInteractor(patient_repository)

    @provide
    def provide_create_patient_interactor(
        self,
        patient_repository: PatientRepository,
        transaction_manager: TransactionManager,
    ) -> CreatePatientInteractor:
        return CreatePatientInteractor(
            patient_repository=patient_repository,
            transaction_manager=transaction_manager,
        )

    @provide
    def provide_delete_patient_interactor(
        self,
        patient_repository: PatientRepository,
        transaction_manager: TransactionManager,
    ) -> DeletePatientInteractor:
        return DeletePatientInteractor(
            patient_repository=patient_repository,
            transaction_manager=transaction_manager,
        )
