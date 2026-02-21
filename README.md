# Hack-NU — Medical Diagnosis Assistant

A hackathon project: an AI-powered medical diagnosis assistant with a Next.js frontend and a Python FastAPI backend.

---

## Repo Structure

```
.
├── app/              # Next.js app (pages, components, lib)
├── public/           # Static assets
├── src/              # Python backend (FastAPI, mock server)
├── data/             # Evaluation dataset (test cases)
├── extras/           # Optional extras (notebooks, experiments)
├── docs/             # Project documentation
├── evaluate.py       # Evaluator script (DO NOT MODIFY)
├── pyproject.toml    # Python dependencies (uv)
├── uv.lock           # Locked Python deps
├── Dockerfile        # Runs Python backend
├── package.json      # Node.js / Next.js deps
└── README.md         # This file
```

---

## Running the Frontend (Next.js)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.local.example .env.local

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For full demo instructions and page routes, see [`README_DEMO.md`](./README_DEMO.md).

---

## Running the Backend (Python / FastAPI)

### Option A — with uv (recommended)

```bash
uv sync
uv run uvicorn src.mock_server:app --reload --port 8000
```

### Option B — Docker

```bash
docker build -t hack-nu .
docker run -p 8000:8000 hack-nu
```

Backend runs at [http://localhost:8000](http://localhost:8000).

---

## Running the Evaluator

```bash
uv run python evaluate.py
```

Requires the backend to be running on port 8000.

---

## Environment Variables

Copy `.env.local.example` → `.env.local` before running the frontend:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_USE_MOCK` | `false` | Use local fixture data instead of live backend |
