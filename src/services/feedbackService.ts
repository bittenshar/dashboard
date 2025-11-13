// Feedback Service for Frontend
import { buildUrl } from '../constants/api/config';

/**
 * Interface for the Feedback API response
 */
interface FeedbackResponse {
  status: 'success' | 'error';
  results: number;
  data: {
    feedback: FeedbackItem[];
  };
  message?: string;
}

/**
 * Interface for individual feedback items
 */
interface FeedbackItem {
  subject: string;
  eventId: string;
  notHelpful: number;
  helpful: number;
  rating: number;
  userId: string;
  updatedAt: string;
  status: 'new' | 'reviewed' | string;
  category: string;
  createdAt: string;
  message: string;
  feedbackId: string;
}

export class FeedbackService {
  private baseUrl = buildUrl('/feedback');

  // Get all feedback (admin only)
  async getAllFeedback(token: string): Promise<FeedbackResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feedback: ${response.statusText}`);
    }

    const data: FeedbackResponse = await response.json();
    
    // Validate response structure
    if (!data || data.status !== 'success' || !data.data?.feedback) {
      console.error('Invalid feedback response structure:', data);
      throw new Error('Invalid response format from feedback API');
    }
    
    return data;
  }

  // Get specific feedback by ID
  async getFeedback(id: string, token: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feedback: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new feedback
   * @param feedbackData The feedback data to submit
   * @param token Authentication token
   * @returns The API response
   */
  async createFeedback(feedbackData: {
    user: string;
    event: string;
    rating: number;
    category: string;
    subject: string;
    message: string;
  }, token: string) {
    // Log the request payload for debugging
    console.log('Submitting feedback data:', feedbackData);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to submit feedback: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Feedback submission response:', data);
    return data;
  }

  // Update feedback
  async updateFeedback(id: string, updateData: any, token: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update feedback: ${response.statusText}`);
    }

    return response.json();
  }

  // Mark feedback as reviewed (admin only)
  async markAsReviewed(id: string, token: string) {
    const response = await fetch(`${this.baseUrl}/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to mark feedback as reviewed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const feedbackService = new FeedbackService();
