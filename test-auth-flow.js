#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🔍 Testing Admin Login...');
  
  try {
    // Test login with common admin credentials
    const loginCredentials = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'admin@admin.com', password: 'password' },
      { email: 'test@admin.com', password: 'test123' },
      { email: 'admin@test.com', password: 'admin' }
    ];

    for (const creds of loginCredentials) {
      console.log(`\n🔐 Trying login with: ${creds.email}`);
      
      const loginResponse = await makeRequest('POST', '/api/auth/login', creds);
      console.log(`Status: ${loginResponse.status}`);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        
        // Extract token
        const token = loginResponse.data.token;
        if (token) {
          console.log('\n🎯 Testing authenticated event creation...');
          await testEventCreationWithAuth(token);
        }
        return;
      } else {
        console.log('❌ Login failed:', loginResponse.data);
      }
    }
    
    console.log('\n❌ All login attempts failed. Let\'s try to create an admin user...');
    await testCreateAdmin();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testCreateAdmin() {
  console.log('\n🔧 Attempting to create admin user...');
  
  const adminData = {
    name: 'Test Admin',
    email: 'test@admin.com',
    password: 'admin123',
    role: 'admin'
  };
  
  const signupResponse = await makeRequest('POST', '/api/auth/signup', adminData);
  console.log(`Signup Status: ${signupResponse.status}`);
  
  if (signupResponse.status === 201) {
    console.log('✅ Admin user created successfully!');
    console.log('Response:', JSON.stringify(signupResponse.data, null, 2));
    
    const token = signupResponse.data.token;
    if (token) {
      console.log('\n🎯 Testing authenticated event creation...');
      await testEventCreationWithAuth(token);
    }
  } else {
    console.log('❌ Admin creation failed:', signupResponse.data);
  }
}

async function testEventCreationWithAuth(token) {
  console.log('\n📅 Testing event creation with authentication...');
  
  // First, let's create an organizer
  const organizerData = {
    name: 'Test Organizer',
    email: 'organizer@test.com',
    phone: '1234567890',
    address: 'Test Address'
  };
  
  console.log('1. Creating organizer...');
  const orgResponse = await makeRequest('POST', '/api/organizers', organizerData, {
    'Authorization': `Bearer ${token}`
  });
  
  if (orgResponse.status !== 201) {
    console.log('❌ Failed to create organizer:', orgResponse.data);
    return;
  }
  
  console.log('✅ Organizer created:', orgResponse.data);
  const organizerId = orgResponse.data.data?._id || orgResponse.data._id;
  
  if (!organizerId) {
    console.log('❌ No organizer ID returned');
    return;
  }
  
  // Now create event
  const eventData = {
    name: 'Test Event with Auth',
    description: 'Test event with proper authentication',
    location: 'Test Location',
    date: '2025-08-01',
    startTime: '10:00',
    endTime: '18:00',
    totalTickets: 100,
    ticketPrice: 50,
    status: 'upcoming',
    organizer: organizerId
  };
  
  console.log('2. Creating event...');
  console.log('Event data:', JSON.stringify(eventData, null, 2));
  
  const eventResponse = await makeRequest('POST', '/api/events', eventData, {
    'Authorization': `Bearer ${token}`
  });
  
  console.log(`Event creation status: ${eventResponse.status}`);
  
  if (eventResponse.status === 201) {
    console.log('✅ Event created successfully!');
    console.log('Event response:', JSON.stringify(eventResponse.data, null, 2));
  } else {
    console.log('❌ Event creation failed:', eventResponse.data);
  }
}

async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
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
testLogin().catch(console.error);
