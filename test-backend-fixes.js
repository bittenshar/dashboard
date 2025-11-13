/**
 * Backend Integration Test Script
 * Use this script to test API endpoints after applying fixes
 */

const BASE_URL = 'http://localhost:3001';
let authToken = null;

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null, includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`🚀 ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { 
      status: response.status, 
      success: response.ok, 
      data, 
      message: data.message || (response.ok ? 'Success' : 'Failed') 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      message: `Request failed: ${error.message}` 
    };
  }
}

// Test functions
async function testAuth() {
  console.log('\n📋 TESTING AUTHENTICATION');
  
  // Test login
  const credentials = {
    email: 'admin1@example.com',  // Update with your admin credentials
    password: 'password123'       // Update with your admin password
  };
  
  const loginResult = await makeRequest('/api/auth/admin-login', 'POST', credentials, false);
  console.log(`✅ Login: ${loginResult.success ? 'Successful' : 'Failed'}`);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log(`🔑 Auth Token: ${authToken.substring(0, 20)}...`);
    
    // Test token validation
    const validationResult = await makeRequest('/api/auth/validate-token');
    console.log(`🔐 Token validation: ${validationResult.success ? 'Valid' : 'Invalid'}`);
    
    return true;
  }
  
  return false;
}

async function testPublicEndpoints() {
  console.log('\n📋 TESTING PUBLIC ENDPOINTS');
  
  // Test public organizers endpoint
  const organizersResult = await makeRequest('/api/public/organizers', 'GET', null, false);
  console.log(`📊 Public organizers endpoint: ${organizersResult.success ? 'Working' : 'Failed'}`);
  if (organizersResult.success) {
    console.log(`   Found ${organizersResult.data.results || 'unknown number of'} organizers`);
  }
  
  return organizersResult.success;
}

async function testAuthenticatedEndpoints() {
  console.log('\n📋 TESTING AUTHENTICATED ENDPOINTS');
  
  // Test users endpoint
  const usersResult = await makeRequest('/api/users');
  console.log(`👥 Users endpoint: ${usersResult.success ? 'Working' : 'Failed'}`);
  
  // Test events endpoint
  const eventsResult = await makeRequest('/api/events');
  console.log(`🎫 Events endpoint: ${eventsResult.success ? 'Working' : 'Failed'}`);
  
  // Test event stats endpoint
  const eventStatsResult = await makeRequest('/api/events/stats');
  console.log(`📈 Event stats endpoint: ${eventStatsResult.success ? 'Working' : 'Failed'}`);
  
  // Test registrations endpoint
  const registrationsResult = await makeRequest('/api/registrations');
  console.log(`📝 Registrations endpoint: ${registrationsResult.success ? 'Working' : 'Failed'}`);
  
  // Test registrations stats endpoint
  const registrationsStatsResult = await makeRequest('/api/registrations/stats');
  console.log(`📊 Registrations stats endpoint: ${registrationsStatsResult.success ? 'Working' : 'Failed'}`);
  
  // Test organizers endpoint
  const organizersResult = await makeRequest('/api/organizers');
  console.log(`👔 Organizers endpoint: ${organizersResult.success ? 'Working' : 'Failed'}`);
  
  return {
    users: usersResult.success,
    events: eventsResult.success,
    eventStats: eventStatsResult.success,
    registrations: registrationsResult.success,
    registrationsStats: registrationsStatsResult.success,
    organizers: organizersResult.success
  };
}

// Main test function
async function runTests() {
  console.log('🧪 STARTING API INTEGRATION TESTS');
  console.log('=================================');
  
  const isAuthenticated = await testAuth();
  
  if (!isAuthenticated) {
    console.log('❌ Authentication failed. Cannot continue with authenticated tests.');
    console.log('🔄 Continuing with public endpoint tests only...');
  }
  
  const publicEndpointsWorking = await testPublicEndpoints();
  
  if (isAuthenticated) {
    const authEndpointsResults = await testAuthenticatedEndpoints();
    
    // Calculate overall success
    const totalTests = Object.keys(authEndpointsResults).length;
    const successfulTests = Object.values(authEndpointsResults).filter(Boolean).length;
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('======================');
    console.log(`Authentication: ${isAuthenticated ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Public endpoints: ${publicEndpointsWorking ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Authenticated endpoints: ${successfulTests}/${totalTests} passed`);
    
    if (successfulTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Your API integration is working correctly.');
    } else {
      console.log(`\n⚠️ ${totalTests - successfulTests} TESTS FAILED. Some endpoints still need attention.`);
    }
  } else {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('======================');
    console.log(`Authentication: ❌ FAILED`);
    console.log(`Public endpoints: ${publicEndpointsWorking ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\n⚠️ Cannot test authenticated endpoints without successful authentication.`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});
