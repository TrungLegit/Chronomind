@echo off
setlocal enabledelayedexpansion
title Chronomind Launcher

echo ===================================================
echo   CHRONOMIND - AI Dynamic Project & Deadline Planner
echo ===================================================
echo.

:: 1. Kiem tra cap nhat tu GitHub
echo [1/3] Dang kiem tra ban cap nhat tu GitHub...
git fetch origin main --quiet 2>nul
if %errorlevel% equ 0 (
    for /f %%i in ('git rev-list HEAD..origin/main --count 2^>nul') do set BEHIND=%%i
    if defined BEHIND (
        if !BEHIND! gtr 0 (
            echo.
            echo **********************************************************
            echo   [THONG BAO] Phat hien co !BEHIND! ban cap nhat moi tren GitHub!
            echo **********************************************************
            echo.
            set /p PULL_CHOICE="Ban co muon tu dong cap nhat (git pull) ngay khong? [Y/n]: "
            if /i "!PULL_CHOICE!"=="" set PULL_CHOICE=Y
            if /i "!PULL_CHOICE!"=="Y" (
                echo.
                echo [Update] Dang tai ma nguon moi nhat ve...
                git pull origin main
                echo [OK] Cap nhat hoan tat!
                echo.
            ) else (
                echo [Skip] Bo qua cap nhat. Khoi chay phien ban hien tai...
                echo.
            )
        ) else (
            echo [OK] Ban dang o phien ban moi nhat tren GitHub.
            echo.
        )
    )
) else (
    echo [Notice] Khong the ket noi den GitHub (Che do Offline). Tiep tuc khoi chay local...
    echo.
)

:: 2. Khoi dong Backend FastAPI
echo [2/3] Khoi dong Backend (FastAPI tai http://localhost:8000)...
start "Chronomind Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

:: 3. Khoi dong Frontend Next.js
echo [3/3] Khoi dong Frontend (Next.js tai http://localhost:3000)...
start "Chronomind Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   CHRONOMIND DA KHOI CHAY HOAN TAT!
echo   - Giao dien Web: http://localhost:3000
echo   - Swagger API Docs: http://localhost:8000/docs
echo ===================================================
echo.
