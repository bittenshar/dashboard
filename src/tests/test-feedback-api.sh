#!/bin/bash

# Feedback API Test Script
echo "=== Feedback API Test ==="

BASE_URL="http://localhost:3000/api/auth/admin-login"
TOKEN="your-auth-token-here"  # Replace with actual token

# Test data
USER_ID="507f1f77bcf86cd799439011"  # Replace with actual user ID
EVENT_ID="507f1f77bcf86cd799439012"  # Replace with actual event ID

echo "Testing POST /api/feedback..."
echo ""

# Test POST request
curl -X POST "$BASE_URL/api/feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user": "'$USER_ID'",
    "event": "'$EVENT_ID'",
    "rating": 5,
    "category": "overall",
    "subject": "Test Feedback via cURL",
    "message": "This is a test feedback submission using cURL to verify the API endpoint is working correctly."
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v

echo ""
echo "==========================="
echo ""

echo "Testing GET /api/feedback..."
echo ""

# Test GET request
curl -X GET "$BASE_URL/api/feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v

echo ""
echo "=== Test Complete ==="
