// Events Service for Frontend
import { buildUrl } from '../constants/api/config';

export class EventsService {
  private baseUrl = buildUrl('/events');

  // Get all events
  async getAllEvents(token: string) {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    return response.json();
  }

  // Get specific event by ID
  async getEvent(id: string, token: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }

    return response.json();
  }
}

export const eventsService = new EventsService();
