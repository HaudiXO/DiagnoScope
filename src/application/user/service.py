from dataclasses import dataclass
from datetime import UTC, datetime

from src.domain.user import User, UserRepository
from src.domain.user.password import Password
from src.domain.user.vo import FirstName, LastName, UserId, Username, UserRole


@dataclass
class UpsertUserData:
    id: str | None
    username: str
    first_name: str
    last_name: str | None
    role: str
    password: str | None = None


class UserService:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def upsert_user(self, data: UpsertUserData) -> User:
        now = datetime.now(UTC)

        existing_user = None
        if data.id is not None:
            user_id = UserId(data.id)
            existing_user = await self.user_repository.get_user(user_id)

        if existing_user:
            user_id = existing_user.id
        elif data.id is not None:
            user_id = UserId(data.id)
        else:
            user_id = UserId.generate()

        user = User(
            id=user_id,
            first_name=FirstName(data.first_name),
            last_name=LastName(data.last_name) if data.last_name else None,
            username=Username(data.username),
            bio=existing_user.bio if existing_user else None,
            created_at=existing_user.created_at if existing_user else now,
            updated_at=now,
            last_login_at=now,
            role=existing_user.role if existing_user else UserRole(data.role),
            password_hash=existing_user.password_hash if existing_user else None,
        )

        if data.password:
            user.password_hash = Password(data.password)

        if existing_user is None:
            user = await self.user_repository.create_user(user)
        else:
            user = await self.user_repository.update_user(user)

        return user
