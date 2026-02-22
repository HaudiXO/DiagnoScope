from src.application.admin.dtos import (
    AdminCreateUserInputDTO,
    AdminCreateUserOutputDTO,
)
from src.application.common.interactor import Interactor
from src.application.common.transaction import TransactionManager
from src.application.user.dtos import UserRoleDTO
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

        return AdminCreateUserOutputDTO(
            id=user.id.value,
            username=user.username.value,
            first_name=user.first_name.value,
            last_name=user.last_name.value if user.last_name else None,
            role=UserRoleDTO(user.role.value),
            language_code=user.language_code.value if user.language_code else None,
            is_new=user.is_new,
        )
