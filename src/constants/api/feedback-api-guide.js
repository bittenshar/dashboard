/**
 * Feedback API Integration Guide
 * 
 * This guide demonstrates how to work with the Feedback API in this application
 */

// Import services and APIs
import { feedbackService } from '../services/feedbackService';
import { API_ENDPOINTS } from './endpoints';
import { API_CONFIG } from './config';

/**
 * Sample Feedback API Response
 * 
 * GET /api/feedback response:
 * 
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

/**
 * Example: How to fetch all feedback items
 */
export const fetchAllFeedbackExample = async (token) => {
  try {
    const response = await feedbackService.getAllFeedback(token);
    
    // Check if the response was successful
    if (response.status === 'success') {
      // Process the feedback data
      const feedbackItems = response.data.feedback;
      return feedbackItems;
    } else {
      console.error('Error fetching feedback:', response);
      return [];
    }
  } catch (error) {
    console.error('Exception fetching feedback:', error);
    return [];
  }
};

/**
 * Example: How to submit new feedback
 */
export const submitFeedbackExample = async (token, feedbackData) => {
  try {
    // Example feedback data structure
    const feedback = {
      user: feedbackData.userId, 
      event: feedbackData.eventId,
      rating: feedbackData.rating,
      category: feedbackData.category,
      subject: feedbackData.subject,
      message: feedbackData.message
    };
    
    const response = await feedbackService.createFeedback(feedback, token);
    
    return {
      success: response.status === 'success',
      data: response.data,
      message: response.message || 'Feedback submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit feedback'
    };
  }
};

/**
 * Example: Using the API directly
 */
export const directApiExample = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.FEEDBACK.GET_ALL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Direct API error:', error);
    return null;
  }
};

export default {
  fetchAllFeedbackExample,
  submitFeedbackExample,
  directApiExample
};
