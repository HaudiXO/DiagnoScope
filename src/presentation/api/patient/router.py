from collections.abc import Sequence
import logging
from typing import cast

from dishka.integrations.litestar import FromDishka, inject
from litestar import Controller, Router, delete, get, post
from litestar.params import Parameter
from litestar.status_codes import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT

from src.application.patient import (
    CreatePatientInputDTO,
    CreatePatientInteractor,
    CreatePatientOutputDTO,
    DeletePatientInputDTO,
    DeletePatientInteractor,
    GetChatMessagesInputDTO,
    GetChatMessagesInteractor,
    GetChatMessagesOutputDTO,
    GetPatientInputDTO,
    GetPatientInteractor,
    GetPatientOutputDTO,
    ListPatientsInputDTO,
    ListPatientsInteractor,
    ListPatientsOutputDTO,
    SendMessageInputDTO,
    SendMessageInteractor,
    SendMessageOutputDTO,
)
from src.application.patient.dtos import PatientListItemDTO
from src.domain.user.vo import UserId
from src.presentation.api.patient.schemas import (
    ChatMessageListResponseData,
    ChatMessageListResponseSchema,
    ChatMessageResponseData,
    CreatePatientRequest,
    PatientListItem,
    PatientListResponseData,
    PatientListResponseSchema,
    PatientResponseData,
    PatientResponseSchema,
    SendMessageRequest,
    SendMessageResponseData,
    SendMessageResponseSchema,
)

logger = logging.getLogger(__name__)


class DoctorPatientController(Controller):
    """Controller for doctor patient management endpoints."""

    path: str = "/patients"
    tags: Sequence[str] | None = ["patients"]

    @get(
        "/",
        status_code=HTTP_200_OK,
        return_dto=PatientListResponseSchema,
    )
    @inject
    async def list_patients(
        self,
        user_id: UserId,
        interactor: FromDishka[ListPatientsInteractor],
        limit: int = Parameter(query="limit", default=100, ge=1, le=500),
        offset: int = Parameter(query="offset", default=0, ge=0),
    ) -> PatientListResponseData:
        """List all patients for the authenticated doctor.

        Args:
            user_id: The authenticated doctor's user ID
            interactor: The list patients interactor
            limit: Maximum number of patients to return
            offset: Number of patients to skip

        Returns:
            Paginated list of patients
        """
        result: ListPatientsOutputDTO = await interactor(
            data=ListPatientsInputDTO(
                doctor_id=user_id.value,
                limit=limit,
                offset=offset,
            )
        )

        items = [
            cast(
                PatientListItem,
                self._patient_output_to_response_data(item, PatientListItem),
            )
            for item in result.items
        ]

        return PatientListResponseData(
            items=items,
            total=result.total,
            limit=result.limit,
            offset=result.offset,
        )

    @staticmethod
    def _patient_output_to_response_data(
        patient: PatientListItemDTO, cls: type[PatientResponseData | PatientListItem]
    ) -> PatientResponseData | PatientListItem:
        """Convert GetPatientOutputDTO to PatientResponseData."""
        return cls(
            id=patient.id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
        )

    @post(
        "/",
        status_code=HTTP_201_CREATED,
        return_dto=PatientResponseSchema,
    )
    @inject
    async def create_patient(
        self,
        data: CreatePatientRequest,
        user_id: UserId,
        interactor: FromDishka[CreatePatientInteractor],
    ) -> PatientResponseData:
        """Create a new patient.

        Args:
            data: Patient creation data
            user_id: The authenticated doctor's user ID
            interactor: The create patient interactor

        Returns:
            The created patient data
        """
        result: CreatePatientOutputDTO = await interactor(
            data=CreatePatientInputDTO(
                first_name=data.first_name,
                last_name=data.last_name,
                doctor_id=user_id.value,
            )
        )

        return self._patient_output_to_response_data(result, PatientResponseData)

    @get(
        "/{patient_id:str}",
        status_code=HTTP_200_OK,
        return_dto=PatientResponseSchema,
    )
    @inject
    async def get_patient(
        self,
        user_id: UserId,
        patient_id: str,
        interactor: FromDishka[GetPatientInteractor],
    ) -> PatientResponseData:
        """Get a patient by ID.

        Args:
            user_id: The authenticated doctor's user ID
            patient_id: The patient ID to retrieve
            interactor: The get patient interactor

        Returns:
            The patient data

        Raises:
            PatientNotFoundError: If patient not found or doesn't belong to doctor
        """
        result: GetPatientOutputDTO = await interactor(
            data=GetPatientInputDTO(
                patient_id=patient_id,
                doctor_id=user_id.value,
            )
        )

        return self._patient_output_to_response_data(result, PatientResponseData)

    @delete(
        "/{patient_id:str}",
        status_code=HTTP_204_NO_CONTENT,
    )
    @inject
    async def delete_patient(
        self,
        user_id: UserId,
        patient_id: str,
        interactor: FromDishka[DeletePatientInteractor],
    ) -> None:
        """Delete a patient by ID.

        Args:
            user_id: The authenticated doctor's user ID
            patient_id: The patient ID to delete
            interactor: The delete patient interactor

        Raises:
            PatientNotFoundError: If patient not found or doesn't belong to doctor
        """
        await interactor(
            data=DeletePatientInputDTO(
                patient_id=patient_id,
                doctor_id=user_id.value,
            )
        )

    @get(
        "/{patient_id:str}/chat",
        status_code=HTTP_200_OK,
        return_dto=ChatMessageListResponseSchema,
    )
    @inject
    async def get_chat_messages(
        self,
        user_id: UserId,
        patient_id: str,
        interactor: FromDishka[GetChatMessagesInteractor],
        limit: int = Parameter(query="limit", default=100, ge=1, le=500),
        offset: int = Parameter(query="offset", default=0, ge=0),
    ) -> ChatMessageListResponseData:
        """Get chat messages for a patient.

        Args:
            user_id: The authenticated doctor's user ID
            patient_id: The patient ID
            interactor: The get chat messages interactor
            limit: Maximum number of messages to return
            offset: Number of messages to skip

        Returns:
            Paginated list of chat messages

        Raises:
            PatientNotFoundError: If patient not found or doesn't belong to doctor
        """
        result: GetChatMessagesOutputDTO = await interactor(
            data=GetChatMessagesInputDTO(
                patient_id=patient_id,
                doctor_id=user_id.value,
                limit=limit,
                offset=offset,
            )
        )

        items = [
            ChatMessageResponseData(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
            )
            for msg in result.items
        ]

        return ChatMessageListResponseData(
            items=items,
            total=result.total,
            limit=result.limit,
            offset=result.offset,
        )

    @post(
        "/{patient_id:str}/chat",
        status_code=HTTP_201_CREATED,
        return_dto=SendMessageResponseSchema,
    )
    @inject
    async def send_message(
        self,
        user_id: UserId,
        patient_id: str,
        data: SendMessageRequest,
        interactor: FromDishka[SendMessageInteractor],
    ) -> SendMessageResponseData:
        """Send a message and get a response.

        Args:
            user_id: The authenticated doctor's user ID
            patient_id: The patient ID
            data: The message content
            interactor: The send message interactor

        Returns:
            Both user and assistant messages

        Raises:
            PatientNotFoundError: If patient not found or doesn't belong to doctor
        """
        result: SendMessageOutputDTO = await interactor(
            data=SendMessageInputDTO(
                patient_id=patient_id,
                doctor_id=user_id.value,
                content=data.content,
            )
        )

        return SendMessageResponseData(
            user_message=ChatMessageResponseData(
                id=result.user_message.id,
                role=result.user_message.role,
                content=result.user_message.content,
                created_at=result.user_message.created_at,
            ),
            assistant_message=ChatMessageResponseData(
                id=result.assistant_message.id,
                role=result.assistant_message.role,
                content=result.assistant_message.content,
                created_at=result.assistant_message.created_at,
            ),
        )


patient_router = Router(
    path="/doctor",
    route_handlers=[DoctorPatientController],
    tags=["doctor"],
    security=[{"bearerAuth": []}],
)
