import { adminService } from '@/services/adminService';

// Simple test file to verify backend connection
// This file can be imported and used in components for testing

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await adminService.testConnection();
    console.log('✅ Backend health check passed:', healthResponse);
    
    return {
      success: true,
      message: 'Backend connection successful',
      data: healthResponse
    };
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    
    return {
      success: false,
      message: 'Backend connection failed',
      error: error.message
    };
  }
};

export const testEmployeeEndpoints = async () => {
  try {
    console.log('Testing employee endpoints...');
    
    // Test get all employees (this requires authentication)
    const employeesResponse = await adminService.getAllEmployees();
    console.log('✅ Get employees endpoint passed:', employeesResponse);
    
    return {
      success: true,
      message: 'Employee endpoints working',
      data: employeesResponse
    };
  } catch (error) {
    console.error('❌ Employee endpoints test failed:', error);
    
    return {
      success: false,
      message: 'Employee endpoints failed',
      error: error.message
    };
  }
};
