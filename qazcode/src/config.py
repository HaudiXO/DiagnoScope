from pathlib import Path

from pydantic_settings import BaseSettings

_PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "https://ollama.com"
    OLLAMA_API_KEY: str = "01fda2db963640419ecd246d25038a0b.H6ZNSlI82efjNqxxKZjIDNbW"
    MODEL_NAME: str = "gpt-oss:120b-cloud"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DEVICE: str = "cuda"
    DATA_PATH: str = str(_PROJECT_ROOT / "data" / "protocols_corpus.jsonl")
    INDEX_PATH: str = str(_PROJECT_ROOT / "faiss_index")
    SEARCH_K: int = 6
    CONTEXT_MAX_CHARS: int = 18000
    INDEX_BATCH_SIZE: int = 1
    INDEX_MAX_CHARS: int = 3000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
