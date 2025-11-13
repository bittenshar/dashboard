#!/bin/bash

# Restart the backend server
echo "🔄 Restarting backend server..."

# First, try to find and kill the existing Node.js process
echo "🔍 Finding existing Node.js processes..."
NODE_PIDS=$(ps aux | grep "node.*src/server.js" | grep -v grep | awk '{print $2}')

if [ -n "$NODE_PIDS" ]; then
  echo "🛑 Stopping Node.js processes: $NODE_PIDS"
  kill $NODE_PIDS
  sleep 2
  # Check if processes are still running and force kill if needed
  REMAINING=$(ps -p $NODE_PIDS | grep -v "PID" | wc -l)
  if [ $REMAINING -gt 0 ]; then
    echo "⚠️ Force killing remaining processes..."
    kill -9 $NODE_PIDS
  fi
else
  echo "ℹ️ No running Node.js server processes found"
fi

# Change to the server directory
cd "../nodejs Main2 copy" || exit 1
echo "📂 Server directory: $(pwd)"

# Start the server
echo "🚀 Starting backend server..."
node src/server.js &
SERVER_PID=$!

# Give the server some time to start up
sleep 2

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
  echo "✅ Server started successfully with PID: $SERVER_PID"
  # Test the health endpoint
  echo "🔍 Testing health endpoint..."
  curl -s http://localhost:3001/api/health
  echo ""
else
  echo "❌ Server failed to start"
fi

echo "Done. The server is running in the background."
