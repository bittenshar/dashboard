# Backend Integration for AdminPanel

## Overview
The AdminPanel component has been successfully connected to the backend API. This document outlines the integration and testing procedures.

## Backend Endpoints Used

### Employee Management
- `GET /api/admin/employees` - Get all employees
- `POST /api/admin/employees` - Create new employee  
- `DELETE /api/admin/employees/:id` - Delete employee
- `PATCH /api/admin/employees/permissions` - Update employee permissions

### Health Check
- `GET /api/health` - Backend health check

## Files Modified

### Frontend Components
- `src/components/AdminPanel.tsx` - Main admin panel component
- `src/services/adminService.js` - API service for admin operations
- `src/hooks/useEmployees.js` - Custom hook for employee management
- `src/constants/api/endpoints.js` - API endpoint definitions
- `src/constants/api/utils.js` - API utility functions
- `src/utils/testConnection.js` - Connection testing utilities

## Key Features

### 1. Employee Management
- ✅ Create employees with role-based permissions
- ✅ View all employees with loading states
- ✅ Delete employees with confirmation
- ✅ Update employee permissions
- ✅ Error handling with fallback to localStorage

### 2. Backend Integration
- ✅ Automatic API token management
- ✅ CORS configuration for frontend-backend communication
- ✅ Error handling and user feedback
- ✅ Loading states for all operations
- ✅ Fallback to localStorage when backend is unavailable

### 3. Authentication
- ✅ JWT token storage and automatic inclusion in requests
- ✅ Protected routes with authentication middleware
- ✅ Admin role verification

## Testing the Integration

### 1. Start the Backend
```bash
cd nodejscopy
npm install
npm start
```
Backend will run on http://localhost:3000

### 2. Start the Frontend
```bash
cd thrillathon-face-verify-admin----delete
npm install
npm run dev
```
Frontend will run on http://localhost:8080

### 3. Test Connection
1. Navigate to Admin Panel → Employee Management tab
2. Click "Test Backend" button
3. Check browser console and toast notifications

### 4. Test Employee Operations
1. Ensure you're logged in as an admin user
2. Try creating a new employee
3. Test permission updates
4. Test employee deletion

## Error Handling

### Network Errors
- Displays user-friendly error messages
- Falls back to localStorage for employee data
- Retry mechanisms available

### Authentication Errors
- Automatic token refresh (if implemented)
- Clear error messages for unauthorized access
- Graceful degradation to offline mode

### Validation Errors
- Form validation before API calls
- Backend validation error display
- Field-specific error highlighting

## Backend Requirements

### Environment Variables
Ensure these are set in `nodejscopy/src/config/config.env`:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### CORS Configuration
Backend is configured to accept requests from:
- http://localhost:8080 (Vite dev server)
- http://localhost:3000 (React dev server)
- http://localhost:5173 (Alternative Vite port)

## Permissions System

The system supports these permission types:
- `user_verification` - Facial recognition management
- `events` - Event management
- `organisers` - Organiser management  
- `feedback` - Feedback management
- `analytics` - Analytics and reports

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for frontend port
   - Check browser console for specific CORS messages

2. **Authentication Failures**
   - Verify JWT token is stored in localStorage
   - Check token expiration
   - Ensure admin role permissions

3. **Network Connection**
   - Verify backend is running on port 3000
   - Check if MongoDB is connected
   - Use "Test Backend" button for quick diagnosis

4. **API Endpoint Errors**
   - Check browser Network tab for failed requests
   - Verify endpoint URLs match backend routes
   - Check request headers and payload format

### Debug Mode
Enable debug logging by opening browser console and running:
```javascript
localStorage.setItem('debug', 'true');
```

## Production Considerations

### Security
- JWT tokens should be stored securely
- API endpoints should validate permissions
- Sensitive data should not be logged

### Performance
- Implement pagination for large employee lists
- Add caching for frequently accessed data
- Use loading states for better UX

### Monitoring
- Add API response time monitoring
- Implement error tracking
- Log important user actions

## Next Steps

1. Add employee profile editing
2. Implement bulk employee operations
3. Add activity logging
4. Implement real-time updates
5. Add employee photo management
6. Implement advanced filtering and search
