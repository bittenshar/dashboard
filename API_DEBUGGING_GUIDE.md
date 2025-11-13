# API Debugging Guide - Complete Reference

## Overview
Comprehensive API debugging system that tracks every API call from formation to response. All API calls are logged with step-by-step execution details.

## Quick Start: View API Debug Logs

### In Browser Console:
```javascript
// View all API calls
getApiDebugLogs()

// View as formatted table
console.table(getApiDebugLogs())

// Export all logs as JSON
exportApiDebugLogs()

// Clear logs
clearApiDebugLogs()
```

## Understanding API Call Flow

Every API call goes through these steps:

```
┌─────────────────────────────────────────────────────┐
│  Step 1️⃣ : Build URL                               │
│  - Endpoint: /registrations/user/{userId}           │
│  - Is Development: ✅ YES                           │
│  - Built URL: /api/registrations/user/...           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Step 2️⃣ : Get Headers                             │
│  - Content-Type: application/json                   │
│  - Authorization: Bearer {token}                    │
│  - Accept: application/json                         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Step 3️⃣ : Request Details                         │
│  - Method: GET                                      │
│  - URL: /api/registrations/user/...                 │
│  - Headers: {...}                                   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Step 4️⃣ : Execute Fetch                           │
│  - Fetching from: /api/registrations/user/...       │
│  - Timestamp: 2024-11-11T14:30:00.000Z              │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Vite Proxy (port 8080)                             │
│  Intercepts: /api/* → http://localhost:3000         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend API (port 3000)                            │
│  Route: GET /api/registrations/user/{userId}        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Step 5️⃣ : Response Received                       │
│  - Status: 200 OK                                   │
│  - Response URL: http://localhost:3000/api/...      │
│  - OK: ✅ true                                      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Step 6️⃣ : Parse & Return Response                 │
│  - Data: {...}                                      │
│  - Success: ✅                                      │
└─────────────────────────────────────────────────────┘
```

## Debugging Common Issues

### Issue 1: API Returns 404

**Console Output:**
```
Step 5️⃣ - Response received
  ├─ Status: 404
  ├─ StatusText: Not Found
  └─ OK: false

Step 6️⃣ - Error response
  └─ Error message: HTTP 404
```

**Debug Check:**
```javascript
// Check what URL was built
const logs = getApiDebugLogs();
const lastCall = logs[logs.length - 1];
console.log('URL Used:', lastCall.url);
// Look for: /api/uploadedpic/admin/signed-urls/...
// Or: /api/registrations/user/...
```

**Common Causes:**
1. ❌ Endpoint doesn't exist on backend
2. ❌ Wrong URL path format
3. ❌ Missing path parameters
4. ❌ Typo in endpoint path

### Issue 2: API Returns 500 (Server Error)

**Console Output:**
```
Step 5️⃣ - Response received
  ├─ Status: 500
  ├─ StatusText: Internal Server Error
  └─ OK: false
```

**Debug Check:**
```javascript
const logs = getApiDebugLogs();
logs.forEach(log => {
  if (log.status >= 500) {
    console.log('Error:', log);
  }
});
```

**Common Causes:**
1. ❌ Backend crashed
2. ❌ Database connection error
3. ❌ Invalid request data
4. ❌ Missing required fields

### Issue 3: API Response URL Shows Localhost:8080

**Problem:**
```
Response URL: http://localhost:8080/api/...
```

**Solution:**
```javascript
// Check if relative paths are being used
const logs = getApiDebugLogs();
logs.forEach(log => {
  if (log.url && log.url.includes('localhost:8080')) {
    console.error('❌ WRONG: Absolute URL to port 8080');
  } else if (log.url && log.url.startsWith('/api')) {
    console.log('✅ CORRECT: Relative path to /api');
  }
});
```

## Viewing Detailed Logs

### Console Groups (Expanded View)

Each API call creates a console group showing all steps:

```
📡 [API REQUEST] GET /registrations/user/{userId}
  Step 1️⃣ - Building URL
    └─ URL Result: /api/registrations/user/...
  Step 2️⃣ - Getting headers
    └─ Final Headers: {...}
  Step 3️⃣ - Request details
    ├─ Method: GET
    ├─ URL: /api/registrations/user/...
    ├─ Headers: ['Content-Type', 'Authorization', ...]
  Step 4️⃣ - Executing fetch()
    └─ Fetching from: /api/registrations/user/...
  Step 5️⃣ - Response received
    ├─ Status: 200
    ├─ StatusText: OK
    ├─ URL: http://localhost:3000/api/registrations/user/...
    └─ OK: true
  Step 7️⃣ - Parsing response
    └─ Success!
```

### Debug Logs Object (JSON View)

```javascript
console.table(getApiDebugLogs());

// Output:
┌─────────────────────────────────────────────────────────────────┐
│ # │ timestamp              │ step                            │ url            │
├─────────────────────────────────────────────────────────────────┤
│ 0 │ 2024-11-11T14:30:00Z   │ [GET] /registrations/user/... │ /api/registr... │
│ 1 │ 2024-11-11T14:30:00Z   │ [GET] /registrations/user/... │ (executing...) │
│ 2 │ 2024-11-11T14:30:00Z   │ [GET] /registrations/user/... │ 200 OK        │
└─────────────────────────────────────────────────────────────────┘
```

## Checking Specific API Calls

### Find Registrations API Calls
```javascript
const logs = getApiDebugLogs();
const registrationCalls = logs.filter(log => 
  log.endpoint && log.endpoint.includes('registrations')
);
console.table(registrationCalls);
```

### Find Uploaded Pic API Calls
```javascript
const logs = getApiDebugLogs();
const uploadedPicCalls = logs.filter(log => 
  log.endpoint && log.endpoint.includes('uploadedpic')
);
console.table(uploadedPicCalls);
```

### Find Failed API Calls (4xx, 5xx)
```javascript
const logs = getApiDebugLogs();
const failedCalls = logs.filter(log => 
  log.status && (log.status >= 400)
);
console.table(failedCalls);
```

## Understanding API Debug Object

Each debug log contains:

```javascript
{
  timestamp: "2024-11-11T14:30:00.000Z",      // When API was called
  step: "[GET] /registrations/user/...",      // API endpoint and step
  endpoint: "/registrations/user/{userId}",   // Full endpoint path
  method: "GET",                               // HTTP method
  url: "/api/registrations/user/...",         // Built URL (relative or absolute)
  BASE_URL: "http://localhost:3000",          // Base URL from config
  isDevelopment: true,                        // Dev mode detected
  status: 200,                                 // HTTP response status
  statusText: "OK",                            // Response status text
  responseUrl: "http://localhost:3000/api/...", // Final response URL
  ok: true,                                    // Response OK flag
  error: null                                  // Error message if any
}
```

## Real Example: Registrations API Call

**Endpoint:** Get user registrations  
**URL:** `/registrations/user/user-btiflyc5h-mhulcxxq`

### Step-by-Step Console Output:

```
📡 [API REQUEST] GET /registrations/user/user-btiflyc5h-mhulcxxq

  Step 1️⃣ - Building URL
    └─ URL Result: /api/registrations/user/user-btiflyc5h-mhulcxxq
    
  Debug Log: URL Built
    ├─ endpoint: /registrations/user/user-btiflyc5h-mhulcxxq
    ├─ method: GET
    ├─ url: /api/registrations/user/user-btiflyc5h-mhulcxxq
    ├─ BASE_URL: http://localhost:3000
    └─ isDevelopment: true

  Step 2️⃣ - Getting headers
    └─ Final Headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer eyJ...'
      }

  Step 3️⃣ - Request details
    ├─ Method: GET
    ├─ URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ Headers: ['Content-Type', 'Accept', 'Authorization']

  Step 4️⃣ - Executing fetch()
    └─ Fetching from: /api/registrations/user/user-btiflyc5h-mhulcxxq

  Debug Log: Executing Fetch
    ├─ url: /api/registrations/user/user-btiflyc5h-mhulcxxq
    ├─ method: GET
    └─ timestamp: 2024-11-11T14:30:00.000Z

  🔄 Vite Proxy Intercepts:
    /api/registrations/user/user-btiflyc5h-mhulcxxq
         ↓
    http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq

  📡 Backend Processes:
    GET http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq

  Step 5️⃣ - Response received
    ├─ Status: 200
    ├─ StatusText: OK
    ├─ URL: http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ OK: true

  Debug Log: Response Received
    ├─ status: 200
    ├─ statusText: OK
    ├─ responseUrl: http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ ok: true

  Step 7️⃣ - Parsing response
    └─ Success! Data: {...}
```

## Debugging Tools

### Console Commands Available

```javascript
// View all debug logs
getApiDebugLogs()

// Format as table
console.table(getApiDebugLogs())

// Export as JSON file
exportApiDebugLogs()

// Clear all logs
clearApiDebugLogs()

// Get only failed calls
getApiDebugLogs().filter(l => l.status >= 400)

// Get only registrations API calls
getApiDebugLogs().filter(l => l.endpoint.includes('registrations'))

// Get average response time
getApiDebugLogs().length > 0 ? 'Check timestamps' : 'No calls'
```

## Common API Endpoints to Debug

### Registrations
```javascript
// Should see these in debug logs:
// Step 1: /registrations/user/{userId}
// Step 4: GET /api/registrations/user/{userId}
// Step 5: 200 http://localhost:3000/api/registrations/user/{userId}
```

### Uploaded Pictures
```javascript
// Should see these in debug logs:
// Step 1: /uploadedpic/admin/signed-urls/{userId}
// Step 4: GET /api/uploadedpic/admin/signed-urls/{userId}
// Step 5: 200 http://localhost:3000/api/uploadedpic/admin/signed-urls/{userId}
```

### Users
```javascript
// Should see these in debug logs:
// Step 1: /user/
// Step 4: GET /api/user/
// Step 5: 200 http://localhost:3000/api/user/
```

## File Locations

**Debugger Utility:**
- `src/utils/apiDebugger.ts`

**Centralized API Service (with debugging):**
- `src/services/centralizedApi.ts`

**Debug Functions Accessible Globally:**
- `getApiDebugLogs()` - View all logs
- `clearApiDebugLogs()` - Clear logs
- `exportApiDebugLogs()` - Export as JSON

## Troubleshooting

### Logs Not Appearing
1. Check browser console is open (F12)
2. Verify dev server is running (`npm run dev`)
3. Refresh page (Ctrl+Shift+R)
4. Make an API call to trigger logs

### Can't Find getApiDebugLogs Function
1. Ensure page has fully loaded
2. Check console for errors
3. Verify CentralizedApi is imported in app
4. Try calling `window.getApiDebugLogs()`

### All Logs Show 404
1. Check backend is running on port 3000
2. Verify endpoints exist on backend
3. Check URL paths match backend routes
4. Review backend controller/routes

## Summary

✅ All API calls automatically logged  
✅ Step-by-step execution tracking  
✅ Request and response details captured  
✅ Global console commands for debugging  
✅ Easy filtering and analysis of logs  
✅ JSON export for sharing/archiving  

Use these debugging tools to understand exactly what APIs are being called, how they're formed, and what responses they return!
