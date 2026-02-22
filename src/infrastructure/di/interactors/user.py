from dishka import Provider, Scope, provide

from src.application.user.get_me import GetUserProfileInteractor
from src.application.user.service import UserService
from src.domain.user import UserRepository


class UserInteractorProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def provide_user_service(
        self,
        user_repository: UserRepository,
    ) -> UserService:
        return UserService(user_repository)

    @provide
    def provide_user_profile_interactor(
        self,
        user_repository: UserRepository,
    ) -> GetUserProfileInteractor:
        return GetUserProfileInteractor(
            user_repository,
        )
