# DiagnoScope

Hackathon monorepo for Team DiagnoScope (frontend + backend + ML).

## Quickstart

### Backend Setup

```shell
# 1. Setup UV and install dependencies
uv sync

# 2. Copy config files
cp config-example.yaml config.yaml
cp config-example.yaml config-local.yaml

# 3. Start infrastructure and API
just up           # Starts Postgres, Airflow, ML infra, and Monitoring
alembic upgrade head
just api
```

The API will be available at `http://localhost:8080`.

### Frontend Setup

```shell
# 1. Install dependencies
cd frontend
npm install

# 2. Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Development

### Backend Commands

```shell
just api          # Run API server with hot reload (uses Granian)
just lint         # Format and lint code with Ruff
just up           # Start local dev stack (Postgres, Airflow, ML infra, Monitoring)
just down         # Stop all services
just db-up        # Start only PostgreSQL
just db-down      # Stop PostgreSQL
just logs         # View all service logs
```

### Frontend Commands

```shell
cd frontend && npm run dev      # Start Next.js dev server
cd frontend && npm run build  # Build for production
cd frontend && npm run lint     # Run ESLint
```

See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for complete setup and development instructions.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/` | Next.js 16 / React 19 / TypeScript frontend |
| `src/` | Litestar REST API backend |
| `qazcode/` | QAZ ML/NLP service (Airflow + ML processing) |
| `ml/` | Machine learning models and training |
| `docs/` | Documentation |
| `tests/` | Test suite |

See [`docs/STRUCTURE.md`](docs/STRUCTURE.md) for detailed architecture and organization.

## API Contract

See [`CONTRACT.md`](CONTRACT.md) for the agreed API schema between frontend and backend.

## Tech Stack

- **Backend**: Python 3.13, Litestar, SQLAlchemy 2.0, PostgreSQL, Granian
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **ML**: Python, Jupyter notebooks, Airflow, Qdrant, MinIO
- **Tools**: UV, Docker, Alembic, Ruff, pytest
