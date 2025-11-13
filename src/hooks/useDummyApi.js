/**
 * DUMMY API INTEGRATION HOOK
 * 
 * This hook simulates API calls using dummy data for frontend testing.
 * Replace this with the real useApiIntegration when ready to connect to backend.
 * 
 * Usage:
 * import { useDummyApi } from '@/hooks/useDummyApi';
 * const api = useDummyApi();
 */

import { useState, useEffect, useCallback } from 'react';
import dummyData, { 
  simulateApiResponse, 
  simulateApiDelay,
  getUsersByStatus,
  getEventsByStatus,
  getRegistrationsByEvent 
} from '@/data/dummyData';

export const useDummyApi = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    users: false,
    events: false,
    registrations: false,
    organizers: false,
    adminUsers: false
  });
  
  // Error states
  const [errors, setErrors] = useState({
    users: null,
    events: null,
    registrations: null,
    organizers: null,
    adminUsers: null
  });

  // Helper function to update loading state
  const setLoadingState = (key, isLoading) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  };

  // Helper function to update error state
  const setErrorState = (key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  // ===================================================================
  // USER APIS
  // ===================================================================

  const fetchUsers = useCallback(async () => {
    setLoadingState('users', true);
    setErrorState('users', null);
    
    try {
      await simulateApiDelay(800);
      const response = await simulateApiResponse(dummyData.users);
      setUsers(response.data);
    } catch (error) {
      setErrorState('users', error.message);
    } finally {
      setLoadingState('users', false);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    setLoadingState('users', true);
    
    try {
      await simulateApiDelay(1200);
      
      // Generate new user ID
      const newUserId = `usr_${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const newUser = {
        _id: newUserId,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };
      
      // Add to dummy data
      dummyData.users.push(newUser);
      setUsers(prev => [...prev, newUser]);
      
      return await simulateApiResponse(newUser);
    } catch (error) {
      setErrorState('users', error.message);
      throw error;
    } finally {
      setLoadingState('users', false);
    }
  }, []);

  const updateUser = useCallback(async (userId, updateData) => {
    setLoadingState('users', true);
    
    try {
      await simulateApiDelay(1000);
      
      const userIndex = dummyData.users.findIndex(user => user._id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      const updatedUser = {
        ...dummyData.users[userIndex],
        ...updateData,
        updatedAt: new Date()
      };
      
      dummyData.users[userIndex] = updatedUser;
      setUsers(prev => prev.map(user => user._id === userId ? updatedUser : user));
      
      return await simulateApiResponse(updatedUser);
    } catch (error) {
      setErrorState('users', error.message);
      throw error;
    } finally {
      setLoadingState('users', false);
    }
  }, []);

  const verifyUser = useCallback(async (userId) => {
    return await updateUser(userId, { verificationStatus: 'verified' });
  }, [updateUser]);

  const deleteUser = useCallback(async (userId) => {
    setLoadingState('users', true);
    
    try {
      await simulateApiDelay(800);
      
      const userIndex = dummyData.users.findIndex(user => user._id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      dummyData.users.splice(userIndex, 1);
      setUsers(prev => prev.filter(user => user._id !== userId));
      
      return await simulateApiResponse({ message: 'User deleted successfully' });
    } catch (error) {
      setErrorState('users', error.message);
      throw error;
    } finally {
      setLoadingState('users', false);
    }
  }, []);

  // ===================================================================
  // EVENT APIS
  // ===================================================================

  const fetchEvents = useCallback(async () => {
    setLoadingState('events', true);
    setErrorState('events', null);
    
    try {
      await simulateApiDelay(600);
      const response = await simulateApiResponse(dummyData.events);
      setEvents(response.data);
    } catch (error) {
      setErrorState('events', error.message);
    } finally {
      setLoadingState('events', false);
    }
  }, []);

  const createEvent = useCallback(async (eventData) => {
    setLoadingState('events', true);
    
    try {
      await simulateApiDelay(1000);
      
      const newEventId = `evt_${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const newEvent = {
        _id: newEventId,
        eventId: newEventId,
        ...eventData,
        ticketsSold: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      dummyData.events.push(newEvent);
      setEvents(prev => [...prev, newEvent]);
      
      return await simulateApiResponse(newEvent);
    } catch (error) {
      setErrorState('events', error.message);
      throw error;
    } finally {
      setLoadingState('events', false);
    }
  }, []);

  const updateEvent = useCallback(async (eventId, updateData) => {
    setLoadingState('events', true);
    
    try {
      await simulateApiDelay(800);
      
      const eventIndex = dummyData.events.findIndex(event => event._id === eventId);
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      const updatedEvent = {
        ...dummyData.events[eventIndex],
        ...updateData,
        updatedAt: new Date()
      };
      
      dummyData.events[eventIndex] = updatedEvent;
      setEvents(prev => prev.map(event => event._id === eventId ? updatedEvent : event));
      
      return await simulateApiResponse(updatedEvent);
    } catch (error) {
      setErrorState('events', error.message);
      throw error;
    } finally {
      setLoadingState('events', false);
    }
  }, []);

  // ===================================================================
  // REGISTRATION APIS
  // ===================================================================

  const fetchRegistrations = useCallback(async () => {
    setLoadingState('registrations', true);
    setErrorState('registrations', null);
    
    try {
      await simulateApiDelay(700);
      const response = await simulateApiResponse(dummyData.registrations);
      setRegistrations(response.data);
    } catch (error) {
      setErrorState('registrations', error.message);
    } finally {
      setLoadingState('registrations', false);
    }
  }, []);

  const createRegistration = useCallback(async (registrationData) => {
    setLoadingState('registrations', true);
    
    try {
      await simulateApiDelay(1000);
      
      const newRegistrationId = `reg_${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const newRegistration = {
        _id: newRegistrationId,
        registrationId: newRegistrationId,
        ...registrationData,
        registrationDate: new Date(),
        status: 'pending',
        waitingStatus: 'queued',
        faceVerificationStatus: 'pending',
        ticketAvailabilityStatus: 'pending',
        verificationAttempts: 0,
        ticketIssued: false,
        adminBooked: false
      };
      
      dummyData.registrations.push(newRegistration);
      setRegistrations(prev => [...prev, newRegistration]);
      
      return await simulateApiResponse(newRegistration);
    } catch (error) {
      setErrorState('registrations', error.message);
      throw error;
    } finally {
      setLoadingState('registrations', false);
    }
  }, []);

  // ===================================================================
  // ORGANIZER APIS
  // ===================================================================

  const fetchOrganizers = useCallback(async () => {
    setLoadingState('organizers', true);
    setErrorState('organizers', null);
    
    try {
      await simulateApiDelay(500);
      const response = await simulateApiResponse(dummyData.organizers);
      setOrganizers(response.data);
    } catch (error) {
      setErrorState('organizers', error.message);
    } finally {
      setLoadingState('organizers', false);
    }
  }, []);

  const createOrganizer = useCallback(async (organizerData) => {
    setLoadingState('organizers', true);
    
    try {
      await simulateApiDelay(1000);
      
      const newOrganizerId = `org_${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const newOrganizer = {
        _id: newOrganizerId,
        organiserId: newOrganizerId,
        ...organizerData,
        joinDate: new Date(),
        totalRevenue: 0,
        totalEvents: 0,
        activeEvents: 0
      };
      
      dummyData.organizers.push(newOrganizer);
      setOrganizers(prev => [...prev, newOrganizer]);
      
      return await simulateApiResponse(newOrganizer);
    } catch (error) {
      setErrorState('organizers', error.message);
      throw error;
    } finally {
      setLoadingState('organizers', false);
    }
  }, []);

  // ===================================================================
  // INITIAL DATA LOADING
  // ===================================================================

  useEffect(() => {
    // Load initial data when component mounts
    fetchUsers();
    fetchEvents();
    fetchRegistrations();
    fetchOrganizers();
  }, [fetchUsers, fetchEvents, fetchRegistrations, fetchOrganizers]);

  // ===================================================================
  // RETURN API OBJECT
  // ===================================================================

  return {
    // Data
    users,
    events,
    registrations,
    organizers,
    adminUsers,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // User APIs
    fetchUsers,
    createUser,
    updateUser,
    verifyUser,
    deleteUser,
    
    // Event APIs
    fetchEvents,
    createEvent,
    updateEvent,
    
    // Registration APIs
    fetchRegistrations,
    createRegistration,
    
    // Organizer APIs
    fetchOrganizers,
    createOrganizer,
    
    // Utility functions
    getUsersByStatus: (status) => getUsersByStatus(status),
    getEventsByStatus: (status) => getEventsByStatus(status),
    getRegistrationsByEvent: (eventId) => getRegistrationsByEvent(eventId),
    
    // Stats
    stats: dummyData.stats
  };
};

export default useDummyApi;
