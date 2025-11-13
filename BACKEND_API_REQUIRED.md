# ⚠️ Backend API Server Required

## Issue: Cannot Fetch Registrations & Tickets

The admin dashboard cannot fetch registrations and tickets data because the **backend API server is not running** on `localhost:3000`.

## Console Errors
```
AggregateError [ECONNREFUSED]: Connection refused
http proxy error: /api/tickets/user/...
http proxy error: /api/registrations/user/...
```

## Why This Happens

1. **Frontend (Vite) running on**: `localhost:8080` ✅ (Working)
2. **Vite Proxy configured to forward to**: `localhost:3000` ✅ (Configured)
3. **Backend API server**: `localhost:3000` ❌ **NOT RUNNING**

When requests are made:
- Browser sends request to `localhost:8080/api/tickets/user/...` 
- Vite proxy intercepts `/api/*` and tries to forward to `localhost:3000`
- **Connection refused** because backend isn't listening

## Solution: Start the Backend API Server

You need to start your backend server (Node.js/Express, Python/Flask, etc.) on port 3000.

### If Backend is in a Separate Repository:

```bash
# Navigate to backend directory
cd /path/to/backend

# Install dependencies
npm install  # or your language's equivalent

# Start the backend server
npm run dev  # or your start script
# Expected output: "Server running on http://localhost:3000"
```

### If Backend is in a Docker Container:

```bash
# Start Docker container if it's not running
docker run -p 3000:3000 your-backend-image

# Or if using docker-compose
docker-compose up
```

## What Happens After Backend is Running

Once the backend API server starts on `localhost:3000`:

1. ✅ Vite proxy successfully connects to backend
2. ✅ All API calls route correctly: `localhost:8080` → `localhost:3000`
3. ✅ Registrations tab displays user event registrations with:
   - Face verification status
   - Ticket availability status
   - Ticket issued status
4. ✅ Tickets tab displays user purchased tickets

## API Endpoints Being Called

The frontend is calling these endpoints (which must be available on the backend):

```
GET /api/registrations/user/{userId}
GET /api/tickets/user/{userId}
GET /api/users/{id}/presigned-urls
GET /api/users/
```

All configured in: `src/services/centralizedApi.ts`

## Frontend Configuration ✅ Complete

- ✅ Centralized API service set up correctly
- ✅ Vite proxy configured to forward `/api/*` to `localhost:3000`
- ✅ UserDetailsModal.tsx configured to fetch registrations & tickets
- ✅ All endpoints use correct paths: `/api/registrations/user/{id}`, `/api/tickets/user/{id}`
- ✅ Proper error handling and loading states implemented

## Next Steps

1. **Start your backend API server on `localhost:3000`**
2. Refresh the admin dashboard in browser
3. Click on any user to open details modal
4. The "Registrations" and "Tickets" tabs should now load data from backend

## Verification Checklist

- [ ] Backend server running on `localhost:3000`
- [ ] Console shows NO `AggregateError [ECONNREFUSED]` errors
- [ ] Opening user details modal loads data
- [ ] Registrations tab displays event registrations
- [ ] Tickets tab displays purchased tickets

---

**Related Files:**
- `src/services/centralizedApi.ts` - All API endpoints
- `src/components/UserDetailsModal.tsx` - Component fetching registration & ticket data
- `vite.config.ts` - Proxy configuration
