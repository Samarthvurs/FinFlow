@echo off
ECHO ===================================
ECHO FinFlow - Project Startup Script
ECHO ===================================

REM Check if Python is installed
WHERE python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO Error: Python is not installed or not in PATH
    ECHO Please install Python and try again
    GOTO :END
)

REM Create and activate Python virtual environment
IF NOT EXIST venv (
    ECHO Creating Python virtual environment...
    python -m venv venv
    IF %ERRORLEVEL% NEQ 0 (
        ECHO Error: Failed to create virtual environment
        GOTO :END
    )
)

ECHO Activating virtual environment...
CALL venv\Scripts\activate.bat
IF %ERRORLEVEL% NEQ 0 (
    ECHO Error: Failed to activate virtual environment
    GOTO :END
)

REM Install Python requirements
ECHO Installing Python dependencies...
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    ECHO Warning: Some packages may not have installed correctly
    ECHO Continuing anyway...
)

REM Create data directory if it doesn't exist
IF NOT EXIST backend\data (
    ECHO Creating data directory...
    mkdir backend\data
)

REM Start backend server in a new window
ECHO Starting backend server...
START cmd /k "CALL venv\Scripts\activate.bat && python main.py"

REM Check if Node.js is installed
WHERE npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO Error: Node.js is not installed or not in PATH
    ECHO Backend is running, but frontend cannot be started
    ECHO Please install Node.js and run the frontend manually
    GOTO :END
)

REM Change to frontend directory and install npm dependencies if needed
ECHO Setting up frontend...
CD frontend
IF %ERRORLEVEL% NEQ 0 (
    ECHO Error: Frontend directory not found
    ECHO Backend is running, but frontend cannot be started
    GOTO :END
)

IF NOT EXIST node_modules (
    ECHO Installing frontend dependencies...
    CALL npm install
    IF %ERRORLEVEL% NEQ 0 (
        ECHO Error: Failed to install frontend dependencies
        ECHO Backend is running, but frontend cannot be started
        CD ..
        GOTO :END
    )
)

REM Start frontend server
ECHO Starting frontend server...
START cmd /k "npm start"

ECHO ===================================
ECHO All systems started!
ECHO - Backend running at: http://localhost:8000
ECHO - Frontend running at: http://localhost:3000
ECHO ===================================

REM Return to project root directory
CD ..

:END
ECHO ===================================
ECHO Press any key to exit...
PAUSE >nul 