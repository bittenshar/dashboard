/**
 * Test utility to verify array safety fixes
 * This helps us validate that our defensive array checks work correctly
 */

// Test function to simulate different API response formats
const testApiResponseFormats = () => {
  console.log('Testing API response format handling...');
  
  const testResponses = [
    // Valid array response
    { data: [{ id: 1, name: 'Test User' }] },
    
    // Nested array response
    { data: { users: [{ id: 1, name: 'Test User' }] } },
    
    // Direct array response
    [{ id: 1, name: 'Test User' }],
    
    // Empty response
    {},
    
    // Null response
    null,
    
    // Undefined response
    undefined,
    
    // Non-array data
    { data: { message: 'No users found' } }
  ];
  
  testResponses.forEach((response, index) => {
    console.log(`Test ${index + 1}:`, response);
    
    // Simulate our array safety logic
    let usersData = [];
    if (response?.data) {
      usersData = Array.isArray(response.data) ? response.data : 
                  Array.isArray(response.data.users) ? response.data.users : [];
    } else if (Array.isArray(response)) {
      usersData = response;
    }
    
    console.log(`Result: ${Array.isArray(usersData)} (length: ${usersData.length})`);
    console.log('---');
  });
  
  console.log('Array safety tests completed!');
};

// Test defensive array operations
const testArrayOperations = () => {
  console.log('Testing defensive array operations...');
  
  const testArrays = [
    [{ verificationStatus: 'verified' }, { verificationStatus: 'pending' }],
    [],
    null,
    undefined,
    'not an array',
    { length: 2 } // Object with length property but not an array
  ];
  
  testArrays.forEach((testArray, index) => {
    console.log(`Array test ${index + 1}:`, testArray);
    
    // Our defensive approach
    const safeArray = Array.isArray(testArray) ? testArray : [];
    const verifiedCount = safeArray.filter(item => item?.verificationStatus === 'verified').length;
    
    console.log(`Safe array: ${Array.isArray(safeArray)}, Verified count: ${verifiedCount}`);
    console.log('---');
  });
  
  console.log('Defensive array operation tests completed!');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.arrayTests = {
    testApiResponseFormats,
    testArrayOperations
  };
}

export { testApiResponseFormats, testArrayOperations };
