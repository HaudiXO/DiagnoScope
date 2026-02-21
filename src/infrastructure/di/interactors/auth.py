from dishka import Provider, Scope, provide

from src.application.auth.login import LoginInteractor
from src.application.interfaces.auth import AuthService
from src.domain.user import UserRepository


class AuthInteractorProvider(Provider):
    """Auth interactor provider."""

    scope = Scope.REQUEST

    @provide
    def provide_login_interactor(
        self,
        user_repository: UserRepository,
        auth_service: AuthService,
    ) -> LoginInteractor:
        return LoginInteractor(
            user_repository=user_repository,
            auth_service=auth_service,
        )
