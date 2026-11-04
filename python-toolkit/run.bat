@echo off
REM ============================================================
REM StreamArmor Safe Downloader -- One-Click Windows Launcher
REM Double-click to launch GUI, or pass a URL on CLI:
REM   run.bat "https://torupload.com/file/..."
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

REM --- Check Python ---
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ not found in PATH.
    echo Please download and install Python from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM --- Check Dependencies ---
python -c "import requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing StreamArmor Python dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies via pip.
        pause
        exit /b 1
    )
)

REM --- Launch Mode ---
if not "%~1"=="" (
    echo [INFO] Launching CLI Downloader with URL: %~1
    python downloader.py --url "%~1"
    pause
) else (
    echo [INFO] Launching StreamArmor GUI...
    start "" pythonw gui.py
)
