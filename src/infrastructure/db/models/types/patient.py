"""Patient domain Value Object SQLAlchemy types."""

from sqlalchemy import String

from src.domain.patient.vo import FirstName, LastName, PatientId

from .base import VOType


class PatientIdType(VOType):
    impl = String(36)
    vo_class = PatientId
    vo_raw = str
    cache_ok = True


class PatientFirstNameType(VOType):
    impl = String(64)
    vo_class = FirstName
    vo_raw = str
    cache_ok = True


class PatientLastNameType(VOType):
    impl = String(64)
    vo_class = LastName
    vo_raw = str
    cache_ok = True
