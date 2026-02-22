# Runbook

> Complete setup and development guide for DiagnoScope.

## Prerequisites

- Python 3.13+
- [UV](https://docs.astral.sh/uv/) for Python package management
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Node.js 20+ (for frontend development)

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

### 4. Setup Frontend

```shell
cd frontend

# Install dependencies (using npm)
npm install

# Copy environment file
cp .env.local.example .env.local
```

## Local Development

### Start Development Stack

`just up` starts the full local development stack including PostgreSQL, Airflow, ML infrastructure (MinIO, Redis, Qdrant), and Monitoring (Prometheus, Grafana).

```shell
# Using just
just up

# Or using docker-compose directly
docker-compose up -d
```

### Start Database Only

```shell
just db-up
```

### Run Migrations

```shell
alembic upgrade head
```

### Run API Server

```shell
# Using just (recommended) - runs with Granian on port 8080
just api

# Or manually with Granian
uv run granian src.presentation.api.app:create_app --factory --port 8080 --interface asgi --log --access-log --reload
```

The API will be available at `http://localhost:8080`.

## Frontend Development

The frontend is a Next.js 16 application with React 19, TypeScript, and Tailwind CSS 4.

### Prerequisites

- Node.js 20+
- npm (comes with Node.js)

### Setup

```shell
cd frontend

# Install dependencies
npm install

# Copy environment variables (optional)
cp .env.local.example .env.local
```

### Run Development Server

```shell
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Build for Production

```shell
cd frontend
npm run build
```

### Run Production Build

```shell
cd frontend
npm run start
```

### Lint Frontend

```shell
cd frontend
npm run lint
```

### Frontend Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js app router pages and components |
| `app/components/` | React components (DiagnosisCard, PatientCard, ChatMessage, etc.) |
| `app/components/ui/` | UI primitives (Button, Card, Input, etc.) |
| `app/lib/` | API clients, utilities, and fixtures |
| `lib/` | Shared libraries (auth, i18n) |
| `public/` | Static assets (images, logos) |

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

# Clean up (down + remove volumes)
just clean
```

<!-- Temporarily removed until we have a stable test setup.
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
``` -->

## Production Deployment

### Start All Services

```shell
# Using just
just prod-up

# Or manually
docker compose -f docker-compose.prod.yml up -d
```

This starts:
- Postgres database
- Alembic migrations (runs automatically)
- API server (port 8000)
- Airflow (webserver, scheduler, worker, triggerer)
- QAZ ML/NLP service
- ML infrastructure (MinIO, Redis, Qdrant)
- Monitoring (Prometheus, Grafana, StatsD exporter)

### View Logs

```shell
just prod-logs
```

### Stop Services

```shell
just prod-down
```

### Rebuild Production Images

```shell
just prod-build
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

## ML Infrastructure

```shell
# Start ML services only (MinIO, Redis, Qdrant, Postgres)
just ml-infra-up

# Stop ML services
just ml-infra-down
```

## QAZ Service (ML/NLP Processing)

```shell
# Start QAZ service
just qaz-up

# Stop QAZ service
just qaz-down

# View QAZ logs
just qaz-logs

# Rebuild QAZ image
just qaz-build
```

## Airflow

```shell
# Start Airflow services
just airflow-up

# Stop Airflow services
just airflow-down

# View Airflow logs
just airflow-logs
```

## Monitoring

```shell
# Start monitoring stack (Prometheus, Grafana, StatsD)
just monitoring-up

# Stop monitoring stack
just monitoring-down
```

## Frontend Development

The frontend is a Next.js 16 application with React 19, TypeScript, and Tailwind CSS 4.

### Start Frontend Dev Server

```shell
cd frontend

# Start development server (port 3000)
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Build for Production

```shell
cd frontend
npm run build
```

### Frontend Linting

```shell
cd frontend
npm run lint
```

### Frontend Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/app/` | Next.js App Router pages and components |
| `frontend/app/components/` | React components (ui/, pages/) |
| `frontend/app/lib/` | API clients, utilities, fixtures |
| `frontend/lib/` | Shared libraries (auth, i18n) |
| `frontend/public/` | Static assets |

### Frontend Environment Variables

Create `frontend/.env.local` from the example file:

```shell
cp frontend/.env.local.example frontend/.env.local
```

Edit the file to set:
- `NEXT_PUBLIC_API_URL` — Backend API URL (default: `http://localhost:8080`)
