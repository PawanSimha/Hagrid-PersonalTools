@echo off
:: Author: Pawan Simha
TITLE Hagrid Quick Start
echo ==========================================
echo    Hagrid Professional Utility Suite
echo ==========================================
echo.

:: Set the project directory to the current folder where the bat file is located
set "PROJECT_DIR=%~dp0"

:: Change to the project directory
cd /d "%PROJECT_DIR%"

echo [1/3] Activating virtual environment...
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment '.venv' not found in %PROJECT_DIR%!
    echo Please run 'setup.bat' first to initialize the environment.
    pause
    exit /b
)

call .venv\Scripts\activate.bat

echo [2/3] Launching your browser...
:: This opens your default browser automatically
start "" "http://127.0.0.1:8000"

echo [3/3] starting Hagrid server...
echo.
echo Server is launching at http://127.0.0.1:8000
echo Close this window to stop the server.
echo.

python app.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server stopped unexpectedly.
    pause
)
