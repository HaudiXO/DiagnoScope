# DiagnoScope

Hackathon monorepo for Team DiagnoScope (frontend + backend + ML).

## Quickstart

```shell
# 1. Setup UV and install dependencies
uv sync

# 2. Copy config files
cp config-example.yaml config.yaml
cp config-example.yaml config-local.yaml

# 3. Start database and API
just up
alembic upgrade head
just api
```

The API will be available at `http://localhost:8080`.

## Development

### Common Commands

```shell
just api          # Run API server with hot reload
just test         # Run all tests
just lint         # Format and lint code
just up           # Start database
just down         # Stop services
```

See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for complete setup and development instructions.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/` | Next.js React frontend |
| `src/` | Litestar REST API backend |
| `ml/` | Machine learning models and training |
| `docs/` | Documentation |
| `tests/` | Test suite |

See [`docs/STRUCTURE.md`](docs/STRUCTURE.md) for detailed architecture and organization.

## API Contract

See [`CONTRACT.md`](CONTRACT.md) for the agreed API schema between frontend and backend.

## Tech Stack

- **Backend**: Python 3.13, Litestar, SQLAlchemy 2.0, PostgreSQL
- **Frontend**: Next.js, React, TypeScript
- **ML**: Python, Jupyter notebooks
- **Tools**: UV, Docker, Alembic, Ruff, pytest
