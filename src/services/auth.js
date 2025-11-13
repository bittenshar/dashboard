/**
 * Authentication Service
 * Handles user authentication state management
 */

export const Auth = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),
  
  getUser: () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },
  
  setUser: (user) => localStorage.setItem('admin_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('admin_user'),
  
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  
  clear: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('admin_user');
  }
};
