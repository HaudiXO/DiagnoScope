import json
from pathlib import Path

from config import settings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings


def _get_embeddings():
    try:
        import torch

        cuda_ok = torch.cuda.is_available()
    except Exception:
        cuda_ok = False
    device = "cpu"
    if cuda_ok:
        device = "cuda"
    if getattr(settings, "EMBEDDING_DEVICE", ""):
        requested = settings.EMBEDDING_DEVICE.strip().lower()
        if requested == "cuda" and cuda_ok:
            device = "cuda"
        elif requested == "cpu":
            device = "cpu"
    return HuggingFaceEmbeddings(
        model_name=settings.EMBEDDING_MODEL,
        model_kwargs={"device": device},
    )


def _format_icd_codes(icd_codes) -> str:
    if isinstance(icd_codes, list):
        return ", ".join(str(c) for c in icd_codes)
    return str(icd_codes)


class ProtocolDB:
    def __init__(self):
        self.embeddings = _get_embeddings()
        self.vectorstore = None

    def _load_corpus(self):
        path = Path(settings.DATA_PATH)
        if not path.exists():
            raise FileNotFoundError(f"Corpus not found: {path}")
        data = []
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data.append(json.loads(line))
                except json.JSONDecodeError as e:
                    raise ValueError(f"Invalid JSONL line: {e}") from e
        return data

    def build_initial_index(self):
        data = self._load_corpus()
        if not data:
            raise ValueError("Corpus is empty")

        texts = []
        metadatas = []
        max_chars = settings.INDEX_MAX_CHARS
        for r in data:
            title = r.get("title") or ""
            icd_str = _format_icd_codes(r.get("icd_codes", []))
            text = r.get("text") or ""
            raw = f"Протокол: {title}\nКоды МКБ: {icd_str}\nТекст: {text}"
            texts.append(raw[:max_chars])
            metadatas.append(
                {
                    "protocol_id": str(r.get("protocol_id", "")),
                    "title": str(title),
                }
            )

        batch_size = settings.INDEX_BATCH_SIZE
        self.vectorstore = FAISS.from_texts(
            texts[:batch_size],
            self.embeddings,
            metadatas=metadatas[:batch_size],
        )
        for i in range(batch_size, len(texts), batch_size):
            batch_texts = texts[i : i + batch_size]
            batch_meta = metadatas[i : i + batch_size]
            self.vectorstore.add_texts(batch_texts, metadatas=batch_meta)
        self.vectorstore.save_local(settings.INDEX_PATH)
        return "Index built successfully"

    def load_index(self):
        self.vectorstore = FAISS.load_local(
            settings.INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True
        )

    def search(self, query: str, k: int = 6):
        if self.vectorstore is None:
            raise RuntimeError("Index not loaded.")
        return self.vectorstore.similarity_search(query, k=k)
