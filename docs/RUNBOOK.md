# Runbook

> **Status:** Placeholder — fill in actual commands as services are built.

## Prerequisites

- [ ] TODO: list required tools (Python version, Node version, etc.)

## Backend (`src/`)

```bash
# TODO: create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# TODO: install dependencies
pip install -r src/requirements.txt

# TODO: start the server
uvicorn src.main:app --reload
```

## Frontend (`frontend/`)

```bash
# TODO: install dependencies
cd frontend
npm install

# TODO: start the dev server
npm run dev
```

## ML (`ml/`)

```bash
# TODO: install ML dependencies
pip install -r ml/requirements.txt

# TODO: run training / inference script
python ml/train.py
```

## Running Tests

```bash
# TODO: backend tests
pytest src/

# TODO: frontend tests
cd frontend && npm test
```
