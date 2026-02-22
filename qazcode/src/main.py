import json
import re
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import httpx
from anyio import Path
from fastapi import FastAPI, HTTPException
from ollama import ResponseError as OllamaResponseError
from pydantic import BaseModel

from brain import MedicalBrain
from config import settings
from database import ProtocolDB

db = ProtocolDB()
brain = MedicalBrain()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    if not settings.INDEX_PATH or not await Path(settings.INDEX_PATH).exists():
        print("Индекс не найден, собираем...")
        db.build_initial_index()
    else:
        print("Загружаем существующий индекс FAISS...")
        db.load_index()

    yield


app = FastAPI(title="Medical Assistant API", lifespan=lifespan)


class Query(BaseModel):
    symptoms: str


def _icd_codes_from_doc(page_content: str) -> list[str]:
    codes = []
    for m in re.finditer(r"Коды МКБ:\s*([^\n]+)", page_content):
        raw = m.group(1).strip()
        for part in re.split(r"[,;]", raw):
            code = part.strip()
            if code and len(code) <= 10:
                codes.append(code)
    return codes


@app.post("/diagnose")
async def predict(data: Query) -> dict:
    k = getattr(settings, "SEARCH_K", 6)
    docs = db.search(data.symptoms, k=k)
    context_raw = "\n\n".join([doc.page_content for doc in docs])
    max_chars = getattr(settings, "CONTEXT_MAX_CHARS", None)
    context = (
        context_raw[:max_chars]
        if max_chars and len(context_raw) > max_chars
        else context_raw
    )
    retrieved_icd = []
    for doc in docs:
        retrieved_icd.extend(_icd_codes_from_doc(doc.page_content))
    retrieved_icd_set = {c.upper().strip() for c in retrieved_icd if c}

    try:
        answer = brain.generate_diagnosis(data.symptoms, context)
    except (
        httpx.RemoteProtocolError,
        httpx.ConnectError,
        httpx.TimeoutException,
        OllamaResponseError,
        ConnectionError,
    ) as e:
        err_msg = str(e)
        print("[diagnose] Ollama error:", type(e).__name__, err_msg, flush=True)
        raise HTTPException(
            status_code=503,
            detail={
                "error": "llm_unavailable",
                "message": "Ollama недоступен. Проверьте OLLAMA_API_KEY и OLLAMA_BASE_URL.",
                "detail": err_msg,
            },
        ) from e

    try:
        if isinstance(answer, str):
            clean_answer = answer.replace("```json", "").replace("```", "").strip()
            structured = json.loads(clean_answer)
            if isinstance(structured, dict) and "diagnoses" in structured:
                diagnoses = structured["diagnoses"]
            else:
                diagnoses = []
        else:
            diagnoses = []
    except Exception:
        diagnoses = []

    def one(
        rank: int, diagnosis: str = "", icd10_code: str = "", explanation: str = ""
    ) -> dict:
        return {
            "rank": rank,
            "diagnosis": diagnosis,
            "icd10_code": icd10_code,
            "explanation": explanation,
        }

    if not diagnoses or not isinstance(diagnoses, list):
        return {"diagnoses": [one(i) for i in range(1, 4)]}

    out = []
    for i, d in enumerate(diagnoses[:10]):
        if isinstance(d, dict):
            rank = d.get("rank", i + 1)
            code = d.get("icd10_code", d.get("icd10", "")) or ""
            diag = d.get("diagnosis", "") or ""
            expl = d.get("explanation", "") or ""
        else:
            rank = i + 1
            code = str(d) if d else ""
            diag = ""
            expl = ""
        out.append(one(rank, diag, code, expl))
    out.sort(key=lambda x: x["rank"])
    if out and retrieved_icd_set:
        top_code = (out[0].get("icd10_code") or "").strip().upper()
        if top_code and top_code not in retrieved_icd_set:
            out[0] = one(
                out[0]["rank"],
                out[0].get("diagnosis", ""),
                retrieved_icd[0] if retrieved_icd else top_code,
                out[0].get("explanation", "")
                or "Выбрано из топ-релевантного протокола.",
            )
    return {"diagnoses": out[:10]}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
