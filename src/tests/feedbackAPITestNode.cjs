// Simple Node.js test for feedback API
const https = require('https');
const http = require('http');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  // Test credentials - replace with actual admin credentials
  testUser: {
    email: 'admin@thrillathon.com',
    password: 'admin123'
  }
};

// Helper function to make HTTP requests
const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const protocol = options.hostname === 'localhost' ? http : https;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Step 1: Login to get authentication token
const login = async () => {
  console.log('🔐 Logging in to get authentication token...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, config.testUser);
    
    if (response.statusCode === 200 && response.data.token) {
      console.log('✅ Login successful!');
      console.log('Token:', response.data.token.substring(0, 20) + '...');
      return response.data.token;
    } else {
      console.log('❌ Login failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
};

// Step 2: Test feedback submission
const testFeedbackSubmission = async (token) => {
  console.log('\n📝 Testing feedback submission...');
  
  // Sample feedback data
  const feedbackData = {
    user: "6881ff180792e8c3cfe7feb0", // Real user ID from database
    event: "6881ff170792e8c3cfe7fea8", // Real event ID from database (Basketball Championship)
    rating: 5,
    category: "overall",
    subject: "API Test Feedback",
    message: "This is a test feedback submission to verify the API is working correctly. The system should accept this feedback and store it properly."
  };
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/feedback',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = await makeRequest(options, feedbackData);
    
    console.log('Response Status:', response.statusCode);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 201) {
      console.log('✅ Feedback submitted successfully!');
      return response.data;
    } else {
      console.log('❌ Feedback submission failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Feedback submission error:', error.message);
    return null;
  }
};

// Step 3: Test getting all feedback
const testGetFeedback = async (token) => {
  console.log('\n📋 Testing get all feedback...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/feedback',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    console.log('Response Status:', response.statusCode);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Feedback retrieved successfully!');
      console.log(`Found ${response.data.results || 0} feedback entries`);
      return response.data;
    } else {
      console.log('❌ Get feedback failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Get feedback error:', error.message);
    return null;
  }
};

// Step 4: Test getting all employees (admin only)
const testGetEmployees = async (token) => {
  console.log('\n👥 Testing get all employees...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/employees',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    console.log('Response Status:', response.statusCode);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Employees retrieved successfully!');
      console.log(`Found ${response.data.data?.employees ? response.data.data.employees.length : 0} employees`);
      return response.data;
    } else {
      console.log('❌ Get employees failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Get employees error:', error.message);
    return null;
  }
};

// Step 5: Test employee creation
const testEmployeeCreation = async (token) => {
  console.log('\n👤 Testing employee creation...');
  
  // Sample employee data
  const employeeData = {
    fullName: "John Test Employee",
    email: "john.test" + Date.now() + "@company.com", // Unique email
    password: "password123",
    phone: "+1234567890",
    role: "employee",
    permissions: ["users", "events"],
    verificationStatus: "pending",
    status: "active"
  };
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/employees',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = await makeRequest(options, employeeData);
    
    console.log('Response Status:', response.statusCode);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 201) {
      console.log('✅ Employee created successfully!');
      return response.data;
    } else {
      console.log('❌ Employee creation failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Employee creation error:', error.message);
    return null;
  }
};

// Main test function
const runTests = async () => {
  console.log('=== Feedback API Test Suite ===\n');
  
  try {
    // Step 1: Login
    const token = await login();
    if (!token) {
      console.log('❌ Cannot proceed without authentication token');
      return;
    }
    
    // Step 2: Test getting existing feedback
    await testGetFeedback(token);
    
    // Step 3: Test creating new feedback
    await testFeedbackSubmission(token);
    
    // Step 4: Test getting all employees
    await testGetEmployees(token);
    
    // Step 5: Test creating a new employee
    await testEmployeeCreation(token);
    
    console.log('\n=== Test Suite Complete ===');
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
};

// Run the tests
runTests();
