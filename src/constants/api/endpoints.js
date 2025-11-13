import { buildUrl } from './config.js';

// All API endpoints organized by entity - Updated to match actual backend
export const API_ENDPOINTS = {
  // Admin Authentication endpoints
  AUTH: {
    LOGIN: buildUrl('/auth/admin-login'),
    REGISTER: buildUrl('/auth/admin-register'),
    LOGOUT: buildUrl('/auth/admin-logout'),
    GET_USER: buildUrl('/auth/admin'),
    UPLOAD_IMAGE: buildUrl('/auth/upload'), // S3 image upload
  },

  // Regular Auth endpoints
  AUTH_NEW: {
    LOGIN: buildUrl('/auth/admin-login'),
    REGISTER: buildUrl('/auth/admin-register'),
    LOGOUT: buildUrl('/auth/admin-logout'),
    REFRESH_TOKEN: buildUrl('/auth/refresh'),
    VERIFY_EMAIL: buildUrl('/auth/verify-email'),
    RESET_PASSWORD: buildUrl('/auth/reset-password'),
    FORGOT_PASSWORD: buildUrl('/auth/forgot-password'),
  },

  // Events endpoints (from features/events/event.routes.js)
  EVENTS: {
    GET_ALL: buildUrl('/events'),
    GET_BY_ID: (eventId) => buildUrl(`/events/${eventId}`),
    CREATE: buildUrl('/events'),
    UPDATE: (eventId) => buildUrl(`/events/${eventId}`),
    DELETE: (eventId) => buildUrl(`/events/${eventId}`),
    GET_STATS: buildUrl('/events/stats'),
  },

  // Event Tickets endpoints (from features/tickets/ticket.routes.js)
  TICKETS: {
    GET_ALL: buildUrl('/tickets'),
    GET_BY_ID: (ticketId) => buildUrl(`/tickets/${ticketId}`),
    CREATE: buildUrl('/tickets'),
    UPDATE: (ticketId) => buildUrl(`/tickets/${ticketId}`),
    VERIFY: buildUrl('/tickets/verify'),
  },

  // User Event Registrations endpoints (from features/registrations/userEventRegistration.routes.js)
  REGISTRATIONS: {
    GET_ALL: buildUrl('/registrations'),
    GET_BY_ID: (registrationId) => buildUrl(`/registrations/${registrationId}`),
    CREATE: buildUrl('/registrations'),
    UPDATE: (registrationId) => buildUrl(`/registrations/${registrationId}`),
    DELETE: (registrationId) => buildUrl(`/registrations/${registrationId}`),
    CHECK_IN: (registrationId) => buildUrl(`/registrations/${registrationId}/checkin`),
    START_FACE_VERIFICATION: (registrationId) => buildUrl(`/registrations/${registrationId}/face-verification/start`),
    COMPLETE_FACE_VERIFICATION: (registrationId) => buildUrl(`/registrations/${registrationId}/face-verification/complete`),
    ISSUE_TICKET: (registrationId) => buildUrl(`/registrations/${registrationId}/issue-ticket`),
    ADMIN_OVERRIDE: (registrationId) => buildUrl(`/registrations/${registrationId}/admin-override`),
    GET_BY_STATUS: (status) => buildUrl(`/registrations/status/${status}`),
    GET_STATS: buildUrl('/registrations/stats'),
    GET_BY_EVENT: (eventId) => buildUrl(`/registrations/event/${eventId}`),
    GET_BY_USER: (userId) => buildUrl(`/registrations/user/${userId}`),
  },

  // Organizers endpoints (from features/organizers/organizer.routes.js)
  ORGANIZERS: {
    GET_ALL: buildUrl('/organizers'),
    GET_BY_ID: (organizerId) => buildUrl(`/organizers/${organizerId}`),
    CREATE: buildUrl('/organizers'),
    UPDATE: (organizerId) => buildUrl(`/organizers/${organizerId}`),
    DELETE: (organizerId) => buildUrl(`/organizers/${organizerId}`),
  },

  // Feedback endpoints (from features/feedback/feedback.routes.js)
  FEEDBACK: {
    GET_ALL: buildUrl('/feedback'),
    GET_BY_ID: (feedbackId) => buildUrl(`/feedback/${feedbackId}`),
    CREATE: buildUrl('/feedback'),
    UPDATE: (feedbackId) => buildUrl(`/feedback/${feedbackId}`),
    DELETE: (feedbackId) => buildUrl(`/feedback/${feedbackId}`),
    MARK_REVIEWED: (feedbackId) => buildUrl(`/feedback/${feedbackId}/review`),
    GET_BY_EVENT: (eventId) => buildUrl(`/feedback/event/${eventId}`),
    GET_BY_USER: (userId) => buildUrl(`/feedback/user/${userId}`),
  },

  // Admin endpoints (from features/admin/admin.routes.js)
  ADMIN: {
    CREATE_EMPLOYEE: buildUrl('/admin/employees'),
    GET_ALL_EMPLOYEES: buildUrl('/admin/employees'),
    DELETE_EMPLOYEE: (employeeId) => buildUrl(`/admin/employees/${employeeId}`),
    UPDATE_EMPLOYEE_PERMISSIONS: buildUrl('/admin/employees/permissions'),
    GET_ACTIVITY_LOG: buildUrl('/admin/activity'),
    CREATE_ADMIN_USER: buildUrl('/admin/admin-users'),
    GET_ALL_ADMIN_USERS: buildUrl('/admin/admin-users'),
    UPDATE_ADMIN_USER: (adminId) => buildUrl(`/admin/admin-users/${adminId}`),
    DELETE_ADMIN_USER: (adminId) => buildUrl(`/admin/admin-users/${adminId}`),
    ISSUE_PENDING_TICKETS: (userId) => buildUrl(`/admin/users/${userId}/issue-tickets`),
  },

  // Face Images endpoints (from features/face-recognition/faceImage.routes.js)
  FACE_IMAGES: {
    GET_ALL: buildUrl('/face-images'),
    GET_BY_ID: (rekognitionId) => buildUrl(`/face-images/${rekognitionId}`),
    GET_BY_NAME: (fullName) => buildUrl(`/face-images/name/${fullName}`),
    CREATE: buildUrl('/face-images'),
    UPDATE: (rekognitionId) => buildUrl(`/face-images/${rekognitionId}`),
    DELETE: (rekognitionId) => buildUrl(`/face-images/${rekognitionId}`),
  },

  // Users endpoints (from features/users/user.routes.js)
  USERS: {
    GET_ALL: buildUrl('/users'),
    GET_BY_ID: (userId) => buildUrl(`/users/${userId}`),
    CREATE: buildUrl('/users'),
    UPDATE: (userId) => buildUrl(`/users/${userId}`),
    DELETE: (userId) => buildUrl(`/users/${userId}`),
    GET_BY_FACE_ID: (faceId) => buildUrl(`/users/face/${faceId}`),
    VERIFY: (userId) => buildUrl(`/users/${userId}/verify`),
    SEARCH: buildUrl('/users/search'),
  },

  // Legacy endpoints (from routes/ folder)
  LEGACY: {
    EVENT_CREATE: buildUrl('/auth/events'), // from routes/EventCreate.js
    TICKETS_LEGACY: buildUrl('/auth/tickets'), // from routes/tickets.js  
    USER_FETCH_DETAILS: buildUrl('/auth/user-details'), // from routes/UserFetchDetails.js
    CHECK_IAM: buildUrl('/auth/check-iam'), // from routes/checkIAM.js
  }
};

export default API_ENDPOINTS;
