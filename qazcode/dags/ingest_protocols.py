from datetime import datetime
from io import BytesIO
import json
import os
import uuid

from airflow import DAG
from airflow.decorators import task
from minio import Minio
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

# Default arguments for the DAG
default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime(2026, 1, 1),
    "retries": 1,
}


@task
def upload_raw_data():
    client = Minio(
        "minio:9000", access_key="minioadmin", secret_key="minioadmin", secure=False
    )
    bucket_name = "raw-protocols"
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)

    corpus_path = "/opt/airflow/data/corpus/protocols_corpus.jsonl"
    if os.path.exists(corpus_path):
        client.fput_object(bucket_name, "protocols_corpus.jsonl", corpus_path)
    else:
        print(f"File {corpus_path} not found.")


@task
def process_and_vectorize():
    client = Minio(
        "minio:9000", access_key="minioadmin", secret_key="minioadmin", secure=False
    )

    qdrant = QdrantClient(url="http://qdrant:6333")
    collection_name = "protocols"

    try:
        qdrant.delete_collection(collection_name)
    except Exception:
        pass

    qdrant.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=312, distance=Distance.COSINE),
    )

    model = SentenceTransformer("cointegrated/rubert-tiny2")

    try:
        client.fget_object(
            "raw-protocols", "protocols_corpus.jsonl", "/tmp/protocols_corpus.jsonl"
        )
    except Exception as e:
        print(f"Error fetching from MinIO: {e}")
        return

    points = []
    chunk_artifacts = []

    with open("/tmp/protocols_corpus.jsonl", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)
            protocol_id = data.get("protocol_id", str(uuid.uuid4()))
            title = data.get("title", "")
            text = data.get("text", "")
            icd_codes = data.get("icd_codes", [])

            paragraphs = text.split("\n")
            chunks = []
            curr = ""
            for p in paragraphs:
                if len(curr) + len(p) < 1000:
                    curr += p + "\n"
                else:
                    if curr.strip():
                        chunks.append(curr.strip())
                    curr = p + "\n"
            if curr.strip():
                chunks.append(curr.strip())

            for chunk_text in chunks:
                if not chunk_text:
                    continue
                chunk_id = str(uuid.uuid4())

                embed_text = (
                    f"Protocol: {title}. ICD: {', '.join(icd_codes)}.\n{chunk_text}"
                )
                embedding = model.encode(embed_text).tolist()

                payload = {
                    "protocol_id": protocol_id,
                    "title": title,
                    "icd_codes": icd_codes,
                    "text": chunk_text,
                }

                points.append(
                    PointStruct(id=chunk_id, vector=embedding, payload=payload)
                )
                chunk_artifacts.append(payload)

                if len(points) >= 100:
                    qdrant.upsert(collection_name=collection_name, points=points)
                    points = []
                    print("Upserted 100 points...")

    if points:
        qdrant.upsert(collection_name=collection_name, points=points)
        print("Upserted remaining points.")

    art_bucket = "processed-artifacts"
    if not client.bucket_exists(art_bucket):
        client.make_bucket(art_bucket)

    art_data = json.dumps(chunk_artifacts, ensure_ascii=False).encode("utf-8")
    client.put_object(
        art_bucket, "chunks.json", data=BytesIO(art_data), length=len(art_data)
    )


with DAG(
    dag_id="ingest_clinical_protocols",
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
) as dag:
    t1 = upload_raw_data()
    t2 = process_and_vectorize()
    t1 >> t2
