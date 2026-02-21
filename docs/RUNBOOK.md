# Runbook

> Complete setup and development guide for DiagnoScope.

## Prerequisites

- Python 3.13+
- [UV](https://docs.astral.sh/uv/) for Python package management
- Docker and Docker Compose
- PostgreSQL (via Docker)

## Initial Setup

### 1. Prepare Configuration Files

Copy the example config files for different environments:

```shell
# For tests
cp config-example.yaml config-local.yaml

# For local development
cp config-example.yaml config.yaml

# For production
cp config-example.yaml config-prod.yaml
```

Edit each config file with appropriate database credentials.

### 2. Setup UV Environment

```shell
# Create virtual environment
uv venv

# Install dependencies
uv sync
```

### 3. Setup Pre-Commit Hooks

```shell
pre-commit install
```

## Local Development

### Start Database

```shell
# Using just
just up

# Or using docker-compose directly
docker-compose up -d
```

### Run Migrations

```shell
alembic upgrade head
```

### Run API Server

```shell
# Using just (recommended)
just api

# Or manually with uvicorn
uv run uvicorn src.presentation.api.app:create_app --factory --port 8080 --reload
```

The API will be available at `http://localhost:8080`.

### Common Development Commands

```shell
# View logs
just logs

# Check service status
just status

# Restart services
just restart

# Stop everything
just down
```

## Testing

### Run All Tests

```shell
# Using just (starts test DB, runs tests, tears down)
just test
```

### Run Tests Manually

```shell
# Start test database
docker compose -f docker-compose-test.yml up --build -d

# Run tests
uv run pytest

# Stop test database
docker compose -f docker-compose-test.yml down -v
```

### Start Test Database Only

```shell
just test-db-up
```

## Production Deployment

### Start All Services

```shell
docker compose -f docker-compose.prod.yml up -d
```

This starts:
- Postgres database
- Alembic migrations (runs automatically)
- API server (port 8000)

### View Logs

```shell
docker compose -f docker-compose.prod.yml logs -f
```

### Stop Services

```shell
docker compose -f docker-compose.prod.yml down
```

## Linting and Formatting

```shell
just lint
```

This runs:
- `ruff format` — auto-format code
- `ruff check --fix` — lint and auto-fix issues

## Database Operations

```shell
# Start only the database
just db-up

# Stop database
just db-down

# View database logs
just db-logs

# Create a new migration
alembic revision --autogenerate -m "description"
```
