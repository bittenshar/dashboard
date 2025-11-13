// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Ticket status options
export const TICKET_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Event status options
export const EVENT_STATUS = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};