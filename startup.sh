#!/bin/bash

echo "==================================="
echo "FinFlow - Project Startup Script"
echo "==================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3 and try again"
    exit 1
fi

# Create and activate Python virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment"
        exit 1
    fi
fi

echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "Error: Failed to activate virtual environment"
    exit 1
fi

# Install Python requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Warning: Some packages may not have installed correctly"
    echo "Continuing anyway..."
fi

# Create data directory if it doesn't exist
if [ ! -d "backend/data" ]; then
    echo "Creating data directory..."
    mkdir -p backend/data
fi

# Start backend server in a new terminal
echo "Starting backend server..."
gnome-terminal -- bash -c "source venv/bin/activate && python main.py" 2>/dev/null || \
xterm -e "source venv/bin/activate && python main.py" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && source venv/bin/activate && python main.py"' 2>/dev/null || \
(echo "Could not open a new terminal window, starting in background"; source venv/bin/activate && python main.py &)

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Backend is running, but frontend cannot be started"
    echo "Please install Node.js and run the frontend manually"
    exit 1
fi

# Change to frontend directory and install npm dependencies if needed
echo "Setting up frontend..."
cd frontend
if [ $? -ne 0 ]; then
    echo "Error: Frontend directory not found"
    echo "Backend is running, but frontend cannot be started"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install frontend dependencies"
        echo "Backend is running, but frontend cannot be started"
        cd ..
        exit 1
    fi
fi

# Start frontend server
echo "Starting frontend server..."
gnome-terminal -- bash -c "npm start" 2>/dev/null || \
xterm -e "npm start" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm start"' 2>/dev/null || \
(echo "Could not open a new terminal window, starting in background"; npm start &)

echo "==================================="
echo "All systems started!"
echo "- Backend running at: http://localhost:8000"
echo "- Frontend running at: http://localhost:3000"
echo "==================================="

# Return to project root directory
cd .. 