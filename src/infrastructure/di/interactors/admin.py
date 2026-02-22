from dishka import Provider, Scope, provide

from src.application.admin import (
    AdminAuthorizationService,
    AdminCreateUserInteractor,
    AdminDeleteUserInteractor,
    AdminGetUserInteractor,
    AdminListUsersInteractor,
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

    @provide
    def provide_admin_get_user_interactor(
        self,
        user_repository: UserRepository,
    ) -> AdminGetUserInteractor:
        return AdminGetUserInteractor(user_repository)

    @provide
    def provide_admin_list_users_interactor(
        self,
        user_repository: UserRepository,
    ) -> AdminListUsersInteractor:
        return AdminListUsersInteractor(user_repository)

    @provide
    def provide_admin_delete_user_interactor(
        self,
        user_repository: UserRepository,
        transaction_manager: TransactionManager,
    ) -> AdminDeleteUserInteractor:
        return AdminDeleteUserInteractor(
            user_repository=user_repository,
            transaction_manager=transaction_manager,
        )
