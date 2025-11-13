# API Configuration Fix - Port 3000 vs 8080

## Problem Identified
The application was making API calls to `http://localhost:8080/api/user/` instead of `http://localhost:3000/api/user/`

- ❌ **WRONG**: `http://localhost:8080/api/user/` (frontend port)
- ✅ **CORRECT**: `http://localhost:3000/api/user/` (backend port)

## Root Cause
The frontend (Vite) runs on **port 8080**, but the backend runs on **port 3000**. When using relative paths `/api/user/`, browsers resolve them to the current page's origin (`localhost:8080`), which causes requests to fail.

## Solution Implemented

### 1. Configuration Layer (src/constants/api/config.js)
```javascript
export const API_CONFIG = {
  BASE_URL: ENV_BASE_URL ?? 'http://localhost:3000', // ← Always use port 3000
  // ...
};

export const buildUrl = (endpoint) => `${API_CONFIG.BASE_URL}/api${endpoint}`;
```

### 2. API Service Layer (src/constants/api/backend-api-superset.js)
```javascript
const BACKEND_CONFIG = {
  BASE_URL: API_CONFIG.BASE_URL ?? 'http://localhost:3000',
  // ...
};

const ApiService = {
  async call(method, url, data = null, customHeaders = {}) {
    // ALWAYS construct full absolute URL
    const isAbsolute = /^https?:\/\//i.test(url);
    const finalUrl = isAbsolute ? url : `${BACKEND_CONFIG.BASE_URL}${url}`;
    
    // Now finalUrl is: http://localhost:3000/api/user/
    const response = await fetch(finalUrl, config);
    // ...
  }
};
```

### 3. Usage Pattern in Components
```javascript
// ✅ CORRECT - Use ApiService with absolute URLs
import { ApiService } from '@/constants/api/backend-api-superset';

const users = await ApiService.get('/api/user/');

// ❌ WRONG - Never use relative paths directly
// fetch('/api/user/')  ← This will go to localhost:8080!

// ❌ WRONG - Never hardcode localhost
// fetch('http://localhost:8080/api/user/')  ← Hardcoded!
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend App (Vite Dev Server)                             │
│  Running on: http://localhost:8080                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Calls (via ApiService):                               │
│  http://localhost:3000/api/user/  ✅                       │
│  http://localhost:3000/api/events/  ✅                     │
│  http://localhost:3000/api/organizers/  ✅                 │
│                                                             │
│  Request Flow:                                              │
│  Component → useApiIntegration → ApiService.get()          │
│          ↓                                                  │
│    Full URL constructed: http://localhost:3000/api/...    │
│          ↓                                                  │
│    fetch(fullUrl) sends to backend                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌─────────────────────────────────────────┐
        │  Backend Node.js Server                 │
        │  Running on: http://localhost:3000      │
        │                                         │
        │  Receives requests:                     │
        │  GET /api/user/  ✅                     │
        │  POST /api/events/  ✅                  │
        └─────────────────────────────────────────┘
```

## Key Changes Made

### File: src/constants/api/backend-api-superset.js
- Added debug logging for BASE_URL and endpoint
- Added comment: "ALWAYS construct full absolute URL"
- Ensures finalUrl always contains http://localhost:3000

### File: src/constants/api/backend-api-superset.ts
- Same changes as JavaScript version for consistency

### Build Output
- Rebuilt dist folder with corrected configuration
- All compiled code now uses http://localhost:3000 for API calls

## Testing

To verify the fix is working:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open browser console and check the logs:
   ```
   🌐 Making API call to: http://localhost:3000/api/user/
   🌐 Base URL: http://localhost:3000
   🌐 Endpoint: /api/user/
   ```

3. Ensure backend is running on port 3000:
   ```bash
   node backend.js  # or your backend command
   ```

4. Test an API call - should see:
   ```
   ✅ API call successful [GET http://localhost:3000/api/user/]: {...}
   ```

## Port Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 8080 | http://localhost:8080 |
| Backend API | 3000 | http://localhost:3000 |
| API Endpoints | 3000 | http://localhost:3000/api/* |

## Notes for Development

- ✅ Frontend accessible at `http://localhost:8080`
- ✅ Backend API accessible at `http://localhost:3000`
- ✅ All API calls made through `ApiService` will use correct port
- ✅ Configuration centralized in `src/constants/api/config.js`
- ✅ No hardcoded URLs in components
- ✅ No reliance on Vite proxy for API routing
