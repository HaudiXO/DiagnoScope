import os

from config import settings
from ollama import Client


class MedicalBrain:
    def __init__(self):
        self.client = Client(
            host=settings.OLLAMA_BASE_URL,
            headers={
                "Authorization": "Bearer "
                + (settings.OLLAMA_API_KEY or os.environ.get("OLLAMA_API_KEY", "")),
            },
            timeout=300.0,
        )

    def generate_diagnosis(self, query: str, context: str) -> str:
        system_prompt = f"""
        Ты - врач-эксперт Республики Казахстан. Ты отвечаешь на вопросы о медицине и здравоохранении в Республике Казахстан.

        {context}

        - Используй ТОЛЬКО коды МКБ-10 из блоков «Коды МКБ» в контексте. Запрещено придумывать коды.
        - Сначала определи, какой протокол из контекста наилучше соответствует анамнезу пациента. Rank 1 — ровно один код МКБ-10 из этого протокола, самый подходящий под описание пациента.
        - Остальные ранги — другие коды из контекста по убыванию релевантности. Отвечай на русском языке.
        """

        user_prompt = f"""
        КОНТЕКСТ ПРОТОКОЛОВ:
        {context}

        АНАМНЕЗ ПАЦИЕНТА:
        {query}

        Верни ответ ТОЛЬКО в виде одного JSON-объекта, без markdown и без текста до/после. Формат строго такой:
        {{"diagnoses": [
          {{"rank": 1, "diagnosis": "Название диагноза", "icd10_code": "КодМКБ", "explanation": "Краткое обоснование"}},
          {{"rank": 2, "diagnosis": "Название диагноза", "icd10_code": "КодМКБ", "explanation": "Краткое обоснование"}},
          {{"rank": 3, "diagnosis": "Название диагноза", "icd10_code": "КодМКБ", "explanation": "Краткое обоснование"}}
        ]}}

        Важно: все коды icd10_code бери ТОЛЬКО из списков «Коды МКБ» в контексте выше. Не выдумывай коды. Дай не менее 3 диагнозов по убыванию вероятности (rank 1 — наиболее подходящий под анамнез).
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        response = self.client.chat(
            settings.MODEL_NAME,
            messages=messages,
            stream=False,
        )
        return (response.message.content or "").strip()
