// Main API barrel export file
// This maintains backward compatibility with existing imports

export { API_CONFIG, buildUrl } from './config.js';
export { API_ENDPOINTS } from './endpoints.js';
export { HTTP_METHODS, HTTP_STATUS, TICKET_STATUS, EVENT_STATUS } from './constants.js';
export { apiUtils } from './utils.js';

// Default export for backward compatibility
export { default } from './endpoints.js';

/*
Usage Examples:

// Named imports (recommended)
import { API_ENDPOINTS, apiUtils } from '@/constants/api';

// Get all users
const users = await apiUtils.get(API_ENDPOINTS.USERS.GET_ALL);

// Get specific user
const user = await apiUtils.get(API_ENDPOINTS.USERS.GET_BY_ID('123'));

// Create new event
const newEvent = await apiUtils.post(API_ENDPOINTS.EVENTS.CREATE, eventData);

// Default import (backward compatibility)
import API_ENDPOINTS from '@/constants/api';
*/