from src.application.admin.dtos import (
    AdminCreateUserInputDTO,
    AdminCreateUserOutputDTO,
)
from src.application.common.interactor import Interactor
from src.application.common.transaction import TransactionManager
from src.application.user.dtos import UserRoleDTO, entity_to_dto
from src.application.user.service import UpsertUserData, UserService


class AdminCreateUserInteractor(
    Interactor[AdminCreateUserInputDTO, AdminCreateUserOutputDTO]
):
    """Interactor for admin to create a new user with a specific role."""

    def __init__(
        self,
        user_service: UserService,
        transaction_manager: TransactionManager,
    ) -> None:
        self._user_service = user_service
        self._transaction_manager = transaction_manager

    async def __call__(self, data: AdminCreateUserInputDTO) -> AdminCreateUserOutputDTO:
        """Create a new user with the specified role.

        Args:
            data: The user creation data including role

        Returns:
            The created user data
        """
        user = await self._user_service.upsert_user(
            UpsertUserData(
                id=None,
                username=data.username,
                first_name=data.first_name,
                last_name=data.last_name,
                role=data.role.value,
                password=data.password,
            )
        )

        await self._transaction_manager.commit()

        # Convert to admin output DTO
        base_dto = entity_to_dto(user)
        return AdminCreateUserOutputDTO(
            id=base_dto.id,
            username=base_dto.username,
            first_name=base_dto.first_name,
            last_name=base_dto.last_name,
            role=UserRoleDTO(base_dto.role.value),
            language_code=base_dto.language_code,
            is_new=base_dto.is_new,
        )
