from .admin import AdminInteractorProvider
from .auth import AuthInteractorProvider
from .user import UserInteractorProvider

interactor_providers = [
    AdminInteractorProvider,
    AuthInteractorProvider,
    UserInteractorProvider,
]

__all__ = [
    "AdminInteractorProvider",
    "AuthInteractorProvider",
    "UserInteractorProvider",
    "interactor_providers",
]
