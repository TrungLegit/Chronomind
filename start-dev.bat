@echo off
setlocal enabledelayedexpansion
title Chronomind Launcher

:: Chuyen ve dung thu muc chua file bat
cd /d "%~dp0"

echo ===================================================
echo   CHRONOMIND - AI Dynamic Project ^& Deadline Planner
echo ===================================================
echo.

:: 1. Kiem tra cap nhat tu GitHub
echo [1/4] Dang kiem tra ban cap nhat tu GitHub...
git fetch origin main --quiet 2>nul
if errorlevel 1 goto :offline

set BEHIND=0
for /f %%i in ('git rev-list HEAD..origin/main --count') do set BEHIND=%%i
if "%BEHIND%"=="" set BEHIND=0

if %BEHIND% GTR 0 (
    echo.
    echo **********************************************************
    echo   [THONG BAO] Phat hien co %BEHIND% ban cap nhat moi tren GitHub!
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
    goto :check_env
)

echo [OK] Ban dang o phien ban moi nhat tren GitHub.
echo.
goto :check_env

:offline
echo [Notice] Khong the ket noi den GitHub (Che do Offline). Tiep tuc khoi chay local...
echo.

:check_env
:: 2. Kiem tra file cau hinh .env
if not exist "%~dp0backend\.env" (
    echo [Setup] Dang tao file cau hinh backend/.env tu .env.example...
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
)

:: 3. Khoi dong Backend FastAPI
echo [2/4] Khoi dong Backend (FastAPI tai http://localhost:8000)...
start "Chronomind Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: 4. Khoi dong Frontend Next.js
echo [3/4] Khoi dong Frontend (Next.js tai http://localhost:3000)...
start "Chronomind Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

:: 5. Cho server khoi dong va tu dong mo trinh duyet
echo [4/4] Dang mo trinh duyet Web...
ping 127.0.0.1 -n 3 >nul
start http://localhost:3000

echo.
echo ===================================================
echo   CHRONOMIND DA KHOI CHAY THANH CONG!
echo   - Giao dien Web: http://localhost:3000 (Da tu dong mo)
echo   - Swagger API Docs: http://localhost:8000/docs
echo ===================================================
echo.
echo [Luu y] Hai cua so Backend va Frontend dang chay ngam de phuc vu web.
echo Nhan phim bat ky de dong cua so khoi dong nay (Server van tiep tuc chay)...
pause >nul
