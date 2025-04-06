@echo off
echo Starting FinFlow Application...
echo.
echo Visit http://127.0.0.1:5000 in your browser after the server starts
echo Press Ctrl+C to stop the server when you're done
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

:: Check if required packages are installed
echo Checking required packages...
pip install -r requirements.txt

:: Create static directories if they don't exist
if not exist static\icons mkdir static\icons

:: Make service worker available
if exist static\service-worker.js (
    echo Service worker found
) else (
    echo Creating service worker...
    echo // Service worker placeholder > static\service-worker.js
)

:: Create manifest if it doesn't exist
if exist static\manifest.json (
    echo Manifest found
) else (
    echo Creating manifest...
    echo { "name": "FinFlow", "short_name": "FinFlow", "start_url": "/" } > static\manifest.json
)

:: Create CSV file if it doesn't exist
if not exist classified_transactions.csv (
    echo Creating initial data file...
    python -c "import csv; open('classified_transactions.csv', 'w').write('id,category,amount,created_at,payment_id,payment_status,description,source,user_id\n1,Food,500,2025-04-01,,manual,Initial food expense,manual,\n2,Transport,300,2025-04-02,,manual,Daily commute,manual,\n3,Shopping,1200,2025-04-03,,manual,Groceries,manual,\n')"
)

:: Run the application
echo Starting server...
echo.
python simple_app.py

pause 