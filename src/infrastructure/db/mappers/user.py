from src.domain.user.entity import User
from src.domain.user.password import Password
from src.infrastructure.db.models.user import UserModel


class UserMapper:
    @staticmethod
    def to_domain(model: UserModel) -> User:
        # Convert password hash string to Password VO if present
        password_vo = None
        if model.password_hash:
            password_vo = Password.from_hash(model.password_hash)

        return User(
            id=model.id,
            first_name=model.first_name,
            last_name=model.last_name,
            username=model.username,
            bio=model.bio,
            created_at=model.created_at,
            updated_at=model.updated_at,
            last_login_at=model.last_login_at,
            role=model.role,
            password_hash=password_vo,
            language_code=model.language_code,
        )

    @staticmethod
    def to_model(user: User) -> UserModel:
        password_hash_str = None
        if user.password_hash:
            password_hash_str = user.password_hash.hash

        return UserModel(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            bio=user.bio,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at,
            role=user.role,
            password_hash=password_hash_str,
            language_code=user.language_code,
        )
