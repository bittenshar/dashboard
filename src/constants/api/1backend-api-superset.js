/**
 * FRONTEND TO BACKEND API CONNECTION SUPERSET
 * 
 * This file provides complete integration between your React frontend
 * and the Event Management Platform backend APIs
 */

import { API_CONFIG } from './config.js';

// ===================================================================
// CONFIGURATION & UTILITIES
// ===================================================================

const BACKEND_CONFIG = {
  BASE_URL: API_CONFIG.BASE_URL ?? 'http://localhost:3000',
  API_PREFIX: '/api',
  AUTH_PREFIX: '/api/auth',
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  ERROR_MESSAGES: {
    LOGIN_FAILED: 'Invalid email or password',
    NETWORK_ERROR: 'Network error occurred',
    SERVER_ERROR: 'Server error occurred'
  }
};

// ===================================================================
// AUTHENTICATION TOKEN MANAGEMENT
// ===================================================================

const AuthManager = {
  getToken() {
    return localStorage.getItem('authToken');
  },
  setToken(token) {
    localStorage.setItem('authToken', token);
  },
  removeToken() {
    localStorage.removeItem('authToken');
  },
  getUser() {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },
  setUser(user) {
    localStorage.setItem('admin_user', JSON.stringify(user));
  },
  removeUser() {
    localStorage.removeItem('admin_user');
  },
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('admin_user');
  }
};

// ===================================================================
// GENERIC API CALLER WITH ERROR HANDLING
// ===================================================================

const ApiService = {
  async call(method, url, data = null, customHeaders = {}) {
    try {
      const headers = {
        ...BACKEND_CONFIG.HEADERS,
        ...customHeaders
      };

      if (AuthManager.isAuthenticated()) {
        headers.Authorization = `Bearer ${AuthManager.getToken()}`;
      }

      const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        redirect: 'follow'
      };

      // Handle different content types
      if (data) {
        if (data instanceof FormData) {
          delete headers['Content-Type']; // Let browser set it for FormData
          config.body = data;
        } else if (method !== 'GET') {
          config.body = JSON.stringify(data);
        }
      }

      // ALWAYS construct full absolute URL - never use relative paths
      // This ensures requests go to http://localhost:3000, not http://localhost:8080
      const isAbsolute = /^https?:\/\//i.test(url);
      const finalUrl = isAbsolute ? url : `${BACKEND_CONFIG.BASE_URL}${url}`;

      console.log(`🌐 Making API call to: ${finalUrl}`);
      console.log(`🌐 Base URL: ${BACKEND_CONFIG.BASE_URL}`);
      console.log(`🌐 Endpoint: ${url}`);
      const response = await fetch(finalUrl, config);
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API call failed [${method} ${finalUrl}]:`, errorData);
        
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      const result = await response.json();
      console.log(`✅ API call successful [${method} ${finalUrl}]:`, result);
      return result;
    } catch (error) {
      console.error(`❌ API call failed [${method} ${url}]:`, error);
      throw error;
    }
  },

  async get(endpoint, options = {}) {
    return this.call('GET', endpoint, null, options);
  },

  async post(endpoint, data, options = {}) {
    return this.call('POST', endpoint, data, options);
  },

  async put(endpoint, data, options = {}) {
    return this.call('PUT', endpoint, data, options);
  },

  async patch(endpoint, data, options = {}) {
    return this.call('PATCH', endpoint, data, options);
  },

  async deleteRequest(endpoint, options = {}) {
    return this.call('DELETE', endpoint, null, options);
  }
};

// ===================================================================
// AUTHENTICATION SERVICES
// ===================================================================

const AuthService = {
  async login(credentials) {
    try {
      const normalizedCredentials = {
        email: credentials.email || credentials.username,
        password: credentials.password
      };

      const response = await ApiService.post(`${BACKEND_CONFIG.AUTH_PREFIX}/admin-login`, normalizedCredentials);
      
      if (response.status === "success" && response.token) {
        AuthManager.setToken(response.token);
        if (response.data && response.data.user) {
          AuthManager.setUser(response.data.user);
        }
        return response;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error(BACKEND_CONFIG.ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error(BACKEND_CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
      }
      if (error.status === 401) {
        throw new Error(BACKEND_CONFIG.ERROR_MESSAGES.LOGIN_FAILED);
      }
      throw error;
    }
  },

  async logout() {
    try {
      AuthManager.logout();
      await ApiService.post(`${BACKEND_CONFIG.AUTH_PREFIX}/logout`);
      return { status: 'success', message: 'Logged out successfully' };
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
      throw new Error('Logout failed');
    }
  },

  async getCurrentUser() {
    try {
      const user = await ApiService.get(`${BACKEND_CONFIG.AUTH_PREFIX}/me`);
      AuthManager.setUser(user);
      return user;
    } catch (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }
};

// ===================================================================
// EVENTS MANAGEMENT SERVICES
// ===================================================================

const EventsService = {
  async getAllEvents() {
    try {
      const response = await ApiService.get(`${BACKEND_CONFIG.API_PREFIX}/events`);
      return response.data?.events || [];
    } catch (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
  },

  async getEventById(eventId) {
    try {
      return await ApiService.get(`${BACKEND_CONFIG.API_PREFIX}/events/${eventId}`);
    } catch (error) {
      throw new Error(`Failed to fetch event: ${error.message}`);
    }
  },

  async createEvent(eventData) {
    try {
      return await ApiService.post(`${BACKEND_CONFIG.API_PREFIX}/events`, eventData);
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },

  async updateEvent(eventId, updateData) {
    try {
      return await ApiService.patch(`${BACKEND_CONFIG.API_PREFIX}/events/${eventId}`, updateData);
    } catch (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  },

  async deleteEvent(eventId) {
    try {
      return await ApiService.deleteRequest(`${BACKEND_CONFIG.API_PREFIX}/events/${eventId}`);
    } catch (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }
};

// Export all services
export {
  BACKEND_CONFIG,
  AuthManager,
  ApiService,
  AuthService,
  EventsService
};
