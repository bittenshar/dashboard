// API Configuration - Single source of truth
// Change these values once to affect entire application

// Resolve API base URL from Vite env (.env.production sets the deployed API); default to localhost

export const API_CONFIG = {
  BASE_URL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000',
  VERSION: '',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Convenience export for a single constant import
export const API_BASE = API_CONFIG.BASE_URL;

/**
 * Helper function to build full API URLs
 * @param {string} endpoint - The API endpoint path (e.g., '/feedback')
 * @returns {string} The complete API URL
 */
export const buildUrl = (endpoint) => `${API_CONFIG.BASE_URL}/api${endpoint}`;

/**
 * Sample response structure for /api/feedback endpoint:
 * {
 *   "status": "success",
 *   "results": 1,
 *   "data": {
 *     "feedback": [
 *       {
 *         "subject": "Event Feedback",
 *         "eventId": "evt_001",
 *         "notHelpful": 0,
 *         "helpful": 0,
 *         "rating": 5,
 *         "userId": "testuserid",
 *         "updatedAt": "2025-09-05T16:38:02.432Z",
 *         "status": "new",
 *         "category": "event",
 *         "createdAt": "2025-09-05T16:38:02.432Z",
 *         "message": "This was an amazing event!",
 *         "feedbackId": "fb_1757090282432"
 *       }
 *     ]
 *   }
 * }
 */

export default API_CONFIG;
