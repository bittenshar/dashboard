#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:3000';

// Test event creation with different data formats
async function testEventCreation() {
  console.log('🔍 Testing Event Creation API...');
  
  try {
    // Test data for event creation
    const testEventData = {
      name: "Test Event Debug",
      description: "A test event for debugging",
      location: "Test Location",
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      startTime: "10:00",
      endTime: "18:00",
      totalTickets: 100,
      ticketPrice: 50,
      status: "upcoming", // Use backend enum value
      organizer: "507f1f77bcf86cd799439011" // Dummy MongoDB ObjectId
    };

    console.log('\n1. Testing Event Creation...');
    console.log('Event data to send:', JSON.stringify(testEventData, null, 2));
    
    const eventResponse = await makeRequest('POST', '/api/events', testEventData);
    console.log(`\nStatus: ${eventResponse.status}`);
    console.log('Response:', JSON.stringify(eventResponse.data, null, 2));
    
    if (eventResponse.status === 201) {
      console.log('✅ Event created successfully!');
    } else if (eventResponse.status === 500) {
      console.log('❌ Internal Server Error - likely validation or database issue');
      console.log('Error details:', eventResponse.data);
    } else if (eventResponse.status === 401) {
      console.log('🔐 Authentication required - this is expected');
    } else {
      console.log(`❌ Unexpected status: ${eventResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run the test
testEventCreation().catch(console.error);
