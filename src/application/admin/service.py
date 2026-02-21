from src.domain.user import UserRepository
from src.domain.user.vo import UserId


class AdminAuthorizationService:
    """Service for checking admin authorization."""

    def __init__(self, user_repository: UserRepository) -> None:
        self._user_repository = user_repository

    async def is_admin(self, user_id: UserId) -> bool:
        """Check if the given user is an admin.

        Args:
            user_id: The user ID to check

        Returns:
            True if the user is an admin, False otherwise
        """
        user = await self._user_repository.get_user(user_id)
        if user is None:
            return False
        return user.role.value == "admin"
