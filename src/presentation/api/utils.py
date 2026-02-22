from litestar import Router

from .admin import admin_router
from .auth import auth_router
from .health import health_router
from .mock import mock_router
from .patient import patient_router
from .user import user_router


def setup_routes() -> Router:
    route_handlers = [
        admin_router,
        auth_router,
        user_router,
        patient_router,
        mock_router,
        health_router,
    ]
    router = Router(path="", route_handlers=route_handlers)
    return router
