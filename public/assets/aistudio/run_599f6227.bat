@echo off
REM ============================================================
REM torupload-safe-downloader -- auto-run (GUI)
REM Double-click this file to launch the GUI.
REM Or run from command line: run.bat "https://torupload.com/file/..."
REM ============================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

REM --- Check Python ---
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
)

REM --- Check Playwright ---
python -c "import playwright" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [INFO] Installing Chromium browser for Playwright...
    python -m playwright install chromium
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Chromium.
        pause
        exit /b 1
    )
)

REM --- Launch GUI ---
echo [INFO] Launching GUI...
if not "%~1"=="" (
    python gui.py
) else (
    start "" pythonw gui.py
)
