/**
 * FRONTEND TO BACKEND API CONNECTION SUPERSET
 * 
 * This file provides complete integration between your React frontend
 * and the Event Management Platform backend APIs
 */

import { API_CONFIG } from './config';
import { useState, useEffect } from 'react';

// ===================================================================
// TYPES
// ===================================================================

interface BackendConfig {
  BASE_URL: string;
  API_PREFIX: string;
  AUTH_PREFIX: string;
  TIMEOUT: number;
  HEADERS: Record<string, string>;
  ERROR_MESSAGES: {
    LOGIN_FAILED: string;
    NETWORK_ERROR: string;
    SERVER_ERROR: string;
  };
}

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  token?: string;
}

// ===================================================================
// CONFIGURATION & UTILITIES
// ===================================================================

export const BACKEND_CONFIG: BackendConfig = {
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

interface AuthUser {
  id?: string;
  email: string;
  role: string;
  [key: string]: any;
}

class AuthManagerClass {
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeToken(): void {
    localStorage.removeItem('authToken');
  }

  getUser(): AuthUser | null {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user: AuthUser): void {
    localStorage.setItem('admin_user', JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem('admin_user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('admin_user');
  }
}

export const AuthManager = new AuthManagerClass();

// ===================================================================
// GENERIC API CALLER WITH ERROR HANDLING
// ===================================================================

interface ApiOptions {
  headers?: Record<string, string>;
}

class ApiServiceClass {
  async call<T>(method: string, url: string, data: any = null, customHeaders: Record<string, string> = {}): Promise<T> {
    try {
      const headers = {
        ...BACKEND_CONFIG.HEADERS,
        ...customHeaders
      };

      if (AuthManager.isAuthenticated()) {
        headers['Authorization'] = `Bearer ${AuthManager.getToken()}`;
      }

      const config: RequestInit = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        redirect: 'follow'
      };

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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`❌ API call failed [${method} ${url}]:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.call<T>('GET', endpoint, null, options.headers);
  }

  post<T>(endpoint: string, data: any, options: ApiOptions = {}): Promise<T> {
    return this.call<T>('POST', endpoint, data, options.headers);
  }

  put<T>(endpoint: string, data: any, options: ApiOptions = {}): Promise<T> {
    return this.call<T>('PUT', endpoint, data, options.headers);
  }

  patch<T>(endpoint: string, data: any, options: ApiOptions = {}): Promise<T> {
    return this.call<T>('PATCH', endpoint, data, options.headers);
  }

  deleteRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.call<T>('DELETE', endpoint, null, options.headers);
  }
}

export const ApiService = new ApiServiceClass();
