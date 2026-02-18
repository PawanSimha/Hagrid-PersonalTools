@echo off
TITLE Hagrid Environment Setup
echo ==========================================
echo    Hagrid Professional Environment Setup
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.10 or higher.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b
)

echo [1/3] Creating virtual environment...
if exist ".venv" (
    echo Virtual environment '.venv' already exists.
) else (
    python -m venv .venv
)

echo [2/3] Activating environment and installing dependencies...
echo This may take a few minutes depending on your internet speed.
echo.

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b
)

echo [3/3] Creating Desktop Shortcut...
set "TARGET_SCRIPT=%~dp0run_hagrid.bat"
set "ICON_PATH=%~dp0images\logo.ico"
set "SHORTCUT_PATH=%~dp0Hagrid.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_SCRIPT%'; $s.IconLocation = '%ICON_PATH%'; $s.Save()"

echo.
echo [INFO] Setup complete!
echo ---------------------------------------------------------
echo [TIP] You can now move the 'Hagrid' shortcut file to your
echo       Desktop for easy access!
echo ---------------------------------------------------------
echo.
pause
