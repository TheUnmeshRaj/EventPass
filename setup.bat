@echo off
REM EventPass Face Recognition - Quick Start Script

echo.
echo ================================
echo EventPass Face Recognition Setup
echo ================================
echo.

REM Check if running from root directory
if not exist "clientside" (
    echo Error: Please run this script from the EventPass root directory
    exit /b 1
)

echo.
echo Step 1: Setting up Python Backend...
echo.

cd facerecog

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

REM Copy env file
if not exist ".env" (
    copy .env.example .env
    echo Created .env file - please edit with your settings
)

echo.
echo Step 2: Setting up Node.js Frontend...
echo.

cd ..\clientside

REM Install Node dependencies
echo Installing Node dependencies...
call npm install

REM Copy env file
if not exist ".env.local" (
    copy .env.example .env.local
    echo Created .env.local file - please edit with your settings
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Edit facerecog\.env with your settings
echo 2. Edit clientside\.env.local with your Supabase credentials
echo 3. Run the backend: cd facerecog && venv\Scripts\activate && python main.py
echo 4. In another terminal, run: cd clientside && npm run dev
echo.
echo Backend will be at: http://localhost:8000
echo Frontend will be at: http://localhost:3000
echo.
