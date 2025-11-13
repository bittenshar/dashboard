# Complete API URL Debugging Guide

## Overview
The CentralizedApi now includes comprehensive debugging that shows:
- ✅ Base URL configuration
- ✅ Full endpoint path
- ✅ Complete URL formation
- ✅ Vite proxy routing
- ✅ Step-by-step API call execution

## How to Debug API Calls

### Step 1: Open Browser DevTools
```
Press F12 → Go to Console tab
```

### Step 2: Trigger an API Call
For example, open User Details and go to Registrations tab

### Step 3: Watch Console for Debug Output

## Debug Output Breakdown

### URL Builder Debug
When an API endpoint is called, you'll see:

```
🔨 [URL BUILDER] Building endpoint URL
  ├─ BASE_URL: http://localhost:3000
  ├─ API_PREFIX: /api
  ├─ Endpoint: /registrations/user/user-btiflyc5h-mhulcxxq
  ├─ Built URL (relative): /api/registrations/user/user-btiflyc5h-mhulcxxq
  ├─ Full URL (via proxy): http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
  └─ Environment: localhost
```

**What this shows:**
- `BASE_URL` - The backend base address (http://localhost:3000)
- `API_PREFIX` - Added to all endpoints (/api)
- `Endpoint` - The specific endpoint path
- `Built URL (relative)` - What gets sent to browser (uses Vite proxy)
- `Full URL (via proxy)` - Where the request actually goes (through proxy)
- `Environment` - Current hostname

### API Request Debug
For each API call, you'll see:

```
📡 [API REQUEST] GET /registrations/user/user-btiflyc5h-mhulcxxq
  Step 1️⃣ - Building URL
    └─ URL Result: /api/registrations/user/user-btiflyc5h-mhulcxxq
  
  Step 2️⃣ - Getting headers
    └─ Final Headers: {Content-Type: application/json, Authorization: Bearer ...}
  
  Step 3️⃣ - Request details
    ├─ Method: GET
    ├─ URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
    ├─ Headers: (3) ['Content-Type', 'Accept', 'Authorization']
    └─ Body: (no body for GET)
  
  Step 4️⃣ - Executing fetch()
    ├─ Relative URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
    ├─ Full URL: http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ Via Vite Proxy: YES (localhost:8080 → localhost:3000)
```

**What this shows:**
- Method (GET, POST, PUT, PATCH, DELETE)
- Endpoint path
- Headers being sent (including auth token)
- Whether Vite proxy is being used
- Complete URL formation process

### Auth Headers Debug
```
🔑 [AUTH HEADERS]
{
  hasToken: true,
  tokenLength: 245,
  headers: (3) ['Content-Type', 'Accept', 'Authorization']
}
```

**What this shows:**
- If authentication token exists
- Token length
- Headers being sent

### Response Debug
After fetch completes:

```
📡 Response: 200 OK
✅ Success: GET /registrations/user/user-btiflyc5h-mhulcxxq
{
  status: 'success',
  results: 2,
  data: {...}
}
```

Or on error:
```
❌ Error: GET /registrations/user/user-btiflyc5h-mhulcxxq
Error: HTTP 404 Not Found
```

## Common Endpoints and Their URLs

### User Registration Endpoint
```
Endpoint: /registrations/user/user-btiflyc5h-mhulcxxq
Built URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
Full URL: http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
Via: Vite Proxy (localhost:8080 → localhost:3000)
```

### Signed URLs Endpoint
```
Endpoint: /uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
Built URL: /api/uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
Full URL: http://localhost:3000/api/uploadedpic/admin/signed-urls/user-btiflyc5h-mhulcxxq
Via: Vite Proxy (localhost:8080 → localhost:3000)
```

### User Verification Endpoint
```
Endpoint: /user/user-btiflyc5h-mhulcxxq
Built URL: /api/user/user-btiflyc5h-mhulcxxq
Full URL: http://localhost:3000/api/user/user-btiflyc5h-mhulcxxq
Via: Vite Proxy (localhost:8080 → localhost:3000)
```

## Debugging Checklist

### Check 1: Is the relative URL being built?
Look for:
```
Built URL (relative): /api/...
```
✅ Should START with `/api`
❌ Should NOT be `http://localhost:8080/...`

### Check 2: Does the full URL show port 3000?
Look for:
```
Full URL (via proxy): http://localhost:3000/api/...
```
✅ Should contain `localhost:3000`
❌ Should NOT be `localhost:8080`

### Check 3: Is Vite proxy being used?
Look for:
```
Via Vite Proxy: YES (localhost:8080 → localhost:3000)
```
✅ Should say YES

### Check 4: What's the HTTP status?
Look for response status after fetch:
```
📡 Response: 200 OK
```
✅ Status should be 2xx (200, 201, etc.)
⚠️ 400-499 = Client error (bad request, auth failed, endpoint not found)
❌ 500+ = Server error (backend issue)

### Check 5: What data is returned?
Look for success message and data:
```
✅ Success: GET /api/registrations/user/...
```
Shows the actual data returned from backend

## Troubleshooting Common Issues

### Issue: Still seeing localhost:8080/api
**Debug steps:**
1. Check console URL builder output
2. Verify `Built URL (relative)` starts with `/api`
3. Hard refresh browser (Ctrl+Shift+R)
4. Restart dev server (`npm run dev`)

### Issue: Getting 404 Not Found
**Debug steps:**
1. Check the full URL is correct
2. Verify endpoint exists on backend
3. Check if authentication is needed
4. Verify user ID is correct

Example:
```
❌ GET /api/registrations/user/invalid-id → 404

Check if 'invalid-id' exists in database
```

### Issue: Getting 401 Unauthorized
**Debug steps:**
1. Check if token exists: `hasToken: true`
2. Check token is valid
3. Check token is being sent in headers
4. Re-login to get fresh token

### Issue: API not being called at all
**Debug steps:**
1. Check if component is mounted
2. Check if useEffect is running
3. Look for any console errors
4. Verify endpoint path is correct

## Step-by-Step Example: Registrations Tab

### Step 1: User opens details modal
Console shows:
```
Opening UserDetailsModal for user: user-btiflyc5h-mhulcxxq
```

### Step 2: Registrations tab clicked
Component fetches registrations:
```
📋 Fetching registrations for userId: user-btiflyc5h-mhulcxxq
```

### Step 3: URL Builder
```
🔨 [URL BUILDER] Building endpoint URL
  ...
  ├─ Built URL (relative): /api/registrations/user/user-btiflyc5h-mhulcxxq
  ├─ Full URL (via proxy): http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
```

### Step 4: API Request
```
📡 [API REQUEST] GET /registrations/user/user-btiflyc5h-mhulcxxq
  Step 1️⃣ - Building URL
  Step 2️⃣ - Getting headers
  Step 3️⃣ - Request details
  Step 4️⃣ - Executing fetch()
    └─ Relative URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ Full URL: http://localhost:3000/api/registrations/user/user-btiflyc5h-mhulcxxq
    └─ Via Vite Proxy: YES
```

### Step 5: Response
```
📡 Response: 200 OK
✅ Success: GET /api/registrations/user/user-btiflyc5h-mhulcxxq
📋 Registrations fetched: [
  {
    _id: "...",
    eventId: {...},
    status: "pending"
  }
]
```

## API Configuration Reference

### BASE_URL
- **Value:** `http://localhost:3000`
- **Purpose:** Backend API server address
- **File:** `src/constants/api/config.js`

### API_PREFIX
- **Value:** `/api`
- **Purpose:** API route prefix (all requests start with `/api`)
- **Why:** To distinguish API routes from other routes

### Vite Proxy
- **Frontend:** `http://localhost:8080`
- **Proxy Rule:** `/api/*` → `http://localhost:3000/api/*`
- **File:** `vite.config.ts`
- **Purpose:** Avoid CORS issues and use relative paths

## Console Filtering

To see only API debugging:
```javascript
// In DevTools console, filter by:
// 🔨 = URL Building
// 📡 = API Requests
// 🔑 = Auth Headers
// 📋 = Data fetching
// ✅ = Success
// ❌ = Errors
```

## Build Status
✅ Built in 4.69s with comprehensive debugging enabled

## Next Steps
1. Start dev server: `npm run dev`
2. Open application: `http://localhost:8080`
3. Open DevTools: F12 → Console
4. Trigger API calls and watch the debug output
5. Verify URLs are correct and responses match expectations
