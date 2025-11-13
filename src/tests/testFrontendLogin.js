// Test frontend login API to verify the fix
import { AuthService } from '../constants/api/backend-api-superset.js';

const testFrontendLogin = async () => {
  console.log('🔐 Testing frontend login API...');
  
  const credentials = {
    email: 'admin@thrillathon.com',
    password: 'admin123'
  };
  
  try {
    const response = await AuthService.login(credentials);
    console.log('✅ Frontend login successful!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Check if token and user were stored
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('admin_user');
    
    console.log('Token stored:', token ? token.substring(0, 20) + '...' : 'None');
    console.log('User stored:', user ? JSON.parse(user) : 'None');
    
  } catch (error) {
    console.error('❌ Frontend login failed:', error.message);
  }
};

// Run the test
testFrontendLogin();
