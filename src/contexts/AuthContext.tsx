
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

type StaticCredential = User & { password: string };

const STATIC_USERS: StaticCredential[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@thrillathon.com',
    role: 'Admin',
    permissions: ['all'],
    avatar: undefined,
    password: 'admin123',
  },
  {
    id: 'employee-1',
    name: 'Employee One',
    email: 'employee1@thrillathon.com',
    role: 'Employee',
    permissions: ['user_verification', 'events'],
    avatar: undefined,
    password: 'employee123',
  }
];

const isStaticToken = (token: string) => token.startsWith('static-');

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
        if (isStaticToken(savedToken)) {
          setIsLoading(false);
          return;
        }

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
  
  // Validate the token with the backend
  const validateToken = async (token: string) => {
    try {
      // Call a lightweight endpoint to verify token is valid using centralized API
      await CentralizedApi.auth.validateToken();
      setIsLoading(false);
    } catch (error) {
      console.error('Token validation failed:', error);
      handleInvalidToken();
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    const staticMatch = STATIC_USERS.find(
      (staticUser) =>
        staticUser.email.toLowerCase() === email.toLowerCase() &&
        staticUser.password === password
    );

    if (staticMatch) {
      const { password: _password, ...staticUserWithoutPassword } = staticMatch;
      const staticUser = staticUserWithoutPassword as User;
      const staticToken = `static-${staticMatch.id}`;

      persistSession(staticUser, staticToken);
      setIsLoading(false);
      return true;
    }

    try {
      // Call the real backend API using centralized API service
      const response = await CentralizedApi.auth.login({
        email,
        password
      }) as LoginResponse;

      if (response.status === 'success' && response.token && response.data?.user) {
        const backendUser = response.data.user;
        const authToken = response.token;
        
        // Map backend user to frontend user format
        const frontendUser: User = {
          id: backendUser._id || backendUser.id || '1',
          name: backendUser.fullName || backendUser.name || 'User',
          email: backendUser.email,
          role: backendUser.role === 'admin' ? 'Admin' : 'Employee',
          permissions: backendUser.permissions || (backendUser.role === 'admin' ? ['all'] : ['users', 'events']),
          avatar: backendUser.avatar
        };

        persistSession(frontendUser, authToken);
        
        setIsLoading(false);
        return true;
      } else {
        console.error('Login failed: Invalid response format', response);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
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
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
