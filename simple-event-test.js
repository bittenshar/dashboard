#!/usr/bin/env node

// Simple test for event creation API
import http from 'http';

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
            data: parsed,
            raw: responseData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            raw: responseData
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

async function testEventCreation() {
  console.log('🔍 Testing Event Creation API...\n');
  
  // Test data for event creation
  const testEventData = {
    name: "Test Event Debug",
    description: "A test event for debugging",
    location: "Test Location",
    date: "2025-07-26", // String format
    startTime: "10:00",
    endTime: "18:00",
    totalTickets: 100,
    ticketPrice: 50,
    status: "upcoming", // Use backend enum value
    organizer: "507f1f77bcf86cd799439011" // Dummy MongoDB ObjectId
  };

  console.log('Event data to send:', JSON.stringify(testEventData, null, 2));
  
  try {
    const response = await makeRequest('POST', '/api/events', testEventData);
    console.log(`\nStatus: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Raw response:', response.raw);
    
    if (response.status === 201) {
      console.log('✅ Event created successfully!');
    } else if (response.status === 500) {
      console.log('❌ Internal Server Error detected');
    } else if (response.status === 401) {
      console.log('🔐 Authentication required');
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEventCreation();
