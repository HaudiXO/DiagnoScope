from dataclasses import dataclass

from src.application.common.exceptions import ValidationError
from src.application.common.interactor import Interactor
from src.application.interfaces.auth import AuthService
from src.domain.user import UserRepository
from src.domain.user.vo import Username


@dataclass
class LoginInputDTO:
    """Input DTO for user login."""

    username: str
    password: str


@dataclass
class LoginOutputDTO:
    """Output DTO for user login."""

    access_token: str
    token_type: str = "bearer"  # noqa: S105


class LoginInteractor(Interactor[LoginInputDTO, LoginOutputDTO]):
    """Interactor for user login."""

    def __init__(
        self,
        user_repository: UserRepository,
        auth_service: AuthService,
    ) -> None:
        self._user_repository = user_repository
        self._auth_service = auth_service

    async def __call__(self, data: LoginInputDTO) -> LoginOutputDTO:
        """Authenticate user and return access token.

        Args:
            data: Login credentials (username and password)

        Returns:
            Login output with access token

        Raises:
            ValidationError: If user not found or password invalid
        """
        # Verify user exists
        user = await self._user_repository.get_user(Username(data.username))
        if user is None:
            raise ValidationError("Invalid credentials")

        # Verify password
        if user.password_hash is None:
            raise ValidationError("Invalid credentials")

        if not user.password_hash.verify(data.password):
            raise ValidationError("Invalid credentials")

        # Create access token
        access_token = self._auth_service.create_access_token(user.id)

        return LoginOutputDTO(
            access_token=access_token,
            token_type="bearer",  # noqa: S106
        )
