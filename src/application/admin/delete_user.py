from src.application.admin.dtos import AdminDeleteUserInputDTO
from src.application.common.interactor import Interactor
from src.application.common.transaction import TransactionManager
from src.application.user.exceptions import UserNotFoundError
from src.domain.user.repository import UserRepository
from src.domain.user.vo import UserId


class AdminDeleteUserInteractor(Interactor[AdminDeleteUserInputDTO, None]):
    """Interactor for admin to delete a user."""

    def __init__(
        self,
        user_repository: UserRepository,
        transaction_manager: TransactionManager,
    ) -> None:
        self._user_repository = user_repository
        self._transaction_manager = transaction_manager

    async def __call__(self, data: AdminDeleteUserInputDTO) -> None:
        """Delete a user by ID.

        Args:
            data: The user ID to delete

        Raises:
            UserNotFoundError: If the user is not found
        """
        user_id = UserId(data.user_id)

        user = await self._user_repository.get_user(user_id)
        if user is None:
            raise UserNotFoundError(user_id=user_id)

        await self._user_repository.delete_user(user_id)
        await self._transaction_manager.commit()
