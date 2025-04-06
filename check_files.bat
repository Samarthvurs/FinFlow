@echo off
echo FinFlow Files Checker
echo ====================
echo.

:: Check Python application files
echo Checking application files...
set MISSING=0

:: Main application file
if not exist simple_app.py (
    echo [MISSING] simple_app.py - Main application file
    set MISSING=1
) else (
    echo [OK] simple_app.py
)

:: Check template directory and key files
if not exist templates (
    echo [MISSING] templates directory
    set MISSING=1
) else (
    echo [OK] templates directory
    
    :: Check key template files
    set TEMPLATE_FILES=home.html login.html signup.html page1.html page2.html payment.html
    for %%f in (%TEMPLATE_FILES%) do (
        if not exist templates\%%f (
            echo [MISSING] templates\%%f
            set MISSING=1
        ) else (
            echo [OK] templates\%%f
        )
    )
)

:: Check static directory
if not exist static (
    echo [MISSING] static directory
    set MISSING=1
) else (
    echo [OK] static directory
    
    :: Check CSS file
    if not exist static\css\style.css (
        echo [MISSING] static\css\style.css
        set MISSING=1
    ) else (
        echo [OK] static\css\style.css
    )
)

:: Check CSV file (will be created if not exists)
if not exist classified_transactions.csv (
    echo [NOTE] classified_transactions.csv will be created when you run the application
) else (
    echo [OK] classified_transactions.csv
)

:: Check run script
if not exist run_finflow.bat (
    echo [MISSING] run_finflow.bat - Startup script
    set MISSING=1
) else (
    echo [OK] run_finflow.bat
)

echo.
if %MISSING%==1 (
    echo [WARNING] Some files are missing! The application may not function correctly.
) else (
    echo [SUCCESS] All required files are present!
)

echo.
echo To run the application, double-click on run_finflow.bat
echo.
pause 