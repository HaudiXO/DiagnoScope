from dishka import Provider, Scope, provide

from src.application.common.transaction import TransactionManager
from src.application.patient import (
    CreatePatientInteractor,
    DeletePatientInteractor,
    GetChatMessagesInteractor,
    GetPatientInteractor,
    ListPatientsInteractor,
    SendMessageInteractor,
)
from src.domain.patient import (
    ChatMessageRepository,
    PatientRepository,
)
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
    async def get_chat_message_repository(
        self,
        holder_dao: HolderDao,
    ) -> ChatMessageRepository:
        return holder_dao.chat_message_repo

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

    @provide
    def provide_get_chat_messages_interactor(
        self,
        patient_repository: PatientRepository,
        chat_message_repository: ChatMessageRepository,
    ) -> GetChatMessagesInteractor:
        return GetChatMessagesInteractor(
            patient_repository=patient_repository,
            chat_message_repository=chat_message_repository,
        )

    @provide
    def provide_send_message_interactor(
        self,
        patient_repository: PatientRepository,
        chat_message_repository: ChatMessageRepository,
        transaction_manager: TransactionManager,
    ) -> SendMessageInteractor:
        return SendMessageInteractor(
            patient_repository=patient_repository,
            chat_message_repository=chat_message_repository,
            transaction_manager=transaction_manager,
        )
