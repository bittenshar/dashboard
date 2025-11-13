# API Debugging Quick Reference Card

## Console Debug Output Format

### URL Building
```
� [URL BUILDER] Building endpoint URL
  ├─ BASE_URL: http://localhost:3000
  ├─ API_PREFIX: /api
  ├─ Endpoint: /registrations/user/{userId}
  ├─ Built URL (relative): /api/registrations/user/{userId}
  ├─ Full URL (via proxy): http://localhost:3000/api/registrations/user/{userId}
  └─ Environment: localhost
```

### API Request
```
📡 [API REQUEST] {METHOD} {ENDPOINT}
  Step 1️⃣ - Building URL
    └─ URL Result: /api/...
  Step 2️⃣ - Getting headers
    └─ Final Headers: {...}
  Step 3️⃣ - Request details
    ├─ Method: {METHOD}
    ├─ URL: /api/...
    ├─ Headers: [...]
    └─ Body: {...}
  Step 4️⃣ - Executing fetch()
    ├─ Relative URL: /api/...
    ├─ Full URL: http://localhost:3000/api/...
    └─ Via Vite Proxy: YES
```

### Response
```
✅ Success: {METHOD} /api/...
{response data}

OR

❌ Error: {METHOD} /api/...
Error: HTTP {status} {message}
```

## URL Mapping Examples

| Endpoint | Built URL | Full URL | Via |
|----------|-----------|----------|-----|
| `/registrations/user/{id}` | `/api/registrations/user/{id}` | `http://localhost:3000/api/registrations/user/{id}` | Vite Proxy |
| `/uploadedpic/admin/signed-urls/{id}` | `/api/uploadedpic/admin/signed-urls/{id}` | `http://localhost:3000/api/uploadedpic/admin/signed-urls/{id}` | Vite Proxy |
| `/user/{id}` | `/api/user/{id}` | `http://localhost:3000/api/user/{id}` | Vite Proxy |
| `/events/` | `/api/events/` | `http://localhost:3000/api/events/` | Vite Proxy |
| `/auth/admin-login` | `/api/auth/admin-login` | `http://localhost:3000/api/auth/admin-login` | Vite Proxy |

## HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200-299 | ✅ Success | Data returned correctly |
| 400 | ❌ Bad Request | Check endpoint/parameters |
| 401 | ❌ Unauthorized | Check authentication token |
| 404 | ❌ Not Found | Endpoint doesn't exist on backend |
| 500+ | ❌ Server Error | Backend issue - check backend logs |

## Configuration Values

```javascript
// All APIs use these configs
BASE_URL = 'http://localhost:3000'
API_PREFIX = '/api'
FULL_BASE_URL = 'http://localhost:3000/api'

// Development
Frontend: http://localhost:8080
Backend: http://localhost:3000
Vite Proxy: /api/* → http://localhost:3000/api/*

// Requests
Sent as: /api/...
Forwarded to: http://localhost:3000/api/...
```

## Debugging Steps

1. **Open DevTools**
   ```
   Press F12 → Console tab
   ```

2. **Trigger API call**
   ```
   Click button that calls API
   ```

3. **Check console for:**
   ```
   🔨 URL Builder output → Verify full URL shows port 3000
   📡 API Request → Verify relative URL and proxy routing
   ✅ Success → Data returned correctly
   ❌ Error → Check status code and error message
   ```

4. **Check Network tab:**
   ```
   DevTools → Network tab
   Look for request: /api/...
   Response status: 200
   Response data: Valid JSON
   ```

## Common Issues

| Issue | Check | Solution |
|-------|-------|----------|
| Still seeing `localhost:8080/api` | Built URL (relative) | Hard refresh (Ctrl+Shift+R) |
| Getting 404 | Endpoint in full URL | Verify endpoint exists on backend |
| Getting 401 | hasToken in auth headers | Re-login or check token |
| No data showing | Response status | Check backend logs |
| API not called | Console logs | Check component/useEffect |

## Key Points

✅ **Always uses relative paths** → `/api/...`  
✅ **Vite proxy handles routing** → `localhost:8080 → localhost:3000`  
✅ **Full URL shows backend** → `http://localhost:3000/api/...`  
✅ **Enhanced logging** → See every step of URL building  
✅ **Works in dev + prod** → Relative paths in dev, absolute URLs in prod  

## File Locations

- **API Service:** `src/services/centralizedApi.ts`
- **Config:** `src/constants/api/config.js`
- **Vite Config:** `vite.config.ts`
- **Registrations:** `src/components/UserDetailsModal.tsx`

## Test API Calls

### Registrations
```javascript
// In console
CentralizedApi.registrations.getByUserId('user-btiflyc5h-mhulcxxq')
  .then(data => console.log('✅ Data:', data))
  .catch(err => console.error('❌ Error:', err))
```

### Users
```javascript
CentralizedApi.users.getAll()
  .then(data => console.log('✅ Users:', data))
  .catch(err => console.error('❌ Error:', err))
```

### Events
```javascript
CentralizedApi.events.getAll()
  .then(data => console.log('✅ Events:', data))
  .catch(err => console.error('❌ Error:', err))
```

## Build Status
✅ Built successfully with comprehensive debugging  
📊 Build time: 4.69s  
📦 Module count: 5544 transformed

### Find Uploaded Pic Calls
```javascript
getApiDebugLogs().filter(l => l.step?.includes('uploadedpic'))
```

### Find Failed Calls (4xx, 5xx)
```javascript
getApiDebugLogs().filter(l => l.status >= 400)
```

### Find Successful Calls (200)
```javascript
getApiDebugLogs().filter(l => l.status === 200)
```

## 📊 Analysis

### Count API Calls
```javascript
getApiDebugLogs().length
```

### Get Last API Call
```javascript
getApiDebugLogs()[getApiDebugLogs().length - 1]
```

### Group by Endpoint
```javascript
const logs = getApiDebugLogs();
logs.reduce((acc, log) => {
  const ep = log.endpoint || 'unknown';
  acc[ep] = (acc[ep] || 0) + 1;
  return acc;
}, {})
```

## ✅ What to Look For

### Correct URL Formation
```
✅ CORRECT:
  URL: /api/registrations/user/user-btiflyc5h-mhulcxxq
  (Relative path for Vite proxy)

❌ WRONG:
  URL: http://localhost:8080/api/registrations/user/...
  (Hardcoded to port 8080)

✅ ALSO CORRECT:
  Response URL: http://localhost:3000/api/...
  (After Vite proxy forwarding to backend)
```

### Successful Response
```
Status: 200
StatusText: OK
ok: true
Response URL: http://localhost:3000/api/...
```

### Failed Response
```
Status: 404 / 500 / 401
StatusText: Not Found / Internal Server Error / Unauthorized
ok: false
Error message shown in console
```

## 🛠️ Common Debugging Steps

### Step 1: Check if URL is Built Correctly
```javascript
const lastLog = getApiDebugLogs()[getApiDebugLogs().length - 1];
console.log('Built URL:', lastLog.url);
// Should start with /api (not http://localhost)
```

### Step 2: Check Response Status
```javascript
const lastLog = getApiDebugLogs()[getApiDebugLogs().length - 1];
console.log('Status:', lastLog.status);
// 200 = OK, 404 = Not Found, 500 = Server Error
```

### Step 3: Check Response URL (After Proxy)
```javascript
const lastLog = getApiDebugLogs()[getApiDebugLogs().length - 1];
console.log('Response URL:', lastLog.responseUrl);
// Should show http://localhost:3000 (not 8080)
```

### Step 4: Check Request Headers
```javascript
const lastLog = getApiDebugLogs()[getApiDebugLogs().length - 1];
console.log('Endpoint:', lastLog.endpoint);
console.log('Method:', lastLog.method);
// Verify endpoint path is correct
```

## 🐛 Real Example: Debug Registrations Call

**Problem:** Getting 404 on registrations API

**Debug:**
```javascript
// 1. Get the call
const calls = getApiDebugLogs()
  .filter(l => l.step?.includes('registrations'));

// 2. View it
console.table(calls);

// 3. Check URL
console.log('URL:', calls[0].url);
// Expected: /api/registrations/user/user-btiflyc5h-mhulcxxq

// 4. Check status
console.log('Status:', calls[0].status);
// If 404: endpoint doesn't exist

// 5. Check response
console.log('Error:', calls[0].error);
```

## 🚀 Workflow

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Go to http://localhost:8080
   - Open DevTools (F12)

3. **Make API Call**
   - Navigate to User Details
   - Go to Registrations tab
   - Trigger API call

4. **Check Logs**
   ```javascript
   getApiDebugLogs()
   ```

5. **Analyze**
   - Check URL is relative `/api/...`
   - Check status is 200
   - Check response URL shows `localhost:3000`

6. **Debug if Needed**
   - See "Finding Specific Calls" section
   - Check error messages
   - Verify endpoint exists

## 📋 Endpoints to Monitor

| Endpoint | Expected Call | Should Return |
|----------|--------------|---------------|
| User Registrations | GET `/api/registrations/user/{id}` | 200 with registration data |
| Uploaded Pic | GET `/api/uploadedpic/admin/signed-urls/{id}` | 200 with signed URL or 404 |
| All Users | GET `/api/user/` | 200 with users array |
| Events | GET `/api/events/` | 200 with events array |

## 🎯 Key Things to Verify

- [ ] URL is relative (starts with `/api`)
- [ ] Response URL shows `localhost:3000` (not `8080`)
- [ ] Status is `200` for success
- [ ] No `404` errors (endpoint doesn't exist)
- [ ] No `500` errors (backend crashed)
- [ ] Authorization header present
- [ ] Content-Type is `application/json`

## 💡 Pro Tips

1. **Keep logs open while working**
   - Pin the console or use DevTools in split view
   - Monitor all API calls in real-time

2. **Export logs before restart**
   ```javascript
   copy(JSON.stringify(getApiDebugLogs(), null, 2))
   // Then paste into text editor
   ```

3. **Search logs by timestamp**
   ```javascript
   const before = new Date('2024-11-11T14:30:00Z');
   getApiDebugLogs().filter(l => 
     new Date(l.timestamp) > before
   )
   ```

4. **Filter by success/failure**
   ```javascript
   const successful = getApiDebugLogs().filter(l => l.status < 400);
   const failed = getApiDebugLogs().filter(l => l.status >= 400);
   ```

## 🆘 Still Not Working?

1. **Check backend is running** on port 3000
2. **Check Vite proxy** is configured in `vite.config.ts`
3. **Check endpoints exist** on backend
4. **Check authentication** token is valid
5. **Check browser cache** - hard refresh Ctrl+Shift+R
6. **Check console for errors** - red errors in console panel
7. **Check Network tab** - see actual HTTP requests
8. **Check backend logs** - see server-side errors
