set shell := ["bash", "-cu"]
set windows-shell := ["cmd.exe", "/c"]

# Docker Compose shortcuts
up:
    docker-compose up -d

down:
    docker-compose down

restart:
    docker-compose restart

# Database only
db-up:
    docker-compose up -d postgres

db-down:
    docker-compose stop postgres

db-logs:
    docker-compose logs -f postgres

# Application
app-up:
    docker-compose up -d app

app-logs:
    docker-compose logs -f app

# Development setup
setup:
    docker-compose up -d postgres
    @echo "PostgreSQL is starting up..."
    @echo "Database will be available at localhost:5432"
    @echo "Connection: postgresql://dev_user:dev_password@localhost:5432/ask_app"

# Clean up
clean:
    docker-compose down -v
    docker-compose rm -f

# Status
status:
    docker-compose ps

api:
    uv run granian src.presentation.api.app:create_app --factory --port 8080 --interface asgi --log --access-log --reload

# test:
#     docker compose -f docker-compose-test.yml up -d
#     uv run pytest -n auto -ss -vv --maxfail=1
#     docker compose -f docker-compose-test.yml down -v

# test-db-up:
#     docker compose -f docker-compose-test.yml up --build -d

lint:
    uv run ruff format src  # tests
    uv run ruff check src --fix  # tests

# Production stack (includes API + Airflow + ML + Monitoring)
prod-up:
    docker-compose -f docker-compose.prod.yml up -d

prod-down:
    docker-compose -f docker-compose.prod.yml down

prod-logs:
    docker-compose -f docker-compose.prod.yml logs -f

prod-build:
    docker-compose -f docker-compose.prod.yml build

# QAZ service (ML/NLP processing)
qaz-up:
    docker-compose -f docker-compose.prod.yml up -d qaz

qaz-down:
    docker-compose -f docker-compose.prod.yml stop qaz

qaz-logs:
    docker-compose -f docker-compose.prod.yml logs -f qaz

qaz-build:
    docker-compose -f docker-compose.prod.yml build qaz

# Individual service groups (works with both compose files)
airflow-up:
    docker-compose up -d airflow-webserver airflow-scheduler airflow-worker airflow-triggerer airflow-init

airflow-down:
    docker-compose stop airflow-webserver airflow-scheduler airflow-worker airflow-triggerer

airflow-logs:
    docker-compose logs -f airflow-webserver airflow-scheduler airflow-worker

# ML Infrastructure only
ml-infra-up:
    docker-compose up -d minio redis qdrant postgres

ml-infra-down:
    docker-compose stop minio redis qdrant postgres

# Monitoring stack
monitoring-up:
    docker-compose up -d prometheus grafana statsd-exporter

monitoring-down:
    docker-compose stop prometheus grafana statsd-exporter
