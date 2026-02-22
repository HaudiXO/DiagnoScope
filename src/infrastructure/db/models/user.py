from datetime import datetime

from sqlalchemy import TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from src.domain.user.vo import (
    Bio,
    FirstName,
    LanguageCode,
    LastName,
    UserId,
    Username,
    UserRole,
)

from .base import BaseORMModel
from .types.user import (
    BioType,
    FirstNameType,
    LanguageCodeType,
    LastNameType,
    PasswordType,
    UserIdType,
    UsernameType,
    UserRoleType,
)


class UserModel(BaseORMModel):
    __tablename__ = "users"

    id: Mapped[UserId] = mapped_column(UserIdType, primary_key=True)
    first_name: Mapped[FirstName] = mapped_column(FirstNameType)
    last_name: Mapped[LastName | None] = mapped_column(LastNameType, nullable=True)
    username: Mapped[Username] = mapped_column(
        UsernameType, nullable=False, unique=True
    )
    bio: Mapped[Bio | None] = mapped_column(BioType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_login_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    role: Mapped[UserRole] = mapped_column(UserRoleType, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(PasswordType, nullable=True)
    language_code: Mapped[LanguageCode | None] = mapped_column(
        LanguageCodeType, server_default="en", nullable=True
    )
