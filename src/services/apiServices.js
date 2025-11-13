/**
 * UNIFIED API SERVICES LAYER
 * 
 * This is the main export file that provides all backend services
 * Import this file in your React components for easy access to all APIs
 */

import { Auth } from './auth';
import { http } from './httpClient';

// ===================================================================
// USER SERVICES
// ===================================================================

export const UserService = {
  async getAllUsers() {
    try {
      return await http.get('/api/users');
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  async getUser(id) {
    try {
      return await http.get(`/api/users/${id}`);
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      return await http.post('/api/users', userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  async updateUser(id, updateData) {
    try {
      return await http.patch(`/api/users/${id}`, updateData);
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  },

  async removeUser(id) {
    try {
      return await http.delete(`/api/users/${id}`);
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }
};

// ===================================================================
// AUTHENTICATION SERVICES
// ===================================================================

export const AuthService = {
  async login(credentials) {
    try {
      const response = await http.post('/api/auth/admin-login', credentials);
      
      if (response.status === "success" && response.token) {
        Auth.setToken(response.token);
        if (response.data?.user) {
          Auth.setUser(response.data.user);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async logout() {
    try {
      Auth.clear();
      // Optionally call backend logout endpoint
      await http.post('/api/auth/logout').catch(console.warn);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local auth even if API call fails
      Auth.clear();
    }
  },

  async getCurrentUser() {
    try {
      return await http.get('/api/users/me');
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }
};
// ===================================================================
// EVENT SERVICES
// ===================================================================

export const EventService = {
  async getAllEvents() {
    try {
      return await http.get('/api/events');
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  },

  async getEvent(id) {
    try {
      return await http.get(`/api/events/${id}`);
    } catch (error) {
      console.error(`Failed to fetch event ${id}:`, error);
      throw error;
    }
  },

  async createEvent(eventData) {
    try {
      return await http.post('/api/events', eventData);
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  },

  async updateEvent(id, updateData) {
    try {
      return await http.patch(`/api/events/${id}`, updateData);
    } catch (error) {
      console.error(`Failed to update event ${id}:`, error);
      throw error;
    }
  },

  async removeEvent(id) {
    try {
      return await http.delete(`/api/events/${id}`);
    } catch (error) {
      console.error(`Failed to delete event ${id}:`, error);
      throw error;
    }
  }
};

export const api = {
  
  // Authentication
  auth: {
    async login(email, password) {
      const response = await http.post('/api/auth/login', { email, password });
      if (response.success && response.token) {
        Auth.setToken(response.token);
        Auth.setUser(response.user);
      }
      return response;
    },

    async register(userData) {
      const response = await http.post('/api/auth/register', userData);
      if (response.success && response.token) {
        Auth.setToken(response.token);
        Auth.setUser(response.user);
      }
      return response;
    },

    async logout() {
      try {
        await http.post('/api/auth/logout');
      } finally {
        Auth.clear();
      }
    },

    async getCurrentUser() {
      return http.get('/api/auth/');
    },

    async uploadImage(imageFile, fullName) {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('fullname', fullName);
      return http.post('/api/auth/upload', formData);
    }
  },

  // Events
  events: {
    async getAll() {
      const response = await http.get('/api/events');
      return response.data?.events || [];
    },

    async getById(id) {
      return http.get(`/api/events/${id}`);
    },

    async create(eventData) {
      return http.post('/api/events', eventData);
    },

    async update(id, updateData) {
      return http.patch(`/api/events/${id}`, updateData);
    },

    async delete(id) {
      return http.delete(`/api/events/${id}`);
    },

    async getStats() {
      return http.get('/api/events/stats');
    }
  },

  // Registrations
  registrations: {
    async getAll() {
      const response = await http.get('/api/registrations');
      return response.data?.registrations || [];
    },

    async getById(id) {
      return http.get(`/api/registrations/${id}`);
    },

    async create(registrationData) {
      return http.post('/api/registrations', registrationData);
    },

    async update(id, updateData) {
      return http.put(`/api/registrations/${id}`, updateData);
    },

    async delete(id) {
      return http.delete(`/api/registrations/${id}`);
    },

    async checkIn(id) {
      return http.put(`/api/registrations/${id}/checkin`);
    },

    async startFaceVerification(id, faceVerificationId) {
      return http.put(`/api/registrations/${id}/face-verification/start`, {
        faceVerificationId
      });
    },

    async completeFaceVerification(id, success, ticketAvailable) {
      return http.put(`/api/registrations/${id}/face-verification/complete`, {
        success,
        ticketAvailable
      });
    },

    async issueTicket(id) {
      return http.put(`/api/registrations/${id}/issue-ticket`);
    },

    async adminOverride(id, overrideReason, issueTicket = false) {
      return http.put(`/api/registrations/${id}/admin-override`, {
        overrideReason,
        issueTicket
      });
    },

    async getByStatus(status) {
      return http.get(`/api/registrations/status/${status}`);
    },

    async getByEvent(eventId) {
      return http.get(`/api/registrations/event/${eventId}`);
    },

    async getByUser(userId) {
      return http.get(`/api/registrations/user/${userId}`);
    },

    async getStats() {
      return http.get('/api/registrations/stats');
    }
  },

  // Users
  users: {
    async getAll() {
      return http.get('/api/users');
    },

    async getById(id) {
      return http.get(`/api/users/${id}`);
    },

    async create(userData) {
      return http.post('/api/users', userData);
    },

    async update(id, updateData) {
      return http.patch(`/api/users/${id}`, updateData);
    },

    async delete(id) {
      return http.delete(`/api/users/${id}`);
    },

    async getByFaceId(faceId) {
      return http.get(`/api/users/face/${faceId}`);
    },

    async verify(id) {
      return http.patch(`/api/users/${id}/verify`);
    },

    async search(query, limit = 10, offset = 0) {
      return http.get(`/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
    }
  },

  // Organizers
  organizers: {
    async getAll() {
      return http.get('/api/organizers');
    },

    async getById(id) {
      return http.get(`/api/organizers/${id}`);
    },

    async create(organizerData) {
      return http.post('/api/organizers', organizerData);
    },

    async update(id, updateData) {
      return http.patch(`/api/organizers/${id}`, updateData);
    },

    async delete(id) {
      return http.delete(`/api/organizers/${id}`);
    }
  },

  // Tickets
  tickets: {
    async getAll() {
      return http.get('/api/tickets');
    },

    async getById(id) {
      return http.get(`/api/tickets/${id}`);
    },

    async create(ticketData) {
      return http.post('/api/tickets', ticketData);
    },

    async purchase({ eventId, userId, quantity = 1, notes = '' }) {
      return http.post('/api/tickets', {
        eventId,
        userId,
        quantity,
        notes
      });
    },

    async update(id, updateData) {
      return http.patch(`/api/tickets/${id}`, updateData);
    },

    async verify(ticketId, eventId) {
      return http.post('/api/tickets/verify', { ticketId, eventId });
    }
  },

  // Face Recognition
  faceImages: {
    async getAll() {
      return http.get('/api/face-images');
    },

    async getById(rekognitionId) {
      return http.get(`/api/face-images/${rekognitionId}`);
    },

    async getByName(fullName) {
      return http.get(`/api/face-images/name/${encodeURIComponent(fullName)}`);
    },

    async create(faceImageData) {
      return http.post('/api/face-images', faceImageData);
    },

    async update(rekognitionId, updateData) {
      return http.patch(`/api/face-images/${rekognitionId}`, updateData);
    },

    async delete(rekognitionId) {
      return http.delete(`/api/face-images/${rekognitionId}`);
    }
  },

  // Feedback
  feedback: {
    async getAll() {
      return http.get('/api/feedback');
    },

    async getById(id) {
      return http.get(`/api/feedback/${id}`);
    },

    async create(feedbackData) {
      return http.post('/api/feedback', feedbackData);
    },

    async update(id, updateData) {
      return http.patch(`/api/feedback/${id}`, updateData);
    },

    async delete(id) {
      return http.delete(`/api/feedback/${id}`);
    }
  },

  // Admin
  admin: {
    async createEmployee(employeeData) {
      return http.post('/api/admin/employees', employeeData);
    },

    async deleteEmployee(id) {
      return http.delete(`/api/admin/employees/${id}`);
    },

    async updatePermissions(employeeId, permissions) {
      return http.patch('/api/admin/employees/permissions', {
        employeeId,
        permissions
      });
    },

    async getActivityLog() {
      return http.get('/api/admin/activity');
    },

    async issuePendingTickets(userId) {
      return http.post(`/api/admin/users/${userId}/issue-tickets`, {});
    }
  }
};

// ===================================================================
// REACT HOOKS
// ===================================================================

export const useAsync = (asyncFunction, dependencies = []) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const execute = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  };

  useEffect(() => {
    execute();
  }, dependencies);

  return { ...state, refetch: execute };
};

export const useAuth = () => {
  const [user, setUser] = useState(Auth.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Auth.isAuthenticated());

  const login = async (email, password) => {
    const response = await api.auth.login(email, password);
    setUser(Auth.getUser());
    setIsAuthenticated(true);
    return response;
  };

  const register = async (userData) => {
    const response = await api.auth.register(userData);
    setUser(Auth.getUser());
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, isAuthenticated, login, register, logout };
};

export const useEvents = () => {
  const { data: events, loading, error, refetch } = useAsync(api.events.getAll);

  const createEvent = async (eventData) => {
    const result = await api.events.create(eventData);
    await refetch();
    return result;
  };

  const updateEvent = async (id, updateData) => {
    const result = await api.events.update(id, updateData);
    await refetch();
    return result;
  };

  const deleteEvent = async (id) => {
    const result = await api.events.delete(id);
    await refetch();
    return result;
  };

  return {
    events: events || [],
    loading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent
  };
};

export const useRegistrations = () => {
  const { data: registrations, loading, error, refetch } = useAsync(api.registrations.getAll);

  const createRegistration = async (data) => {
    const result = await api.registrations.create(data);
    await refetch();
    return result;
  };

  const checkInUser = async (id) => {
    const result = await api.registrations.checkIn(id);
    await refetch();
    return result;
  };

  const startFaceVerification = async (id, faceVerificationId) => {
    const result = await api.registrations.startFaceVerification(id, faceVerificationId);
    await refetch();
    return result;
  };

  const completeFaceVerification = async (id, success, ticketAvailable) => {
    const result = await api.registrations.completeFaceVerification(id, success, ticketAvailable);
    await refetch();
    return result;
  };

  const issueTicket = async (id) => {
    const result = await api.registrations.issueTicket(id);
    await refetch();
    return result;
  };

  const adminOverride = async (id, reason, issueTicket) => {
    const result = await api.registrations.adminOverride(id, reason, issueTicket);
    await refetch();
    return result;
  };

  return {
    registrations: registrations || [],
    loading,
    error,
    refetch,
    createRegistration,
    checkInUser,
    startFaceVerification,
    completeFaceVerification,
    issueTicket,
    adminOverride
  };
};

export const useUsers = () => {
  const { data: users, loading, error, refetch } = useAsync(api.users.getAll);

  const createUser = async (userData) => {
    const result = await api.users.create(userData);
    await refetch();
    return result;
  };

  const updateUser = async (id, updateData) => {
    const result = await api.users.update(id, updateData);
    await refetch();
    return result;
  };

  const deleteUser = async (id) => {
    const result = await api.users.delete(id);
    await refetch();
    return result;
  };

  const verifyUser = async (id) => {
    const result = await api.users.verify(id);
    await refetch();
    return result;
  };

  return {
    users: users || [],
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    verifyUser
  };
};

export const useOrganizers = () => {
  const { data: organizers, loading, error, refetch } = useAsync(api.organizers.getAll);

  const createOrganizer = async (data) => {
    const result = await api.organizers.create(data);
    await refetch();
    return result;
  };

  const updateOrganizer = async (id, updateData) => {
    const result = await api.organizers.update(id, updateData);
    await refetch();
    return result;
  };

  const deleteOrganizer = async (id) => {
    const result = await api.organizers.delete(id);
    await refetch();
    return result;
  };

  return {
    organizers: organizers || [],
    loading,
    error,
    refetch,
    createOrganizer,
    updateOrganizer,
    deleteOrganizer
  };
};

// ===================================================================
// DEFAULT EXPORT
// ===================================================================

export default {
  CONFIG,
  Auth,
  http,
  api,
  useAsync,
  useAuth,
  useEvents,
  useRegistrations,
  useUsers,
  useOrganizers
};
