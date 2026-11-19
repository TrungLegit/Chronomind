#!/usr/bin/env bash
echo "==================================================="
echo "  CHRONOMIND - AI Dynamic Project & Deadline Planner"
echo "==================================================="
echo ""

echo "[1/2] Starting Backend (FastAPI on http://localhost:8000)..."
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) &

echo "[2/2] Starting Frontend (Next.js on http://localhost:3000)..."
(cd frontend && npm run dev) &

echo ""
echo "Both servers are launching!"
echo "- Web App: http://localhost:3000"
echo "- API Docs (Swagger): http://localhost:8000/docs"
wait
