from abc import abstractmethod
from typing import Protocol

from src.domain.user.vo import UserId


class AdminRepository(Protocol):
    @abstractmethod
    async def get_all_user_ids(
        self, active_since_days: int | None = None
    ) -> list[UserId]:
        """
        Get all user IDs, optionally filtered by recent activity.

        Args:
            active_since_days: If provided, only return users who logged in
                              within the last N days. None means all users.

        Returns:
            List of user IDs.
        """
