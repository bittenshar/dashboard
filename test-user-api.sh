#!/bin/bash

# Test script for User Data API
# Run this script to test the user endpoints

BASE_URL="http://localhost:3000"
echo "🚀 Testing User Data API on $BASE_URL"
echo ""

# Test 1: Check if server is running
echo "1️⃣ Testing server health..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" $BASE_URL/api/public/events
echo ""

# Test 2: Try to access users endpoint without authentication (should fail)
echo "2️⃣ Testing users endpoint without authentication (should return 401)..."
curl -s -w "HTTP Status: %{http_code}\n" $BASE_URL/api/users
echo ""

# Test 3: Login to get authentication token
echo "3️⃣ Login test (you'll need actual credentials)..."
echo "Example login command:"
echo 'curl -X POST $BASE_URL/api/auth/login \'
echo '  -H "Content-Type: application/json" \'
echo '  -d {"email": "your-email@example.com", "password": "your-password"} \'
echo '  -c cookies.txt'
echo ""

# Test 4: Show how to use the authenticated endpoint
echo "4️⃣ After login, test users endpoint with authentication:"
echo 'curl -X GET $BASE_URL/api/users \'
echo '  -H "Content-Type: application/json" \'
echo '  -b cookies.txt \'
echo '  | jq ".data.users | length" # Count users'
echo ""

# Test 5: Alternative - using Authorization header
echo "5️⃣ Alternative - using Authorization header:"
echo 'curl -X GET $BASE_URL/api/users \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \'
echo '  | jq ".data.users[0:3]" # Show first 3 users'
echo ""

# Test 6: Filter users by verification status
echo "6️⃣ Filter users by verification status:"
echo "Pending users:"
echo 'curl -s -X GET $BASE_URL/api/users -b cookies.txt | jq ".data.users[] | select(.verificationStatus == \"pending\")"'
echo ""
echo "Verified users:"
echo 'curl -s -X GET $BASE_URL/api/users -b cookies.txt | jq ".data.users[] | select(.verificationStatus == \"verified\")"'
echo ""
echo "Rejected users:"
echo 'curl -s -X GET $BASE_URL/api/users -b cookies.txt | jq ".data.users[] | select(.verificationStatus == \"rejected\")"'
echo ""

# Test 7: Update user verification status
echo "7️⃣ Update user verification status:"
echo "Verify a user:"
echo 'curl -X PATCH $BASE_URL/api/users/USER_ID_HERE \'
echo '  -H "Content-Type: application/json" \'
echo '  -b cookies.txt \'
echo '  -d "{\"verificationStatus\": \"verified\"}"'
echo ""
echo "Reject a user:"
echo 'curl -X PATCH $BASE_URL/api/users/USER_ID_HERE \'
echo '  -H "Content-Type: application/json" \'
echo '  -b cookies.txt \'
echo '  -d "{\"verificationStatus\": \"rejected\"}"'
echo ""
echo "Set user to pending:"
echo 'curl -X PATCH $BASE_URL/api/users/USER_ID_HERE \'
echo '  -H "Content-Type: application/json" \'
echo '  -b cookies.txt \'
echo '  -d "{\"verificationStatus\": \"pending\"}"'
echo ""

# Test 8: Practical example with real user ID
echo "8️⃣ Practical example with real user ID (Frank Garcia - currently rejected):"
echo "Change Frank Garcia (6881ff180792e8c3cfe7feb5) to verified:"
echo 'curl -X PATCH $BASE_URL/api/users/6881ff180792e8c3cfe7feb5 \'
echo '  -H "Content-Type: application/json" \'
echo '  -b cookies.txt \'
echo '  -d "{\"verificationStatus\": \"verified\"}"'
echo ""
echo "Change Frank Garcia back to pending:"
echo 'curl -X PATCH $BASE_URL/api/users/6881ff180792e8c3cfe7feb5 \'
echo '  -H "Content-Type: application/json" \'
echo '  -b cookies.txt \'
echo '  -d "{\"verificationStatus\": \"pending\"}"'
echo ""

echo "📋 Available User API Endpoints:"
echo "• GET /api/users - Get all users (admin/employee only)"
echo "• GET /api/users/:id - Get specific user"
echo "• PATCH /api/users/:id - Update user (admin/employee only)"
echo "• DELETE /api/users/:id - Delete user (admin only)"
echo "• POST /api/users/verify-face - Verify user face (admin/employee only)"
echo ""

echo "🔑 Authentication required for all user endpoints"
echo "📧 Login endpoint: POST /api/auth/login"
echo "🚪 Logout endpoint: GET /api/auth/logout"
