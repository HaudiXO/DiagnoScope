# Repository Structure

```
DiagnoScope/
├── frontend/     # Next.js / React UI — owned by the frontend team
├── src/          # Python backend / API server — owned by the backend team
├── ml/           # ML models, notebooks, training scripts — owned by the ML team
├── data/
│   └── test_set/ # Shared test data and fixtures (do NOT commit large files)
├── docs/
│   ├── STRUCTURE.md  # This file — explains the folder layout
│   └── RUNBOOK.md    # How to run each service locally
├── CONTRACT.md   # Agreed API schema between frontend ↔ backend
├── README.md     # Project overview and quickstart
└── .gitignore    # Ignores build artifacts, env files, OS junk
```

## What Goes Where

| Folder | Owner | What belongs here |
|--------|-------|-------------------|
| `frontend/` | Frontend | Next.js pages, components, styles, `package.json` |
| `src/` | Backend | FastAPI/Flask app, routes, services, `requirements.txt` |
| `ml/` | ML | Jupyter notebooks, model weights (small), training scripts |
| `data/test_set/` | Shared | CSV/JSON test fixtures; keep files small |
| `docs/` | Everyone | Markdown documentation only |

## Rules

1. **Do not** commit secrets, `.env` files, or large binary blobs.
2. **Do not** add dependencies of one service to another service's folder.
3. Keep `CONTRACT.md` updated whenever the API schema changes.
