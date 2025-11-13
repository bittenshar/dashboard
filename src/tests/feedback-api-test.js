// Feedback API test

import { feedbackService } from '../services/feedbackService';
import { useAuth } from '../contexts/AuthContext';

/**
 * This file demonstrates how to use the Feedback API
 */

// Function to test the feedback API
const testFeedbackApi = async () => {
  try {
    // Get auth token (this would be from your authentication context in a React component)
    const { getToken } = useAuth();
    const token = getToken();
    
    if (!token) {
      console.error('No authentication token available');
      return;
    }
    
    console.log('Fetching all feedback...');
    
    // Get all feedback
    const allFeedback = await feedbackService.getAllFeedback(token);
    
    console.log(`Successfully fetched ${allFeedback.results} feedback items`);
    console.log('Feedback data:', allFeedback.data.feedback);
    
    // Example of creating new feedback
    const newFeedback = {
      user: 'user123', // user ID
      event: 'event456', // event ID
      rating: 5,
      category: 'event',
      subject: 'Great Experience',
      message: 'I had an amazing time at this event!'
    };
    
    console.log('Submitting new feedback...');
    const createResponse = await feedbackService.createFeedback(newFeedback, token);
    
    console.log('Feedback creation response:', createResponse);
    
  } catch (error) {
    console.error('Error testing feedback API:', error);
  }
};

/**
 * Example usage in a React component:
 * 
 * useEffect(() => {
 *   const fetchData = async () => {
 *     try {
 *       const token = getToken();
 *       if (!token) return;
 *       
 *       const response = await feedbackService.getAllFeedback(token);
 *       
 *       if (response.status === 'success') {
 *         setFeedbacks(response.data.feedback);
 *       }
 *     } catch (error) {
 *       console.error('Error:', error);
 *     }
 *   };
 *   
 *   fetchData();
 * }, []);
 */

export { testFeedbackApi };
