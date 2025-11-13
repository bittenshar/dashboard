#!/bin/bash

# Backend Integration Test Script
echo "🚀 Testing Backend Integration for AdminPanel"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    if curl -s "$url" > /dev/null; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $response (expected $expected_status)${NC}"
        return 1
    fi
}

echo "1. Checking Backend Service"
echo "---------------------------"
if check_service "http://localhost:3000" "Backend (port 3000)"; then
    echo ""
    echo "2. Testing API Endpoints"
    echo "------------------------"
    test_endpoint "http://localhost:3000/api/health" "Health Check"
    test_endpoint "http://localhost:3000/api/admin/activity" "Admin Activity Log"
    test_endpoint "http://localhost:3000/api/admin/employees" "Get Employees" "401"
    echo ""
    echo -e "${YELLOW}Note: Employee endpoints require authentication (401 is expected)${NC}"
else
    echo ""
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo ""
    echo "To start the backend:"
    echo "  cd nodejscopy"
    echo "  npm install"
    echo "  npm start"
    exit 1
fi

echo ""
echo "3. Checking Frontend Service"
echo "-----------------------------"
if check_service "http://localhost:8080" "Frontend (port 8080)"; then
    echo ""
    echo -e "${GREEN}✅ All services are running!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:8080 in your browser"
    echo "2. Log in as an admin user"
    echo "3. Navigate to Admin Panel → Employee Management"
    echo "4. Click 'Test Backend' button to verify connection"
else
    echo ""
    echo -e "${YELLOW}⚠️  Frontend is not running${NC}"
    echo ""
    echo "To start the frontend:"
    echo "  npm install"
    echo "  npm run dev"
fi

echo ""
echo "🔧 For debugging, check:"
echo "- Browser console for API errors"
echo "- Network tab for failed requests"
echo "- Backend logs for server errors"
echo ""
echo "📚 See BACKEND_INTEGRATION.md for detailed documentation"
