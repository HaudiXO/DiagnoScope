# Repository Structure

```
.
├── frontend/        # Next.js / React UI (team: frontend)
├── src/             # Python backend / API server (team: backend)
├── ml/              # ML models, training scripts, notebooks (team: ML)
├── data/
│   └── test_set/    # Evaluation fixtures and golden outputs (do NOT commit large files)
├── docs/
│   ├── STRUCTURE.md # This file — explains what goes where
│   └── RUNBOOK.md   # How to run each service
├── CONTRACT.md      # Agreed API shape between frontend ↔ backend
└── README.md        # Project overview and quick links
```

## Rules of thumb

| Folder | What belongs here |
|--------|------------------|
| `frontend/` | All UI code, components, pages, public assets |
| `src/` | API routes, business logic, database models |
| `ml/` | Jupyter notebooks, model weights references, training code |
| `data/test_set/` | Small JSON/CSV fixtures for offline testing only |
| `docs/` | Markdown documentation only — no code |

## Key conventions

- Keep `src/`, `ml/`, and `frontend/` independent; they communicate only through the contract in `CONTRACT.md`.
- Large binary files (model weights, datasets) go in cloud storage — add to `.gitignore`, not to git.
- Every folder has a `.gitkeep` until real files are added.
