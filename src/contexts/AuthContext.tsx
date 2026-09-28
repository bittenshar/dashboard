
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService, AuthManager } from '@/constants/api/2backend-api-superset';
import { API_CONFIG } from '@/constants/api/config';
import CentralizedApi from '@/services/centralizedApi';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Employee';
  permissions: string[];
  avatar?: string;
}

interface LoginResponse {
  status: 'success' | 'error';
  token: string;
  data?: {
    user: {
      _id?: string;
      id?: string;
      fullName?: string;
      name?: string;
      email: string;
      role: string;
      permissions?: string[];
      avatar?: string;
    };
  };
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<void>;
  sendLoginOtp: (email: string) => Promise<void>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getToken: () => string | null;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  avatar?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('admin_user');
    const savedToken = localStorage.getItem('authToken'); // Use the same key as AuthManager
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure user has permissions property for backward compatibility
        if (!parsedUser.permissions) {
          parsedUser.permissions = parsedUser.role === 'Admin' ? ['all'] : ['users', 'events'];
        }
        setUser(parsedUser);
        setToken(savedToken);
        
        // Ensure AuthManager is also updated
        AuthManager.setToken(savedToken);
        AuthManager.setUser(parsedUser);
        
        console.log('User restored from localStorage:', parsedUser.email);

        // Add validation check to verify token is still valid
        validateToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        handleInvalidToken();
      }
    } else {
      console.log('No saved user found in localStorage');
      setIsLoading(false);
    }
  }, []);
  
  // Validate the token with the backend.
  // Only a 401/403 means the token is actually bad - a 404 (endpoint not
  // deployed) or a network failure must not silently sign the user out.
  const validateToken = async (token: string) => {
    try {
      // Call a lightweight endpoint to verify token is valid using centralized API
      await CentralizedApi.auth.validateToken();
    } catch (error) {
      const status = (error as { status?: number })?.status;

      if (status === 401 || status === 403) {
        console.error('Token rejected by backend, signing out:', error);
        handleInvalidToken();
        return;
      }

      console.warn('Token validation unavailable, keeping existing session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle invalid token by clearing auth state
  const handleInvalidToken = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('authToken');
    AuthManager.logout();
    setIsLoading(false);
  };

  const persistSession = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('admin_user', JSON.stringify(authUser));
    localStorage.setItem('authToken', authToken);
    AuthManager.setToken(authToken);
    AuthManager.setUser(authUser);
  };

  // Password, Google and email-code logins all end in the same backend
  // response; map it to the frontend user and store the session.
  const completeLogin = (response: LoginResponse): boolean => {
    if (response.status !== 'success' || !response.token || !response.data?.user) {
      console.error('Login failed: Invalid response format', response);
      return false;
    }

    const backendUser = response.data.user;
    const isAdmin = backendUser.role === 'admin' || backendUser.role === 'super-admin';

    // Map backend user to frontend user format
    const frontendUser: User = {
      id: backendUser._id || backendUser.id || '1',
      name: backendUser.fullName || backendUser.name || 'User',
      email: backendUser.email,
      role: isAdmin ? 'Admin' : 'Employee',
      permissions: backendUser.permissions || (isAdmin ? ['all'] : ['users', 'events']),
      avatar: backendUser.avatar
    };

    persistSession(frontendUser, response.token);
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Call the real backend API using centralized API service
      const response = await CentralizedApi.auth.login({
        email,
        password
      }) as LoginResponse;

      const success = completeLogin(response);
      setIsLoading(false);
      return success;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // The passwordless methods throw with the backend's message (wrong code,
  // no admin access, …) so the login page can show it. They leave isLoading
  // alone: ProtectedRoute swaps the login page for a spinner while it's set,
  // which would lose the "enter your code" step.
  const loginWithGoogle = async (credential: string): Promise<void> => {
    const response = await CentralizedApi.auth.googleLogin(credential) as LoginResponse;
    if (!completeLogin(response)) throw new Error('Google sign-in failed. Please try again.');
  };

  const sendLoginOtp = async (email: string): Promise<void> => {
    await CentralizedApi.auth.sendLoginOtp(email);
  };

  const verifyLoginOtp = async (email: string, otp: string): Promise<void> => {
    const response = await CentralizedApi.auth.verifyLoginOtp(email, otp) as LoginResponse;
    if (!completeLogin(response)) throw new Error('Sign-in failed. Please request a new code.');
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint using centralized API
      await CentralizedApi.auth.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear frontend state regardless of API call result
      setUser(null);
      setToken(null);
      localStorage.removeItem('admin_user');
      localStorage.removeItem('authToken');
      
      // Clear AuthManager for consistency
      AuthManager.logout();
    }
  };

  const getToken = (): string | null => {
    return token || localStorage.getItem('authToken'); // Use the same key as AuthManager
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, sendLoginOtp, verifyLoginOtp, logout, isLoading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
