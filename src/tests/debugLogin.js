// Simple frontend login debug test
const testLoginAPI = async () => {
  console.log('🔐 Testing login API directly...');
  
  const credentials = {
    email: 'admin@thrillathon.com',
    password: 'admin123'
  };
  
  try {
    const { buildUrl } = await import('../constants/api/config.js');
    const response = await fetch(buildUrl('/auth/admin-login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Login failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Call the test function
testLoginAPI();
