/**
 * Feedback API Response Schema Documentation
 * 
 * This file documents the structure of the feedback API responses
 * to help developers understand the data format.
 */

/**
 * Sample GET /api/feedback response
 */
export const FEEDBACK_RESPONSE_SCHEMA = {
  // Overall response status: 'success' or 'error'
  status: 'success',
  
  // Number of feedback items in the response
  results: 1,
  
  // The actual data payload
  data: {
    // Array of feedback items
    feedback: [
      {
        // Feedback subject or title
        subject: 'Event Feedback',
        
        // ID of the event this feedback is for
        eventId: 'evt_001',
        
        // Counter for users marking feedback as not helpful
        notHelpful: 0,
        
        // Counter for users marking feedback as helpful
        helpful: 0,
        
        // User rating (1-5 stars)
        rating: 5,
        
        // ID of the user who submitted the feedback
        userId: 'testuserid',
        
        // Last update timestamp
        updatedAt: '2025-09-05T16:38:02.432Z',
        
        // Feedback status: 'new', 'reviewed', etc.
        status: 'new',
        
        // Category of feedback: 'event', 'security', 'technical', etc.
        category: 'event',
        
        // Creation timestamp
        createdAt: '2025-09-05T16:38:02.432Z',
        
        // The actual feedback message content
        message: 'This was an amazing event!',
        
        // Unique identifier for this feedback
        feedbackId: 'fb_1757090282432'
      }
    ]
  }
};

/**
 * Feedback item structure for your reference in TypeScript:
 * 
 * interface FeedbackItem {
 *   subject: string;
 *   eventId: string;
 *   notHelpful: number;
 *   helpful: number;
 *   rating: number;
 *   userId: string;
 *   updatedAt: string;
 *   status: 'new' | 'reviewed' | string;
 *   category: string;
 *   createdAt: string;
 *   message: string;
 *   feedbackId: string;
 * }
 * 
 * interface FeedbackResponse {
 *   status: 'success' | 'error';
 *   results: number;
 *   data: {
 *     feedback: FeedbackItem[];
 *   }
 * }
 */

export default FEEDBACK_RESPONSE_SCHEMA;
