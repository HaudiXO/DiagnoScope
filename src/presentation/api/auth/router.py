from litestar import Router

auth_router = Router(
    path="/auth",
    route_handlers=[],
    tags=["auth"],
)
