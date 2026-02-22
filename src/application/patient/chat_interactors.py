"""Chat message application interactors."""

import logging

import httpx

from src.application.common.interactor import Interactor
from src.application.common.transaction import TransactionManager
from src.domain.patient import ChatMessageRepository, MessageRole, PatientId
from src.domain.patient.repository import PatientRepository
from src.domain.user.vo import UserId

from .chat_dtos import (
    ChatMessageDTO,
    GetChatMessagesInputDTO,
    GetChatMessagesOutputDTO,
    SendMessageInputDTO,
    SendMessageOutputDTO,
)
from .exceptions import PatientNotFoundError

logger = logging.getLogger(__name__)

# ML service endpoint
ML_SERVICE_URL = "http://localhost:8001/diagnose"


class GetChatMessagesInteractor(
    Interactor[GetChatMessagesInputDTO, GetChatMessagesOutputDTO]
):
    """Interactor for getting chat messages for a patient."""

    def __init__(
        self,
        patient_repository: PatientRepository,
        chat_message_repository: ChatMessageRepository,
    ) -> None:
        self._patient_repository = patient_repository
        self._chat_message_repository = chat_message_repository

    async def __call__(self, data: GetChatMessagesInputDTO) -> GetChatMessagesOutputDTO:
        """Get chat messages for a patient.

        Args:
            data: The input DTO containing patient_id and pagination params.

        Returns:
            The output DTO containing chat messages.

        Raises:
            PatientNotFoundError: If patient not found or doesn't belong to doctor.
        """
        # Verify patient exists and belongs to doctor
        patient = await self._patient_repository.get_patient(
            patient_id=PatientId(data.patient_id),
            doctor_id=UserId(data.doctor_id),
        )
        if patient is None:
            raise PatientNotFoundError(data.patient_id)

        # Get messages
        messages = await self._chat_message_repository.get_messages(
            patient_id=PatientId(data.patient_id),
            limit=data.limit,
            offset=data.offset,
        )
        total = await self._chat_message_repository.count_messages(
            patient_id=PatientId(data.patient_id)
        )

        # Convert to DTOs
        items = [
            ChatMessageDTO(
                id=msg.id,
                role=msg.role.value,
                content=msg.content,
                created_at=msg.created_at,
            )
            for msg in messages
        ]

        return GetChatMessagesOutputDTO(
            items=items,
            total=total,
            limit=data.limit,
            offset=data.offset,
        )


class SendMessageInteractor(Interactor[SendMessageInputDTO, SendMessageOutputDTO]):
    """Interactor for sending a message to the ML service."""

    def __init__(
        self,
        patient_repository: PatientRepository,
        chat_message_repository: ChatMessageRepository,
        transaction_manager: TransactionManager,
    ) -> None:
        self._patient_repository = patient_repository
        self._chat_message_repository = chat_message_repository
        self._transaction_manager = transaction_manager

    async def __call__(self, data: SendMessageInputDTO) -> SendMessageOutputDTO:
        """Send a message and get a response from the ML service.

        Args:
            data: The input DTO containing patient_id and message content.

        Returns:
            The output DTO containing both user and assistant messages.

        Raises:
            PatientNotFoundError: If patient not found or doesn't belong to doctor.
        """
        # Verify patient exists and belongs to doctor
        patient = await self._patient_repository.get_patient(
            patient_id=PatientId(data.patient_id),
            doctor_id=UserId(data.doctor_id),
        )
        if patient is None:
            raise PatientNotFoundError(data.patient_id)

        # Save user message
        user_message = await self._chat_message_repository.create_message(
            patient_id=PatientId(data.patient_id),
            role=MessageRole.USER,
            content=data.content,
        )

        # Send to ML service - only user's prompt, no history
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    ML_SERVICE_URL,
                    json={"symptoms": data.content},
                    timeout=30.0,
                )
                response.raise_for_status()
                response_data = response.json()
                diagnoses = response_data.get("diagnoses", [])
                # Format diagnoses as a readable response
                if diagnoses:
                    parts = []
                    for d in diagnoses[:3]:  # Top 3 diagnoses
                        rank = d.get("rank", 0)
                        diagnosis = d.get("diagnosis", "")
                        icd10 = d.get("icd10_code", "")
                        expl = d.get("explanation", "")
                        part = f"{rank}. {diagnosis}"
                        if icd10:
                            part += f" (ICD-10: {icd10})"
                        if expl:
                            part += f"\n   {expl}"
                        parts.append(part)
                    assistant_content = "\n\n".join(parts)
                else:
                    assistant_content = "No diagnoses found."
        except Exception as e:
            logger.error("Error calling ML service: %s", e)
            assistant_content = "Sorry, I couldn't process your request."

        # Save assistant message
        assistant_message = await self._chat_message_repository.create_message(
            patient_id=PatientId(data.patient_id),
            role=MessageRole.ASSISTANT,
            content=assistant_content,
        )

        await self._transaction_manager.commit()

        return SendMessageOutputDTO(
            user_message=ChatMessageDTO(
                id=user_message.id,
                role=user_message.role.value,
                content=user_message.content,
                created_at=user_message.created_at,
            ),
            assistant_message=ChatMessageDTO(
                id=assistant_message.id,
                role=assistant_message.role.value,
                content=assistant_message.content,
                created_at=assistant_message.created_at,
            ),
        )
