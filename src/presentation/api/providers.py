from litestar import Request

from src.application.auth.exceptions import InvalidUserIdError, MissingUserIdError
from src.domain.user.vo import UserId


def provide_user_id(request: Request) -> UserId:
    try:
        user_id = request.scope.get("user", None)
        if user_id is None:
            raise MissingUserIdError
        return UserId(user_id)
    except ValueError:
        raise InvalidUserIdError from None
