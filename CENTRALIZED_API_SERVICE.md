# Centralized API Service Documentation

## Overview

The **Centralized API Service** (`src/services/centralizedApi.ts`) is the **single source of truth** for all API endpoints in the application. This eliminates scattered endpoint definitions and ensures consistent API usage across the entire codebase.

## Key Features

✅ **Single Source of Truth**: All endpoints defined in one place  
✅ **Base URL Centralization**: Uses `http://localhost:3000` from `config.js`  
✅ **Organized by Feature**: Endpoints grouped into logical categories  
✅ **Type-Safe**: Full TypeScript support with generic types  
✅ **Automatic Headers**: Handles auth tokens and content-type automatically  
✅ **Consistent Logging**: All API calls logged for debugging  
✅ **Error Handling**: Centralized error management and logging  

## File Structure

```
src/services/
├── centralizedApi.ts    ← NEW: All API endpoints (this file)
├── apiServices.js       ← Legacy (deprecated, use centralizedApi)
├── authService.js       ← Legacy (deprecated, use centralizedApi.auth)
└── eventsService.ts     ← Legacy (deprecated, use centralizedApi.events)
```

## Configuration

The service automatically uses the BASE_URL from `src/constants/api/config.js`:

```javascript
// From config.js
BASE_URL: http://localhost:3000
API_PREFIX: /api
FULL_URL: http://localhost:3000/api
```

## API Endpoints

### Authentication

```typescript
CentralizedApi.auth.login(credentials)        // POST /api/auth/admin-login
CentralizedApi.auth.logout()                  // POST /api/auth/admin-logout
CentralizedApi.auth.validateToken()           // GET /api/auth/validate-token
CentralizedApi.auth.getProfile()              // GET /api/auth/admin
CentralizedApi.auth.refreshToken()            // POST /api/auth/refresh-token
```

### Users

```typescript
CentralizedApi.users.getAll()                 // GET /api/user/
CentralizedApi.users.getById(id)              // GET /api/user/{id}
CentralizedApi.users.create(data)             // POST /api/user/
CentralizedApi.users.update(id, data)         // PUT /api/user/{id}
CentralizedApi.users.delete(id)               // DELETE /api/user/{id}
CentralizedApi.users.verify(userId, verified)// PATCH /api/user/{userId}/verify
```

### Events

```typescript
CentralizedApi.events.getAll()                // GET /api/events/
CentralizedApi.events.getById(id)             // GET /api/events/{id}
CentralizedApi.events.create(data)            // POST /api/events/
CentralizedApi.events.update(id, data)        // PUT /api/events/{id}
CentralizedApi.events.delete(id)              // DELETE /api/events/{id}
CentralizedApi.events.getStats()              // GET /api/events/stats
```

### Organizers

```typescript
CentralizedApi.organizers.getAll()            // GET /api/organizers/
CentralizedApi.organizers.getById(id)         // GET /api/organizers/{id}
CentralizedApi.organizers.create(data)        // POST /api/organizers/
CentralizedApi.organizers.update(id, data)    // PUT /api/organizers/{id}
CentralizedApi.organizers.delete(id)          // DELETE /api/organizers/{id}
```

### Registrations

```typescript
CentralizedApi.registrations.getAll()         // GET /api/registrations/
CentralizedApi.registrations.getById(id)      // GET /api/registrations/{id}
CentralizedApi.registrations.create(data)     // POST /api/registrations/
CentralizedApi.registrations.getByEventId(id) // GET /api/registrations/event/{id}
CentralizedApi.registrations.checkIn(id)      // PATCH /api/registrations/{id}/checkin
```

### Feedback

```typescript
CentralizedApi.feedback.getAll()              // GET /api/feedback/
CentralizedApi.feedback.getById(id)           // GET /api/feedback/{id}
CentralizedApi.feedback.create(data)          // POST /api/feedback/
CentralizedApi.feedback.update(id, data)      // PUT /api/feedback/{id}
CentralizedApi.feedback.delete(id)            // DELETE /api/feedback/{id}
CentralizedApi.feedback.getByEventId(id)      // GET /api/feedback/event/{id}
```

### Employees

```typescript
CentralizedApi.employees.getAll()             // GET /api/employees/
CentralizedApi.employees.getById(id)          // GET /api/employees/{id}
CentralizedApi.employees.create(data)         // POST /api/employees/
CentralizedApi.employees.update(id, data)     // PUT /api/employees/{id}
CentralizedApi.employees.delete(id)           // DELETE /api/employees/{id}
```

### Tickets

```typescript
CentralizedApi.tickets.getAll()               // GET /api/tickets/
CentralizedApi.tickets.getById(id)            // GET /api/tickets/{id}
CentralizedApi.tickets.create(data)           // POST /api/tickets/
CentralizedApi.tickets.validate(id)           // GET /api/tickets/{id}/validate
```

### Face Images

```typescript
CentralizedApi.faceImages.getAll()            // GET /api/face-images/
CentralizedApi.faceImages.getById(id)         // GET /api/face-images/{id}
CentralizedApi.faceImages.upload(data)        // POST /api/face-images/upload
CentralizedApi.faceImages.delete(id)          // DELETE /api/face-images/{id}
CentralizedApi.faceImages.compare(id1, id2)   // POST /api/face-images/compare
```

### Analytics

```typescript
CentralizedApi.analytics.getDashboardStats()  // GET /api/analytics/dashboard-stats
CentralizedApi.analytics.getEventAnalytics(id)// GET /api/analytics/events/{id}
CentralizedApi.analytics.getUserAnalytics()   // GET /api/analytics/users
CentralizedApi.analytics.getVerificationAnalytics() // GET /api/analytics/verification
```

### Admin

```typescript
CentralizedApi.admin.getActivityLog()         // GET /api/admin/activity-log
CentralizedApi.admin.getSystemStats()         // GET /api/admin/system-stats
CentralizedApi.admin.getHealthStatus()        // GET /api/admin/health
```

## Usage Examples

### Basic GET Request

```typescript
import CentralizedApi from '@/services/centralizedApi';

// Fetch all users
const users = await CentralizedApi.users.getAll();
console.log(users);
```

### POST Request with Data

```typescript
// Create a new event
const newEvent = await CentralizedApi.events.create({
  name: 'Tech Conference 2024',
  date: '2024-12-15',
  location: 'San Francisco',
});
```

### Update Request

```typescript
// Update event details
const updated = await CentralizedApi.events.update('event-123', {
  name: 'Tech Conference 2024 (Updated)',
});
```

### Delete Request

```typescript
// Delete user
await CentralizedApi.users.delete('user-456');
```

### With Type Safety

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

const user = await CentralizedApi.users.getById<User>('user-123');
console.log(user.email); // TypeScript knows this exists
```

### In React Components

```typescript
import { useEffect, useState } from 'react';
import CentralizedApi from '@/services/centralizedApi';

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CentralizedApi.events.getAll()
      .then(data => setEvents(data))
      .catch(error => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {events.map(event => (
        <li key={event.id}>{event.name}</li>
      ))}
    </ul>
  );
}
```

## Configuration Access

Get current API configuration:

```typescript
console.log(CentralizedApi.config.BASE_URL);      // http://localhost:3000
console.log(CentralizedApi.config.FULL_BASE_URL); // http://localhost:3000/api
console.log(CentralizedApi.config.API_PREFIX);    // /api
console.log(CentralizedApi.config.TIMEOUT);       // 15000 (ms)
```

## Built-in Utilities

### Build URL

```typescript
const url = CentralizedApi.buildUrl('/user/123');
// Returns: http://localhost:3000/api/user/123
```

### Get Auth Headers

```typescript
const headers = CentralizedApi.getAuthHeaders();
// Returns: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' }
```

### Generic Call Method

```typescript
// For custom endpoints not in the predefined list
const result = await CentralizedApi.call('GET', '/custom-endpoint');
const result = await CentralizedApi.post('/custom-endpoint', { data: 'value' });
```

## Migration Guide

### From Old Services to Centralized API

**Before (Old Way):**
```typescript
import { ApiService } from '@/constants/api/backend-api-superset';
import { getUsers } from '@/services/apiServices';

ApiService.get('/user/')
// or
getUsers()
```

**After (New Way):**
```typescript
import CentralizedApi from '@/services/centralizedApi';

CentralizedApi.users.getAll()
```

### Before: Scattered Endpoints
- `src/constants/api/endpoints.js`
- `src/services/apiServices.js`
- `src/services/authService.js`
- `src/services/eventsService.ts`
- `src/hooks/useApiIntegration.ts`

### After: Centralized
- ✅ All in `src/services/centralizedApi.ts`
- ✅ Single import for all endpoints
- ✅ Consistent naming conventions
- ✅ Easy to find endpoints

## Logging

All API calls are automatically logged:

```
🌐 API Call: GET http://localhost:3000/api/user/
📡 Response: 200 OK
✅ Success: GET http://localhost:3000/api/user/ [...]

❌ Error: GET http://localhost:3000/api/invalid Error: HTTP 404
```

## Error Handling

```typescript
try {
  const user = await CentralizedApi.users.getById('invalid-id');
} catch (error) {
  console.error('Failed to fetch user:', error.message);
  // Error automatically logged to console
}
```

## Standards

- ✅ All URLs are **absolute** (http://localhost:3000/api/...)
- ✅ **No relative paths** (prevents browser origin issues)
- ✅ Auth token handled automatically
- ✅ All methods use the same BASE_URL from config.js
- ✅ Consistent error handling across all endpoints
- ✅ All endpoints follow REST conventions

## Benefits

1. **Maintainability**: Change API endpoint in one place, updates everywhere
2. **Consistency**: All API calls follow same pattern and conventions
3. **Type Safety**: Full TypeScript support with generics
4. **Debugging**: Centralized logging for all API calls
5. **Error Handling**: Unified error management strategy
6. **Documentation**: All endpoints documented in one file
7. **Refactoring**: Easy to refactor without breaking imports across codebase

## Notes

- The service automatically includes authentication tokens from localStorage
- All requests include proper Content-Type headers
- The BASE_URL is read from `src/constants/api/config.js` at runtime
- If BASE_URL is not set, it defaults to `http://localhost:3000`
- All endpoints are organized by feature (auth, users, events, etc.)

## Support

For new endpoints, add them to the appropriate section in `src/services/centralizedApi.ts`:

```typescript
myNewFeature: {
  getAll() {
    return CentralizedApi.get('/my-feature/');
  },
  
  getById(id: string) {
    return CentralizedApi.get(`/my-feature/${id}`);
  },
  
  create(data: any) {
    return CentralizedApi.post('/my-feature/', data);
  },
}
```

Then use it throughout your app:
```typescript
CentralizedApi.myNewFeature.getAll()
```
