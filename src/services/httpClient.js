/**
 * HTTP Client Service
 * Handles all API requests with proper authentication and error handling
 */

import { Auth } from './auth';
import { API_CONFIG } from '../constants/api/config.js';

// Use API_CONFIG directly instead of creating a new object
export const CONFIG = API_CONFIG;

class HttpClient {
  constructor(config = CONFIG) {
    this.config = config;
  }

  prepareHeaders(customHeaders = {}) {
    const authToken = Auth.getToken();
    return {
      ...this.config.HEADERS,
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...customHeaders
    };
  }

  logRequest(method, endpoint, config) {
    const authToken = Auth.getToken();
    console.log(`🌐 Making ${method} request to ${endpoint}`, {
      hasToken: !!authToken,
      headers: { 
        ...config.headers,
        Authorization: authToken ? 'Bearer [REDACTED]' : undefined
      }
    });
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));
      
      const error = new Error(errorData.message || 'Request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  }

  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.config.BASE_URL}${endpoint}`;
    const config = {
      method,
      headers: this.prepareHeaders(options.headers),
      ...options
    };

    if (data) {
      if (data instanceof FormData) {
        delete config.headers['Content-Type'];
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    this.logRequest(method, endpoint, config);

    try {
      const response = await fetch(url, config);
      return this.handleResponse(response);
    } catch (error) {
      console.error(`❌ Request failed [${method} ${endpoint}]:`, error);
      throw new Error('Network request failed');
    }
  }

  // HTTP method shortcuts
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
}

export const http = new HttpClient();
