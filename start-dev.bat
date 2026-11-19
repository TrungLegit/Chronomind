@echo off
echo ===================================================
echo   CHRONOMIND - AI Dynamic Project & Deadline Planner
echo ===================================================
echo.

echo [1/2] Starting Backend (FastAPI on http://localhost:8000)...
start "Chronomind Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend (Next.js on http://localhost:3000)...
start "Chronomind Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo - Web App: http://localhost:3000
echo - API Docs (Swagger): http://localhost:8000/docs
echo ===================================================
