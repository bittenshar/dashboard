#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:3000';

// Test organizer creation with proper authentication
async function testOrganizerCreation() {
  console.log('🔍 Testing Organizer Creation API...');
  
  try {
    // Test data for organizer creation
    const testOrganizerData = {
      name: "Test Organization",
      email: "test@organization.com",
      phone: "+1234567890",
      address: "123 Test Street, Test City, Test State 12345",
      website: "https://test-organization.com",
      description: "A test organization for debugging",
      contactPerson: "John Test",
      status: "active"
    };

    console.log('\n1. Testing Organizer Creation...');
    console.log('Organizer data to send:', JSON.stringify(testOrganizerData, null, 2));
    
    // Try without authentication first
    console.log('\n2. Testing without authentication...');
    const unauthResponse = await makeRequest('POST', '/api/organizers', testOrganizerData);
    console.log(`Status: ${unauthResponse.status}`);
    console.log('Response:', JSON.stringify(unauthResponse.data, null, 2));
    
    if (unauthResponse.status === 401) {
      console.log('✅ Expected: Authentication required');
    }
    
    // Test with dummy auth token
    console.log('\n3. Testing with dummy auth token...');
    const authResponse = await makeRequest('POST', '/api/organizers', testOrganizerData, {
      'Authorization': 'Bearer dummy-token'
    });
    console.log(`Status: ${authResponse.status}`);
    console.log('Response:', JSON.stringify(authResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function makeRequest(method, path, data = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...extraHeaders
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
testOrganizerCreation().catch(console.error);
