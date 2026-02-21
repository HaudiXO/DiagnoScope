from abc import abstractmethod
from typing import Protocol, overload

from src.domain.user.entity import User
from src.domain.user.vo import LanguageCode, UserId, Username


class UserRepository(Protocol):
    @abstractmethod
    @overload
    async def get_user(self, identifier: UserId) -> User | None: ...

    @abstractmethod
    @overload
    async def get_user(self, identifier: Username) -> User | None: ...

    @abstractmethod
    async def get_user(self, identifier: UserId | Username) -> User | None: ...

    @abstractmethod
    async def create_user(self, user: User) -> User: ...

    @abstractmethod
    async def update_user(self, user: User) -> User: ...

    @abstractmethod
    async def delete_user(self, user_id: UserId) -> None: ...

    @abstractmethod
    async def update_language(
        self, user_id: UserId, language_code: LanguageCode
    ) -> None: ...
