from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from src.domain.admin.repository import AdminRepository
from src.domain.user.vo import UserId
from src.infrastructure.db.models.user import UserModel
from src.infrastructure.db.repos.base import BaseSQLAlchemyRepo


class AdminRepositoryImpl(AdminRepository, BaseSQLAlchemyRepo):
    async def get_all_user_ids(
        self, active_since_days: int | None = None
    ) -> list[UserId]:
        stmt = select(UserModel.id)

        if active_since_days is not None:
            cutoff = datetime.now(UTC) - timedelta(days=active_since_days)
            stmt = stmt.where(UserModel.last_login_at >= cutoff)

        result = await self._session.execute(stmt)

        return [row.t[0] for row in result.all()]
