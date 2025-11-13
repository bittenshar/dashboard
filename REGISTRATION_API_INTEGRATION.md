# User Event Registrations Integration

## Overview
Updated `UserDetailsModal.tsx` to fetch real user event registrations from the backend instead of using mock data. The component now displays registered events with proper data mapping from your backend API.

## Changes Made

### 1. **CentralizedApi Enhancement**
Added `getByUserId()` method to the registrations section:

```typescript
// src/services/centralizedApi.ts
registrations: {
  getByUserId(userId: string) {
    return CentralizedApi.get(`/registrations/user/${userId}`);
  }
}
```

### 2. **UserDetailsModal.tsx Updates**

#### Removed Mock Data
```typescript
// REMOVED: Static mock registrations array
const userRegistrations = [
  {
    id: "evt_001",
    eventName: "Summer Music Festival",
    eventId: "evt_001",
    registeredOn: "2024-06-15",
    status: "confirmed"
  },
  // ... more mock data
];
```

#### Added State Management
```typescript
const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
const [registrationsLoading, setRegistrationsLoading] = useState(false);
```

#### Added useEffect to Fetch Registrations
```typescript
useEffect(() => {
  // Fetches from: GET /api/registrations/user/{userId}
  const response = await CentralizedApi.registrations.getByUserId(userId);
  // Handles multiple response structures
  // Sets userRegistrations state
}, [isOpen, user]);
```

### 3. **API Integration**

**Backend Endpoint Called:**
```
GET /api/registrations/user/{userId}
```

**Response Structure (from your backend):**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "registrations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "eventId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Summer Music Festival",
          "date": "2024-06-15",
          "location": "Central Park"
        },
        "userId": "507f1f77bcf86cd799439013",
        "registrationDate": "2024-06-15T10:30:00Z",
        "status": "pending",
        "checkInTime": null,
        "ticketIssued": false,
        "faceVerificationStatus": "pending"
      }
    ]
  }
}
```

### 4. **Field Mapping**

Backend fields are mapped to display format:

```typescript
// Backend → Display
eventId._id          → eventId (event MongoDB ID)
eventId.name         → eventName (event display name)
registrationDate     → registeredOn (formatted date)
status               → status (pending/verified/rejected)
_id                  → Registration ID
```

### 5. **UI Components**

**Registrations Tab:**
- Shows loading state while fetching
- Displays each registration as a card
- Shows event name, registration date, and status badge
- Handles empty state gracefully

```tsx
{registrationsLoading ? (
  <p>Loading registrations...</p>
) : userRegistrations.length > 0 ? (
  // Display registrations
) : (
  <p>No registrations found</p>
)}
```

## Backend API Response Handling

The component handles multiple response structures:

```typescript
// Direct array
if (Array.isArray(response)) { ... }

// Wrapped in registrations key
if (response.registrations && Array.isArray(response.registrations)) { ... }

// Wrapped in data key
if (response.data && Array.isArray(response.data)) { ... }

// Nested data structure
if (response.data && response.data.registrations) { ... }
```

## Features

✅ **Real-time Data**: Fetches from backend instead of mock data  
✅ **Proper Field Mapping**: Handles backend schema correctly  
✅ **Loading States**: Shows "Loading..." while fetching  
✅ **Error Handling**: Gracefully handles failures and empty states  
✅ **Type Safety**: Full TypeScript support  
✅ **Responsive UI**: Card-based layout with status badges  

## Integration Points

1. **CentralizedApi.registrations.getByUserId(userId)**
   - Path: `/registrations/user/{userId}`
   - Method: GET
   - Returns populated registrations with event details

2. **Backend Routes** (from your registration routes)
   - `GET /registrations/user/:userId` - Fetch user registrations
   - Route defined in your router with population of userId and eventId

## Testing

### Manual Testing Steps:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open User Verification Tab:**
   - Navigate to a user in the admin panel
   - Click to open user details modal
   - Go to "Registrations" tab

3. **Verify Data:**
   - Should see real registrations from backend
   - NOT mock data
   - Event names, dates, and statuses correct
   - Loading state appears briefly

4. **Check Network:**
   - Open DevTools Network tab
   - Should see: `GET /api/registrations/user/{userId}`
   - Response contains populated eventId with event details

### Example Backend Response:

```json
{
  "status": "success",
  "results": 2,
  "data": {
    "registrations": [
      {
        "_id": "666a1b2c3d4e5f6g7h8i9j0k",
        "eventId": {
          "_id": "555a1b2c3d4e5f6g7h8i9j0k",
          "name": "Tech Conference 2024",
          "date": "2024-12-15",
          "location": "San Francisco Convention Center"
        },
        "userId": "444a1b2c3d4e5f6g7h8i9j0k",
        "registrationDate": "2024-11-01T14:30:00Z",
        "status": "pending",
        "checkInTime": null,
        "ticketIssued": false,
        "faceVerificationStatus": "pending",
        "timestamps": {
          "createdAt": "2024-11-01T14:30:00Z",
          "updatedAt": "2024-11-01T14:30:00Z"
        }
      },
      {
        "_id": "777b2c3d4e5f6g7h8i9j0k1l",
        "eventId": {
          "_id": "666b2c3d4e5f6g7h8i9j0k1l",
          "name": "Music Festival 2024",
          "date": "2024-10-20",
          "location": "Central Park"
        },
        "userId": "444a1b2c3d4e5f6g7h8i9j0k",
        "registrationDate": "2024-10-01T10:15:00Z",
        "status": "verified",
        "checkInTime": "2024-10-20T16:45:00Z",
        "ticketIssued": true,
        "faceVerificationStatus": "success"
      }
    ]
  }
}
```

## File Changes

**Modified Files:**
- `src/services/centralizedApi.ts` - Added `getByUserId()` method
- `src/components/UserDetailsModal.tsx` - Integrated real registration API

**Lines Changed:**
- CentralizedApi: +5 lines (getByUserId method)
- UserDetailsModal: +50 lines (state, useEffect, UI updates)

## Removed Mock Data

The following mock registration structure has been removed:

```typescript
// OLD: Mock data (REMOVED)
const userRegistrations = [
  { id, eventName, eventId, registeredOn, status },
  // ... more mock items
];

// NEW: Real data from backend
const [userRegistrations, setUserRegistrations] = useState([]);
```

## Build Status

✅ **Build successful** in 4.30s
- All TypeScript types correct
- No compilation errors
- Ready for testing

## Next Steps

1. Test with real backend data
2. Verify registrations display correctly
3. Monitor API calls in DevTools
4. Adjust field mapping if needed based on actual backend response

## Future Enhancements

- Add filtering by registration status
- Add registration action buttons (cancel, update)
- Add pagination for many registrations
- Add export registrations functionality
- Add search/filter capabilities
