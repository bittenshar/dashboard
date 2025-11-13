// Authentication API Service
import { apiUtils, API_ENDPOINTS } from '@/constants/api';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiUtils.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      // Store token in localStorage if available
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiUtils.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      // Store token if registration includes auto-login
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await apiUtils.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiUtils.get(API_ENDPOINTS.AUTH.GET_USER, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  },

  // Upload image to S3
  uploadImage: async (imageFile, fullName) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('fullname', fullName);

      const response = await apiUtils.post(API_ENDPOINTS.AUTH.UPLOAD_IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
};

export default authService;
