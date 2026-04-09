#!/bin/bash
echo "Starting LocalMind..."

# Start backend
echo "Starting backend on port 8000..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "LocalMind is running!"
echo "Open: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for either process to finish
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
