from sqlalchemy import BIGINT, String

from src.domain.user.vo import (
    Bio,
    FirstName,
    LanguageCode,
    LastName,
    UserId,
    Username,
    UserRole,
)

from .base import VOType


class UserIdType(VOType):
    impl = BIGINT
    vo_class = UserId
    vo_raw = int
    cache_ok = True


class FirstNameType(VOType):
    impl = String(64)
    vo_class = FirstName
    vo_raw = str
    cache_ok = True


class LastNameType(VOType):
    impl = String(64)
    vo_class = LastName
    vo_raw = str
    cache_ok = True


class UsernameType(VOType):
    impl = String(32)
    vo_class = Username
    vo_raw = str
    cache_ok = True


class BioType(VOType):
    impl = String(160)
    vo_class = Bio
    vo_raw = str
    cache_ok = True


class LanguageCodeType(VOType):
    impl = String(5)
    vo_class = LanguageCode
    vo_raw = str
    cache_ok = True


class UserRoleType(VOType):
    impl = String(10)
    vo_class = UserRole
    vo_raw = str
    cache_ok = True


class PasswordType(VOType):
    """Password hash type - stores bcrypt hash as string."""

    impl = String(255)
    vo_class = str  # Store as plain string hash
    vo_raw = str
    cache_ok = True
