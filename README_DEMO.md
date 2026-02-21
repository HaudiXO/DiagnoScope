# Hackathon Demo UI

This directory contains the minimal frontend for the hackathon demo.

## Technologies Used
- Next.js (App Router)
- React
- Tailwind CSS
- TypeScript

## How to run the frontend

1. Make sure you have Node.js and npm installed.
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages
- `/` - Diagnose page (input data)
- `/history` - History page (view previous analyses)
- `/result/[id]` - Result detail page (view specific analysis)

## API Contract
The frontend is built to respect `CONTRACT.md` (which will be implemented later). Currently, the UI uses placeholders and static empty states.
