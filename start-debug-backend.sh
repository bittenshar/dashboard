#!/bin/bash

# Run the backend server with detailed logging

echo "🚀 Starting backend server with detailed logging..."
echo "👀 Press Ctrl+C to stop the server"

# Set Node to development mode for more verbose output
export NODE_ENV=development

# Enable additional Node.js debugging (uncomment if needed)
# export DEBUG=express:*

# Set additional environment variables for testing
export AWS_SDK_LOAD_CONFIG=1

# Get the absolute path of this script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../nodejs Main2 copy"

echo "📂 Starting server in $(pwd)"

# Run the server with debugging enabled
node --trace-warnings src/server.js

# Exit message
echo "✋ Server stopped"
