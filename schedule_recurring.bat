@echo off
echo Setting up scheduled task for FinFlow recurring expenses...
echo.

:: Get full path to the Python script
set "SCRIPT_PATH=%~dp0process_recurring.py"
set "PYTHON_PATH=python"

:: Create task to run daily at 8 AM
echo Creating Windows Task Scheduler task to run daily at 8:00 AM...
schtasks /create /tn "FinFlow Recurring Expenses" /tr "%PYTHON_PATH% %SCRIPT_PATH%" /sc daily /st 08:00 /f

if %errorlevel% equ 0 (
    echo.
    echo Success! Task scheduled successfully.
    echo FinFlow will now process recurring expenses automatically each day at 8:00 AM.
    echo.
) else (
    echo.
    echo Failed to create scheduled task. You may need administrator privileges.
    echo You can manually schedule the script to run daily:
    echo   1. Open Task Scheduler
    echo   2. Create a Basic Task named "FinFlow Recurring Expenses"
    echo   3. Set it to run daily at 8:00 AM
    echo   4. Set the action to start a program: %PYTHON_PATH% %SCRIPT_PATH%
    echo.
)

pause 