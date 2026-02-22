FROM apache/airflow:2.10.5

USER airflow

# Install all DAG dependencies at build time (not at runtime)
RUN pip install --no-cache-dir \
    minio \
    "qdrant-client==1.13.3" \
    "protobuf>=4.24,<6.0.0" \
    sentence-transformers
