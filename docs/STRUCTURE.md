# Repository Structure

```
DiagnoScope/
├── frontend/              # Next.js / React UI — owned by the frontend team
├── src/                   # Python backend (Litestar) — owned by the backend team
│   ├── domain/            # Entities, Value Objects, repository protocols (Clean Architecture)
│   ├── application/       # Use cases (interactors), DTOs, services
│   ├── infrastructure/    # DB models, migrations, repository implementations, DI
│   └── presentation/      # Litestar API controllers, middleware
├── ml/                    # ML models, notebooks, training scripts — owned by the ML team
├── data/
│   └── test_set/          # Shared test data and fixtures (do NOT commit large files)
├── docs/
│   ├── STRUCTURE.md       # This file — explains the folder layout
│   └── RUNBOOK.md         # How to run each service locally
├── tests/                 # Test suite (unit, integration)
├── CONTRACT.md            # Agreed API schema between frontend ↔ backend
├── README.md              # Project overview and quickstart
├── CLAUDE.md              # AI assistant context and conventions
├── justfile               # Common development commands
├── pyproject.toml         # Python dependencies (UV)
├── alembic.ini            # Database migration configuration
├── docker-compose.yml     # Local development services
├── docker-compose.prod.yml # Production deployment
└── .gitignore             # Ignores build artifacts, env files, OS junk
```

## What Goes Where

| Folder | Owner | What belongs here |
|--------|-------|-------------------|
| `frontend/` | Frontend | Next.js pages, components, styles, `package.json` |
| `src/domain/` | Backend | Entities, Value Objects, repository protocols |
| `src/application/` | Backend | Use cases (interactors), DTOs, services |
| `src/infrastructure/` | Backend | SQLAlchemy models, migrations, DI providers |
| `src/presentation/` | Backend | Litestar controllers, middleware, API routes |
| `tests/` | Backend | pytest test files, factories |
| `ml/` | ML | Jupyter notebooks, model weights (small), training scripts |
| `data/test_set/` | Shared | CSV/JSON test fixtures; keep files small |
| `docs/` | Everyone | Markdown documentation only |

## Architecture

This project follows **Clean Architecture** with four layers:

```
Presentation → Infrastructure → Application → Domain
```

- **Domain**: Core business logic, entities, value objects. No external dependencies.
- **Application**: Use cases (interactors), DTOs, domain services. Depends only on Domain.
- **Infrastructure**: Database models, migrations, repository implementations, DI.
- **Presentation**: Litestar REST API, controllers, middleware.

## Key Patterns

- **Value Objects**: All domain fields use VOs with built-in validation (e.g., `UserId`, `FirstName`).
- **Mappers**: Bidirectional conversion between domain entities and ORM models.
- **Interactor Pattern**: Each use case is a callable class inheriting from `Interactor[InputDTO, OutputDTO]`.
- **DI with Dishka**: Dependency injection providers register dependencies by scope.

## Rules

1. **Do not** commit secrets, `.env` files, or large binary blobs.
2. **Do not** add dependencies of one service to another service's folder.
3. Keep `CONTRACT.md` updated whenever the API schema changes.
4. Never pass ORM models to application/domain layers — always use mappers.
5. Tests must maintain 90% coverage minimum.
