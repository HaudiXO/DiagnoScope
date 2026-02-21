from dishka.integrations.litestar import FromDishka, inject
from litestar import Router, post
from litestar.status_codes import HTTP_200_OK

from src.application.auth.login import LoginInputDTO, LoginInteractor

from .schemas import LoginRequest, LoginResponseData, LoginResponseSchema


@post(
    "/login",
    status_code=HTTP_200_OK,
    return_dto=LoginResponseSchema,
)
@inject
async def login(
    data: LoginRequest,
    interactor: FromDishka[LoginInteractor],
) -> LoginResponseData:
    """Login and get access token.

    Args:
        data: Login credentials (username)
        interactor: The login interactor

    Returns:
        Login response with access token

    Raises:
        ValidationError: If user not found
    """
    result = await interactor(
        data=LoginInputDTO(
            username=data.username,
            password=data.password,
        )
    )

    return LoginResponseData(
        access_token=result.access_token,
        token_type=result.token_type,
    )


auth_router = Router(
    path="/auth",
    route_handlers=[login],
    tags=["auth"],
)
