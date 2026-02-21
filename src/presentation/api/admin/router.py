from collections.abc import Sequence
import logging

from dishka.integrations.litestar import FromDishka, inject
from litestar import Controller, Router, post
from litestar.status_codes import HTTP_201_CREATED

from src.application.admin import (
    AdminAccessRequiredError,
    AdminAuthorizationService,
    AdminCreateUserInputDTO,
    AdminCreateUserInteractor,
    InvalidRoleError,
)
from src.application.user.dtos import UserRoleDTO
from src.domain.user.vo import UserId
from src.presentation.api.admin.schemas import (
    AdminCreateUserRequest,
    AdminCreateUserResponseData,
    AdminCreateUserResponseSchema,
)

logger = logging.getLogger(__name__)


class AdminUserController(Controller):
    """Controller for admin user management endpoints."""

    path: str = "/users"
    tags: Sequence[str] | None = ["admin"]

    @post(
        "/",
        status_code=HTTP_201_CREATED,
        return_dto=AdminCreateUserResponseSchema,
    )
    @inject
    async def create_user(
        self,
        data: AdminCreateUserRequest,
        user_id: UserId,
        interactor: FromDishka[AdminCreateUserInteractor],
        auth_service: FromDishka[AdminAuthorizationService],
    ) -> AdminCreateUserResponseData:
        """Create a new user with a specific role (admin only).

        Args:
            data: User creation data including role
            user_id: The authenticated admin's user ID
            interactor: The admin create user interactor
            auth_service: Service to verify admin status

        Returns:
            The created user data

        Raises:
            AdminAccessRequiredError: If user is not an admin
            InvalidRoleError: If the role is invalid
        """
        # Verify the requesting user is an admin
        is_admin = await auth_service.is_admin(user_id)
        if not is_admin:
            raise AdminAccessRequiredError

        # Validate role
        try:
            role = UserRoleDTO(data.role)
        except ValueError:
            raise InvalidRoleError(
                allowed_roles=list(UserRoleDTO.__members__.keys())
            ) from None

        # Create the user
        result = await interactor(
            data=AdminCreateUserInputDTO(
                username=data.username,
                first_name=data.first_name,
                last_name=data.last_name,
                role=role,
                password=data.password,
            )
        )

        return AdminCreateUserResponseData(
            id=result.id,
            username=result.username,
            first_name=result.first_name,
            last_name=result.last_name,
            role=result.role.value,
            language_code=result.language_code,
            is_new=result.is_new,
        )


# Create the admin router
admin_router = Router(
    path="/admin",
    route_handlers=[AdminUserController],
    tags=["admin"],
    security=[{"bearerAuth": []}],
)
