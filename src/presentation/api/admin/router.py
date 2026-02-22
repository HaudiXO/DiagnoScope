from collections.abc import Sequence
import logging

from dishka.integrations.litestar import FromDishka, inject
from litestar import Controller, Router, delete, get, post
from litestar.params import Parameter
from litestar.status_codes import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT

from src.application.admin import (
    AdminAccessRequiredError,
    AdminAuthorizationService,
    AdminCreateUserInputDTO,
    AdminCreateUserInteractor,
    AdminDeleteUserInputDTO,
    AdminDeleteUserInteractor,
    AdminGetUserInputDTO,
    AdminGetUserInteractor,
    AdminListUsersInputDTO,
    AdminListUsersInteractor,
    InvalidRoleError,
)
from src.application.admin.dtos import AdminGetUserOutputDTO
from src.application.user.dtos import UserRoleDTO
from src.domain.user.vo import UserId
from src.presentation.api.admin.schemas import (
    AdminCreateUserRequest,
    AdminCreateUserResponseData,
    AdminCreateUserResponseSchema,
    AdminGetUserResponseData,
    AdminGetUserResponseSchema,
    AdminListUsersResponseData,
    AdminListUsersResponseSchema,
    AdminUserListItem,
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
        is_admin = await auth_service.is_admin(user_id)
        if not is_admin:
            raise AdminAccessRequiredError

        try:
            role = UserRoleDTO(data.role)
        except ValueError:
            raise InvalidRoleError(
                allowed_roles=list(UserRoleDTO.__members__.keys())
            ) from None

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

    def _user_list_item_from_dto(self, dto: AdminGetUserOutputDTO) -> AdminUserListItem:
        return AdminUserListItem(
            id=dto.id,
            username=dto.username,
            first_name=dto.first_name,
            last_name=dto.last_name,
            role=dto.role.value,
            language_code=dto.language_code,
            bio=dto.bio,
            created_at=dto.created_at,
            updated_at=dto.updated_at,
            last_login_at=dto.last_login_at,
        )

    @get(
        "/",
        status_code=HTTP_200_OK,
        return_dto=AdminListUsersResponseSchema,
    )
    @inject
    async def list_users(
        self,
        user_id: UserId,
        auth_service: FromDishka[AdminAuthorizationService],
        interactor: FromDishka[AdminListUsersInteractor],
        limit: int = Parameter(query="limit", default=50, ge=1, le=100),
        offset: int = Parameter(query="offset", default=0, ge=0),
    ) -> AdminListUsersResponseData:
        """List users with pagination (admin only).

        Args:
            user_id: The authenticated admin's user ID
            auth_service: Service to verify admin status
            interactor: The list users interactor
            limit: Maximum number of users to return
            offset: Number of users to skip

        Returns:
            Paginated list of users

        Raises:
            AdminAccessRequiredError: If user is not an admin
        """
        is_admin = await auth_service.is_admin(user_id)
        if not is_admin:
            raise AdminAccessRequiredError

        result = await interactor(
            data=AdminListUsersInputDTO(
                limit=limit,
                offset=offset,
            )
        )

        return AdminListUsersResponseData(
            users=[self._user_list_item_from_dto(user) for user in result.users],
            total=result.total,
            limit=result.limit,
            offset=result.offset,
        )

    @get(
        "/{request_user_id:uuid}",
        status_code=HTTP_200_OK,
        return_dto=AdminGetUserResponseSchema,
    )
    @inject
    async def get_user(
        self,
        user_id: UserId,
        request_user_id: str,
        auth_service: FromDishka[AdminAuthorizationService],
        interactor: FromDishka[AdminGetUserInteractor],
    ) -> AdminGetUserResponseData:
        """Get a user by ID (admin only).

        Args:
            user_id: The ID of the user to retrieve
            request_user_id: The authenticated admin's user ID
            auth_service: Service to verify admin status
            interactor: The get user interactor

        Returns:
            The user data

        Raises:
            AdminAccessRequiredError: If user is not an admin
        """
        is_admin = await auth_service.is_admin(user_id)
        if not is_admin:
            raise AdminAccessRequiredError

        result = await interactor(
            data=AdminGetUserInputDTO(
                user_id=request_user_id,
            )
        )

        return self._user_list_item_from_dto(result)

    @delete(
        "/{request_user_id:str}",
        status_code=HTTP_204_NO_CONTENT,
    )
    @inject
    async def delete_user(
        self,
        user_id: UserId,
        request_user_id: str,
        auth_service: FromDishka[AdminAuthorizationService],
        interactor: FromDishka[AdminDeleteUserInteractor],
    ) -> None:
        """Delete a user by ID (admin only).

        Args:
            user_id: The ID of the user to delete
            request_user_id: The authenticated admin's user ID
            auth_service: Service to verify admin status
            interactor: The delete user interactor

        Raises:
            AdminAccessRequiredError: If user is not an admin
        """
        is_admin = await auth_service.is_admin(user_id)
        if not is_admin:
            raise AdminAccessRequiredError

        await interactor(
            data=AdminDeleteUserInputDTO(
                user_id=request_user_id,
            )
        )


admin_router = Router(
    path="/admin",
    route_handlers=[AdminUserController],
    tags=["admin"],
    security=[{"bearerAuth": []}],
)
