import { API_CONFIG } from './config.js';
import { HTTP_METHODS } from './constants.js';

// API utility functions for making HTTP requests
export const apiUtils = {
  // Generic fetch wrapper
  request: async (url, options = {}) => {
    const config = {
      headers: {
        ...API_CONFIG.HEADERS,
        
      },
      timeout: API_CONFIG.TIMEOUT,
      
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  // GET request
  get: (url, options = {}) => {
    return apiUtils.request(url, {
      method: HTTP_METHODS.GET,
      ...options
    });
  },

  // POST request
  post: (url, data, options = {}) => {
    return apiUtils.request(url, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data),
      ...options
    });
  },

  // PUT request
  put: (url, data, options = {}) => {
    return apiUtils.request(url, {
      method: HTTP_METHODS.PUT,
      body: JSON.stringify(data),
      ...options
    });
  },

  // PATCH request
  patch: (url, data, options = {}) => {
    return apiUtils.request(url, {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(data),
      ...options
    });
  },

  // DELETE request
  delete: (url, options = {}) => {
    return apiUtils.request(url, {
      method: HTTP_METHODS.DELETE,
      ...options
    });
  }
};

export default apiUtils;
