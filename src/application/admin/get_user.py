from src.application.admin.dtos import (
    AdminGetUserInputDTO,
    AdminGetUserOutputDTO,
)
from src.application.common.interactor import Interactor
from src.application.user.dtos import UserRoleDTO
from src.application.user.exceptions import UserNotFoundError
from src.domain.user.repository import UserRepository
from src.domain.user.vo import UserId


class AdminGetUserInteractor(Interactor[AdminGetUserInputDTO, AdminGetUserOutputDTO]):
    """Interactor for admin to get a user by ID."""

    def __init__(self, user_repository: UserRepository) -> None:
        self._user_repository = user_repository

    async def __call__(self, data: AdminGetUserInputDTO) -> AdminGetUserOutputDTO:
        """Get a user by ID.

        Args:
            data: The user ID to retrieve

        Returns:
            The user data

        Raises:
            UserNotFoundError: If the user is not found
        """
        user_id = UserId(data.user_id)
        user = await self._user_repository.get_user(user_id)

        if user is None:
            raise UserNotFoundError(user_id=user_id)

        return AdminGetUserOutputDTO(
            id=user.id.value,
            username=user.username.value,
            first_name=user.first_name.value,
            last_name=user.last_name.value if user.last_name else None,
            role=UserRoleDTO(user.role.value),
            language_code=user.language_code.value if user.language_code else None,
            bio=user.bio.value if user.bio else None,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at,
        )
