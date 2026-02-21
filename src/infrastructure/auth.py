from datetime import UTC, datetime, timedelta

from jose import ExpiredSignatureError, JWTError
from jose.jwt import decode, encode

from src.application.common.exceptions import ValidationError
from src.application.interfaces.auth import AuthService
from src.domain.user.vo import UserId
from src.infrastructure.config import Config


class AuthServiceImpl(AuthService):
    def __init__(self, config: Config) -> None:
        self.config = config

    def create_access_token(self, user_id: UserId) -> str:
        to_encode = {
            "sub": str(user_id),
            "exp": datetime.now(UTC)
            + timedelta(minutes=self.config.auth.access_token_expire_minutes),
        }
        encoded_jwt = encode(
            to_encode,
            self.config.auth.secret_key,
            algorithm=self.config.auth.algorithm,
            headers={"kid": "main"},
        )
        return encoded_jwt

    def validate_access_token(self, token: str) -> UserId:
        """Validate JWT token and return user_id if valid."""
        try:
            payload = decode(
                token,
                self.config.auth.secret_key,
                algorithms=[self.config.auth.algorithm],
            )
            user_id_str = payload.get("sub")
            if user_id_str is None:
                raise ValidationError("Token missing subject")

            return UserId(user_id_str)
        except ExpiredSignatureError as err:
            raise ValidationError("Token has expired") from err
        except JWTError as err:
            raise ValidationError("Invalid token") from err
        except (ValueError, TypeError) as err:
            raise ValidationError("Invalid user ID in token") from err
