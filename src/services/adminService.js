// Admin API Service
import { apiUtils, API_ENDPOINTS } from '@/constants/api';

export const adminService = {
  // Test backend connection
  testConnection: async () => {
    try {
      const response = await apiUtils.get('/api/health');
      return response;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      throw error;
    }
  },

  // Get authentication token from localStorage
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },

  // Get auth headers with token
  getAuthHeaders: () => {
    const token = adminService.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  // Create new employee
  createEmployee: async (employeeData) => {
    try {
      const response = await apiUtils.post(
        API_ENDPOINTS.ADMIN.CREATE_EMPLOYEE,
        employeeData,
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Create employee failed:', error);
      throw error;
    }
  },

  // Get all employees
  getAllEmployees: async () => {
    try {
      const response = await apiUtils.get(
        API_ENDPOINTS.ADMIN.GET_ALL_EMPLOYEES,
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Get employees failed:', error);
      throw error;
    }
  },

  // Delete employee
  deleteEmployee: async (employeeId) => {
    try {
      const response = await apiUtils.delete(
        API_ENDPOINTS.ADMIN.DELETE_EMPLOYEE(employeeId),
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Delete employee failed:', error);
      throw error;
    }
  },

  // Update employee permissions
  updateEmployeePermissions: async (userId, permissions) => {
    try {
      const response = await apiUtils.patch(
        API_ENDPOINTS.ADMIN.UPDATE_EMPLOYEE_PERMISSIONS,
        { userId, permissions },
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Update employee permissions failed:', error);
      throw error;
    }
  },

  // Get activity log
  getActivityLog: async () => {
    try {
      const response = await apiUtils.get(
        API_ENDPOINTS.ADMIN.GET_ACTIVITY_LOG,
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Get activity log failed:', error);
      throw error;
    }
  },

  // Issue queued tickets for a specific user
  issuePendingTickets: async (userId) => {
    try {
      const response = await apiUtils.post(
        API_ENDPOINTS.ADMIN.ISSUE_PENDING_TICKETS(userId),
        {},
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Issue pending tickets failed:', error);
      throw error;
    }
  },

  // Get all users for dropdown
  getAllUsers: async () => {
    try {
      const response = await apiUtils.get(
        API_ENDPOINTS.USERS.GET_ALL,
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Get all users failed:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await apiUtils.get(
        API_ENDPOINTS.USERS.GET_BY_ID(userId),
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Get user by ID failed:', error);
      throw error;
    }
  },

  // Update admin profile
  updateAdminProfile: async (profileData) => {
    try {
      // Note: This endpoint might need to be added to the backend
      const response = await apiUtils.patch(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE || '/api/admin/profile',
        profileData,
        {
          headers: {
            ...adminService.getAuthHeaders()
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Update admin profile failed:', error);
      throw error;
    }
  }
};

export default adminService;
