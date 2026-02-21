# Repo Structure

```
HAck/
├── app/                    # Next.js frontend (App Router)
│   ├── components/         # Shared React components
│   ├── lib/                # API client, fixtures, utils
│   ├── patient/[id]/       # Patient detail + chat + diagnose
│   ├── result/[id]/        # Diagnosis result + compare mode
│   ├── history/            # Global history page
│   ├── layout.tsx          # Root layout (nav, fonts)
│   └── page.tsx            # Home — patient dashboard
│
├── src/                    # Python backend
│   └── mock_server.py      # FastAPI server (POST /diagnose)
│
├── data/                   # Evaluation dataset
│   └── test_set/           # JSON patient test cases
│
├── extras/                 # Optional / non-runtime content
│   └── notebooks/          # LLM API experiments (Jupyter)
│
├── docs/                   # Project documentation
│   └── STRUCTURE.md        # This file
│
├── public/                 # Next.js static assets (SVGs)
│
├── evaluate.py             # Evaluator script — DO NOT MODIFY
├── pyproject.toml          # Python project config (uv)
├── uv.lock                 # Locked Python dependencies
├── Dockerfile              # Builds Python backend image
│
├── package.json            # Node.js dependencies
├── package-lock.json       # Locked Node.js dependencies
├── next.config.ts          # Next.js config
├── tsconfig.json           # TypeScript config
├── postcss.config.mjs      # PostCSS / Tailwind config
├── eslint.config.mjs       # ESLint config
│
├── .env.local.example      # Env var template (copy → .env.local)
├── .gitignore              # Git ignore rules
├── .dockerignore           # Docker ignore rules
├── .python-version         # Python version pin (for uv)
│
├── README.md               # Project overview + run instructions
└── README_DEMO.md          # Frontend-specific demo instructions
```

## Who does what

| Layer | Where | How to run |
|---|---|---|
| **Frontend** | `app/` (Next.js, root) | `npm run dev` → localhost:3000 |
| **Backend** | `src/` (FastAPI) | `uv run uvicorn src.mock_server:app --port 8000` |
| **Evaluator** | `evaluate.py` | `uv run python evaluate.py` |
| **Docker** | `Dockerfile` | `docker build -t hack-nu . && docker run -p 8000:8000 hack-nu` |
