// S3 Image Service - Frontend utility for handling S3 signed URLs
// This works with the backend AWS S3 code you provided

export interface SignedUrlResponse {
  signedUrl: string;
  expiresIn: string;
  key: string;
}

import { buildUrl } from '../constants/api/config';

export interface MultipleSignedUrlsResponse {
  short: { url: string; expiresIn: string };
  medium: { url: string; expiresIn: string };
  long: { url: string; expiresIn: string };
}

class S3ImageService {
  private baseUrl = buildUrl('/images');

  /**
   * Generate a single signed URL for S3 object
   * @param key S3 object key
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 60 * 60): Promise<SignedUrlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ key, expiresIn })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[S3Service] Generated signed URL for key: ${key}`);
      
      return {
        signedUrl: data.signedUrl,
        expiresIn: data.expiresIn,
        key: key
      };
    } catch (error) {
      console.error(`[S3Service] Failed to generate signed URL for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple signed URLs with different expiration times
   * @param key S3 object key
   */
  async getMultipleSignedUrls(key: string): Promise<MultipleSignedUrlsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/multiple-signed-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[S3Service] Generated multiple signed URLs for key: ${key}`);
      
      return data;
    } catch (error) {
      console.error(`[S3Service] Failed to generate multiple signed URLs for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if an S3 object exists
   * @param key S3 object key
   */
  async checkObjectExists(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error(`[S3Service] Failed to check if object exists for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate user-specific S3 key
   * @param userId User ID
   * @param faceId Face ID (optional)
   */
  generateUserImageKey(userId: string, faceId?: string): string {
    if (faceId) {
      return `public/user-${userId}-${faceId}`;
    }
    return `public/user-${userId}`;
  }

  /**
   * Extract user info from S3 key
   * @param key S3 object key
   */
  parseUserImageKey(key: string): { userId?: string; faceId?: string } {
    const match = key.match(/^public\/user-([^-]+)-?(.+)?$/);
    if (match) {
      return {
        userId: match[1],
        faceId: match[2]
      };
    }
    return {};
  }
}

export const s3ImageService = new S3ImageService();
export default s3ImageService;
