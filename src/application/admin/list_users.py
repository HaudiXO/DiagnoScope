from src.application.admin.dtos import (
    AdminGetUserOutputDTO,
    AdminListUsersInputDTO,
    AdminListUsersOutputDTO,
)
from src.application.common.interactor import Interactor
from src.application.user.dtos import UserRoleDTO
from src.domain.user.repository import UserRepository


class AdminListUsersInteractor(
    Interactor[AdminListUsersInputDTO, AdminListUsersOutputDTO]
):
    """Interactor for admin to list users with pagination."""

    def __init__(self, user_repository: UserRepository) -> None:
        self._user_repository = user_repository

    async def __call__(self, data: AdminListUsersInputDTO) -> AdminListUsersOutputDTO:
        """List users with pagination.

        Args:
            data: The pagination parameters

        Returns:
            The paginated list of users
        """
        users, total = await self._user_repository.list_users(
            limit=data.limit,
            offset=data.offset,
        )

        user_dtos = [
            AdminGetUserOutputDTO(
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
            for user in users
        ]

        return AdminListUsersOutputDTO(
            users=user_dtos,
            total=total,
            limit=data.limit,
            offset=data.offset,
        )
