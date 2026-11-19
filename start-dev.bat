@echo off
setlocal enabledelayedexpansion
title Chronomind Launcher

:: Chuyen ve dung thu muc chua file bat
cd /d "%~dp0"

echo ==================================================================
echo   CHRONOMIND - AI Dynamic Project ^& Deadline Planner
echo ==================================================================
echo.

:: 1. Kiem tra moi truong he thong (Python & Node.js)
echo [1/5] Kiem tra moi truong he thong...
where python >nul 2>nul
if errorlevel 1 (
    echo.
    echo [LOI] Khong tim thay Python tren he thong!
    echo Vui long cai dat Python 3.10 tro len tai: https://www.python.org/downloads/
    echo *Luu y: Nho tick chon vao o 'Add python.exe to PATH' khi cai dat.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo [LOI] Khong tim thay Node.js / npm tren he thong!
    echo Vui long cai dat Node.js (LTS) tai: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Python va Node.js da san sang.
echo.

:: 2. Kiem tra cap nhat tu GitHub (neu co git)
echo [2/5] Kiem tra cap nhat tu GitHub...
where git >nul 2>nul
if errorlevel 1 goto :skip_git

git fetch origin main --quiet 2>nul
if errorlevel 1 goto :offline

set BEHIND=0
for /f %%i in ('git rev-list HEAD..origin/main --count 2^>nul') do set BEHIND=%%i
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
        echo [Update] Dang tai ma nguon moi nhat ve...
        git pull origin main
        echo [OK] Cap nhat hoan tat!
        echo.
    ) else (
        echo [Skip] Bo qua cap nhat. Khoi chay phien ban hien tai...
        echo.
    )
    goto :check_dependencies
)

echo [OK] Ban dang o phien ban moi nhat tren GitHub.
echo.
goto :check_dependencies

:offline
echo [Notice] Khong the ket noi den GitHub (Che do Offline). Tiep tuc khoi chay...
echo.
goto :check_dependencies

:skip_git
echo [Notice] Git khong co san tren PATH. Bo qua kiem tra cap nhat...
echo.

:check_dependencies
:: 3. Tu dong cai dat Backend neu la may moi (chua co venv)
if not exist "%~dp0backend\.env" (
    echo [Setup] Tao file cau hinh backend/.env tu .env.example...
    if exist "%~dp0backend\.env.example" (
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    ) else (
        type nul > "%~dp0backend\.env"
    )
)

if not exist "%~dp0backend\venv\Scripts\python.exe" (
    echo.
    echo ==========================================================
    echo   [LAN DAU CHAY] Phat hien chua co moi truong Backend venv!
    echo   Dang tu dong khoi tao Python Virtual Environment...
    echo ==========================================================
    python -m venv "%~dp0backend\venv"
    if errorlevel 1 (
        echo [LOI] Khong the tao virtualenv. Vui long kiem tra lai quyen truy cap hoac Python.
        pause
        exit /b 1
    )
    echo [Setup] Dang cai dat cac thu vien backend (FastAPI, SQLAlchemy, v.v.)...
    echo [Luu y] Qua trinh nay mat khoang 1-2 phut trong lan dau tien chay.
    "%~dp0backend\venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
    "%~dp0backend\venv\Scripts\python.exe" -m pip install -r "%~dp0backend\requirements.txt"
    if errorlevel 1 (
        echo [LOI] Cai dat dependencies backend that bai.
        pause
        exit /b 1
    )
    echo [OK] Da cai dat xong moi truong Backend!
    echo.
)

:: 4. Tu dong cai dat Frontend neu la may moi (chua co node_modules)
if not exist "%~dp0frontend\node_modules" (
    echo.
    echo ==========================================================
    echo   [LAN DAU CHAY] Phat hien chua co thu vien Frontend (node_modules)!
    echo   Dang tu dong chay 'npm install'...
    echo ==========================================================
    pushd "%~dp0frontend"
    call npm.cmd install
    popd
    if errorlevel 1 (
        echo [LOI] npm install that bai. Vui long kiem tra ket noi Internet.
        pause
        exit /b 1
    )
    echo [OK] Da cai dat xong thu vien Frontend!
    echo.
)

:: 5. Tim dia chi IP mang noi bo (de dien thoai cung Wi-Fi truy cap duoc)
set LOCAL_IP=localhost
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Test-Connection -ComputerName $env:COMPUTERNAME -Count 1 2>$null).IPV4Address.IPAddressToString" 2^>nul`) do (
    if not "%%i"=="" set LOCAL_IP=%%i
)

:: 6. Khoi dong Backend & Frontend (Chay thu nho / Minimized de khong nhay vao mat)
echo [3/5] Khoi dong Backend (FastAPI tren cong 8000)...
start /min "Chronomind_Backend_Server" cmd /c "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [4/5] Khoi dong Frontend (Next.js tren cong 3000)...
start /min "Chronomind_Frontend_Server" cmd /c "cd /d "%~dp0frontend" && npm.cmd run dev -- -H 0.0.0.0 -p 3000"

:: 7. Cho 3 giay va tu dong mo trinh duyet
echo [5/5] Dang ket noi va mo trinh duyet Web...
ping 127.0.0.1 -n 4 >nul
start http://localhost:3000

echo.
echo ==================================================================
echo   CHRONOMIND DA KHOI CHAY THANH CONG!
echo ==================================================================
echo   * Tren May Tinh nay:     http://localhost:3000
if not "%LOCAL_IP%"=="localhost" (
echo   * Tren Dien Thoai (Wi-Fi): http://%LOCAL_IP%:3000
)
echo   * Tai lieu API Swagger:  http://localhost:8000/docs
echo ==================================================================
echo.
echo [Luu y] Backend va Frontend dang chay ngam (thu nho duoi Taskbar).
echo De dong ung dung hoan toan, nhan bat ky phim nao tai day...
pause >nul

:: Dong ca 2 tien trinh khi tat launcher
taskkill /fi "WINDOWTITLE eq Chronomind_Backend_Server*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Chronomind_Frontend_Server*" /f >nul 2>&1
