// Test script for feedback API
import { buildUrl } from '../constants/api/config.js';

const testFeedbackAPI = async () => {
  const baseUrl = buildUrl('/feedback');

  // Sample test data
  const testFeedbackData = {
    user: "507f1f77bcf86cd799439011", // Replace with actual user ID from your database
    event: "507f1f77bcf86cd799439012", // Replace with actual event ID from your database
    rating: 5,
    category: "overall",
    subject: "Test Feedback Submission",
    message: "This is a test feedback message to verify the API is working correctly. The system should accept this feedback and store it in the database."
  };

  // You'll need to replace this with an actual token from your system
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODFmZjE2MDc5MmU4YzNjZmU3ZmU5NSIsImlhdCI6MTc1MzUxOTg0NSwiZXhwIjoxNzYxMjk1ODQ1fQ.Fr9p6iF4WhTfAr24jkUzn-3vvrO-IgVWRykj7FdeDfM";

  try {
    console.log('Testing POST /api/feedback...');
    console.log('Test Data:', JSON.stringify(testFeedbackData, null, 2));

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testFeedbackData)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('Response Data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS: Feedback created successfully!');
      return responseData;
    } else {
      console.log('❌ ERROR: Failed to create feedback');
      console.log('Error details:', responseData);
      return null;
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error.message);
    return null;
  }
};

// Test getting all feedback
const testGetFeedback = async () => {
  const baseUrl = buildUrl('/feedback');
  const testToken = "your-auth-token-here";

  try {
    console.log('Testing GET /api/feedback...');

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response Status:', response.status);
    const responseData = await response.json();
    console.log('Response Data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS: Feedback retrieved successfully!');
      console.log(`Found ${responseData.results || 0} feedback entries`);
      return responseData;
    } else {
      console.log('❌ ERROR: Failed to get feedback');
      return null;
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error.message);
    return null;
  }
};

// Run tests
const runTests = async () => {
  console.log('=== Feedback API Test Suite ===\n');
  
  // Test 1: Get existing feedback
  console.log('1. Testing GET feedback...');
  await testGetFeedback();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Create new feedback
  console.log('2. Testing POST feedback...');
  await testFeedbackAPI();
  
  console.log('\n=== Test Suite Complete ===');
};

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFeedbackAPI, testGetFeedback, runTests };
} else {
  // Browser environment - attach to window
  window.testFeedbackAPI = testFeedbackAPI;
  window.testGetFeedback = testGetFeedback;
  window.runTests = runTests;
  
  console.log('Test functions available:');
  console.log('- testFeedbackAPI()');
  console.log('- testGetFeedback()'); 
  console.log('- runTests()');
}
