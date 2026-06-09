@echo off
title Hagrid Professional Suite

echo ========================================
echo   Hagrid Professional Utility Suite
echo   Starting server...
echo ========================================
echo.

if not exist ".venv\" (
    echo Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo Error: Python not found. Install Python 3.10+ and try again.
        pause
        exit /b 1
    )
)

call .venv\Scripts\activate.bat

echo Installing dependencies (this may take a few minutes first time)...
call pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Package installation failed.
    pause
    exit /b 1
)

echo.
echo Starting server at http://127.0.0.1:8000
echo.
start /B uvicorn app:app --host 127.0.0.1 --port 8000 --reload >nul 2>&1

timeout /t 3 /nobreak >nul

start http://127.0.0.1:8000

echo Browser opened. Press Ctrl+C in this window to stop the server.
echo.

:waitLoop
timeout /t 10 /nobreak >nul
goto waitLoop
