#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:3000';

// Test event creation with real organizer data
async function testEventWithRealOrganizer() {
  console.log('🔍 Testing Event Creation with Real Organizer...');
  
  try {
    // First, get the list of organizers
    console.log('\n1. Fetching available organizers...');
    const organizersResponse = await makeRequest('GET', '/api/organizers');
    
    if (organizersResponse.status === 200 && organizersResponse.data?.data?.data?.organizers) {
      const organizers = organizersResponse.data.data.data.organizers;
      console.log(`✅ Found ${organizers.length} organizers`);
      
      if (organizers.length > 0) {
        const firstOrganizer = organizers[0];
        const organizerId = firstOrganizer._id || firstOrganizer.organiserId;
        console.log(`🎯 Using organizer: ${firstOrganizer.name} (ID: ${organizerId})`);
        
        // Now test event creation with real organizer
        const testEventData = {
          name: "Test Event with Real Organizer",
          description: "Testing event creation with a real organizer ID",
          location: "Test Conference Center",
          date: new Date('2025-08-15').toISOString(),
          startTime: "10:00",
          endTime: "18:00",
          totalTickets: 100,
          ticketPrice: 50,
          status: "upcoming",
          organizer: organizerId // Real organizer ID
        };

        console.log('\n2. Creating event with real organizer...');
        console.log('Event data:', JSON.stringify(testEventData, null, 2));
        
        const eventResponse = await makeRequest('POST', '/api/events', testEventData);
        console.log(`\nStatus: ${eventResponse.status}`);
        console.log('Response:', JSON.stringify(eventResponse.data, null, 2));
        
        if (eventResponse.status === 201) {
          console.log('✅ Event created successfully with real organizer!');
        } else {
          console.log(`❌ Event creation failed: ${eventResponse.status}`);
          console.log('Error details:', eventResponse.data);
        }
      } else {
        console.log('❌ No organizers found');
      }
    } else {
      console.log(`❌ Failed to fetch organizers: ${organizersResponse.status}`);
      console.log('Response:', organizersResponse.data);
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
testEventWithRealOrganizer().catch(console.error);
