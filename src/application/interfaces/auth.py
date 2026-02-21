from abc import abstractmethod
from typing import Protocol


class AuthService(Protocol):
    @abstractmethod
    def validate_init_data(self, init_data: str) -> None: ...

    @abstractmethod
    def create_access_token(self, user_id: int) -> str: ...

    @abstractmethod
    def validate_access_token(self, token: str) -> int: ...
