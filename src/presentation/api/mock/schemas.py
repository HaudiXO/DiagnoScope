"""Mock API schemas."""

from dataclasses import dataclass


@dataclass
class DiagnoseRequest:
    """Request for random diagnosis."""

    symptoms: str | None = None


@dataclass
class Diagnosis:
    """Single diagnosis result."""

    rank: int
    diagnosis: str
    icd10_code: str
    explanation: str


@dataclass
class DiagnoseResponse:
    """Response with random diagnoses."""

    diagnoses: list[Diagnosis]
