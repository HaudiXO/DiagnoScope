from .admin import AdminInteractorProvider
from .auth import AuthInteractorProvider
from .patient import PatientInteractorProvider
from .user import UserInteractorProvider

interactor_providers = [
    AdminInteractorProvider,
    AuthInteractorProvider,
    PatientInteractorProvider,
    UserInteractorProvider,
]

__all__ = [
    "AdminInteractorProvider",
    "AuthInteractorProvider",
    "PatientInteractorProvider",
    "UserInteractorProvider",
    "interactor_providers",
]
