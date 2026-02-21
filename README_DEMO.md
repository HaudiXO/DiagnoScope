# Demo UI — Run Instructions

The Next.js frontend lives at the **repo root** (not a subfolder).

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Copy env template
cp .env.local.example .env.local
# Edit .env.local if your backend is on a different port

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|---|---|
| `/` | Patient dashboard — lists all patients, add new |
| `/patient/[id]` | Patient detail — chat, diagnose, task board |
| `/result/[id]` | Diagnosis result detail + compare mode |
| `/history` | Global diagnosis history |

## Demo Mode (no backend)

Set `NEXT_PUBLIC_USE_MOCK=true` in `.env.local` to run entirely from local fixture data — no backend required.

Интерфейс на русском по умолчанию.

## Technologies

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Zod (schema validation)

## API Contract

The frontend calls `POST /diagnose` on the backend. See [`src/mock_server.py`](./src/mock_server.py) for the API definition.
