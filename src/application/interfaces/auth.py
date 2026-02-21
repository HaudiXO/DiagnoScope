from abc import abstractmethod
from typing import Protocol

from src.domain.user.vo import UserId


class AuthService(Protocol):
    @abstractmethod
    def create_access_token(self, user_id: UserId) -> str: ...

    @abstractmethod
    def validate_access_token(self, token: str) -> UserId: ...
