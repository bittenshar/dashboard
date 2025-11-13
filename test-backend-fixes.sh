#!/bin/bash

# Test script for backend integration fixes
echo "🧪 Starting backend integration tests..."

# Run backend server if it's not already running
if ! curl -s http://localhost:3001/api/debug > /dev/null; then
  echo "🔄 Backend server doesn't appear to be running, starting it..."
  
  # Open a new terminal window to run the server
  # This command will work on macOS - adjust for your OS
  cd ../nodejs\ Main2\ copy && osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && node src/server.js"' &
  
  # Give some time for the server to start
  echo "⏳ Waiting 5 seconds for server to start..."
  sleep 5
else
  echo "✅ Backend server appears to be running"
fi

# Run the test script
echo "🚀 Running integration tests..."
node test-backend-fixes.js

echo "Done! Check the results above to see if all fixes are working."



 