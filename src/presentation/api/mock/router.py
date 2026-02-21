"""Mock API router."""

import random

from litestar import Router, post
from litestar.status_codes import HTTP_200_OK

from .schemas import DiagnoseRequest, DiagnoseResponse, Diagnosis

ICD_CODES = [
    "A00.13",
    "A01.14",
    "A02.15",
    "A03.16",
    "A04.17",
    "A05.18",
    "A06",
    "A07.19",
    "A08",
    "A09.20",
    "B00",
    "B01.21",
    "B02.22",
    "B03",
    "B04.23",
    "B05.24",
    "J00",
    "J01.25",
    "J02",
    "J03.26",
    "J04",
    "J05",
    "J06",
    "K00",
    "K01",
    "K02",
    "K03",
    "K04",
    "K05",
    "L00",
    "L01",
    "L02",
    "L03",
    "L04",
    "M00",
    "M01",
    "M02",
    "M03",
    "N00",
    "N01",
    "N02",
    "N03",
]


@post(
    "/random_diagnose",
    status_code=HTTP_200_OK,
    exclude_from_auth=True,  # No authentication required for mock endpoint
)
async def random_diagnose_handler(data: DiagnoseRequest) -> DiagnoseResponse:
    """Return random ICD-10 diagnoses.

    Args:
        data: Request containing optional symptoms

    Returns:
        Random diagnoses with ICD-10 codes
    """
    symptoms = data.symptoms or ""

    codes = random.sample(ICD_CODES, min(5, len(ICD_CODES)))
    diagnoses: list[Diagnosis] = []

    for rank, code in enumerate(codes, start=1):
        diagnoses.append(
            Diagnosis(
                rank=rank,
                diagnosis=f"Simulated diagnosis for {code}",
                icd10_code=code,
                explanation=f"Based on symptoms: {symptoms[:100]}..."
                if symptoms
                else "No symptoms provided",
            )
        )

    return DiagnoseResponse(diagnoses=diagnoses)


mock_router = Router(
    path="/mock",
    route_handlers=[random_diagnose_handler],
    tags=["mock"],
)
