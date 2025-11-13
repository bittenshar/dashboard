#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:3000';

// Test employee creation with proper authentication
async function testEmployeeCreation() {
  console.log('🔍 Testing Employee Creation API...');
  
  try {
    // Test data for employee creation
    const testEmployeeData = {
      fullName: "Test Employee",
      email: "employee@test.com",
      password: "testpassword123",
      phone: "+1234567890",
      permissions: ["manage_users", "manage_events"]
    };

    console.log('\n1. Testing Employee Creation...');
    console.log('Employee data to send:', JSON.stringify(testEmployeeData, null, 2));
    
    // Try without authentication first
    console.log('\n2. Testing without authentication...');
    const unauthResponse = await makeRequest('POST', '/api/admin/employees', testEmployeeData);
    console.log(`Status: ${unauthResponse.status}`);
    console.log('Response:', JSON.stringify(unauthResponse.data, null, 2));
    
    if (unauthResponse.status === 401) {
      console.log('✅ Expected: Authentication required');
    }
    
    // Test with dummy auth token (to see what response we get)
    console.log('\n3. Testing with dummy auth token...');
    const authResponse = await makeRequest('POST', '/api/admin/employees', testEmployeeData, {
      'Authorization': 'Bearer dummy-token'
    });
    console.log(`Status: ${authResponse.status}`);
    console.log('Response:', JSON.stringify(authResponse.data, null, 2));
    
    // Test fetching existing employees
    console.log('\n4. Testing GET employees endpoint...');
    const getResponse = await makeRequest('GET', '/api/admin/employees', null, {
      'Authorization': 'Bearer dummy-token'
    });
    console.log(`Status: ${getResponse.status}`);
    console.log('Response:', JSON.stringify(getResponse.data, null, 2));
    
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
testEmployeeCreation().catch(console.error);
