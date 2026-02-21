from dishka import Provider, Scope, provide

from src.application.admin import (
    AdminAuthorizationService,
    AdminCreateUserInteractor,
)
from src.application.common.transaction import TransactionManager
from src.application.user.service import UserService
from src.domain.user import UserRepository


class AdminInteractorProvider(Provider):
    """Admin interactor provider."""

    scope = Scope.REQUEST

    @provide
    def provide_admin_auth_service(
        self,
        user_repository: UserRepository,
    ) -> AdminAuthorizationService:
        return AdminAuthorizationService(user_repository)

    @provide
    def provide_admin_create_user_interactor(
        self,
        user_service: UserService,
        transaction_manager: TransactionManager,
    ) -> AdminCreateUserInteractor:
        return AdminCreateUserInteractor(
            user_service=user_service,
            transaction_manager=transaction_manager,
        )
