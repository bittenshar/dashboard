#!/bin/bash

# Test script for event creation debugging

echo "🧪 Testing Event Creation"
echo "========================="

# First, let's try to create a test organizer
echo ""
echo "1. Creating a test organizer..."

ORGANIZER_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/organizers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organizer", 
    "email": "test@example.com",
    "phone": "1234567890",
    "address": "Test Address",
    "status": "active"
  }')

echo "Organizer creation response:"
echo "$ORGANIZER_RESPONSE"

# Extract organizer ID from response (if successful)
ORGANIZER_ID=$(echo "$ORGANIZER_RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ORGANIZER_ID" ]; then
    echo ""
    echo "✅ Organizer created with ID: $ORGANIZER_ID"
    
    echo ""
    echo "2. Now testing event creation with organizer ID..."
    
    EVENT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/events" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Test Event\",
        \"description\": \"A test event for debugging\",
        \"location\": \"Test Location\",
        \"date\": \"2025-08-15T00:00:00.000Z\",
        \"startTime\": \"18:00\",
        \"endTime\": \"22:00\",
        \"totalTickets\": 100,
        \"ticketPrice\": 50,
        \"status\": \"upcoming\",
        \"organizer\": \"$ORGANIZER_ID\"
      }")
    
    echo "Event creation response:"
    echo "$EVENT_RESPONSE"
    
else
    echo "❌ Failed to create organizer or extract organizer ID"
    echo ""
    echo "Let's try to get existing organizers..."
    
    EXISTING_ORGANIZERS=$(curl -s -X GET "http://localhost:3000/api/organizers")
    echo "Existing organizers:"
    echo "$EXISTING_ORGANIZERS"
fi

echo ""
echo "🏁 Test completed"
