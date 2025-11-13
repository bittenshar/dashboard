/**
 * QUICK USAGE GUIDE - Backend API Integration
 * 
 * This guide shows you how to use the backend APIs in your React components
 */

// ===================================================================
// IMPORT THE SERVICES
// ===================================================================

// Option 1: Import everything
import apiServices from './apiServices.js';

// Option 2: Import specific services
import { api, useAuth, useEvents, useRegistrations, Auth } from './apiServices.js';

// Option 3: Import the backend superset (more detailed docs)
import backendApi from '../constants/api/backend-api-superset.js';

// ===================================================================
// 1. AUTHENTICATION EXAMPLES
// ===================================================================

// Using the useAuth hook (recommended for React components)
const LoginComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(credentials.email, credentials.password);
      // User is now logged in, state updated automatically
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        Welcome, {user?.username}!
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};

// Using direct API calls
const directAuthExample = async () => {
  try {
    // Login
    const response = await api.auth.login('admin@example.com', 'password');
    console.log('Login response:', response);

    // Upload image
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (file) {
      const uploadResponse = await api.auth.uploadImage(file, 'John Doe');
      console.log('Upload response:', uploadResponse);
    }

    // Get current user
    const currentUser = await api.auth.getCurrentUser();
    console.log('Current user:', currentUser);

    // Logout
    await api.auth.logout();
  } catch (error) {
    console.error('Auth error:', error.message);
  }
};

// ===================================================================
// 2. EVENTS MANAGEMENT EXAMPLES
// ===================================================================

// Using the useEvents hook
const EventsManager = () => {
  const { events, loading, error, createEvent, updateEvent, deleteEvent } = useEvents();

  const handleCreateEvent = async () => {
    try {
      await createEvent({
        name: 'New Event',
        description: 'Event description',
        location: 'Event location',
        date: '2024-12-31',
        startTime: '10:00',
        endTime: '18:00',
        totalTickets: 100,
        ticketPrice: 50,
        organiserId: 'organizer123'
      });
      alert('Event created successfully!');
    } catch (error) {
      alert('Failed to create event: ' + error.message);
    }
  };

  const handleUpdateEvent = async (eventId) => {
    try {
      await updateEvent(eventId, { status: 'active' });
      alert('Event updated successfully!');
    } catch (error) {
      alert('Failed to update event: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        alert('Event deleted successfully!');
      } catch (error) {
        alert('Failed to delete event: ' + error.message);
      }
    }
  };

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreateEvent}>Create New Event</button>
      
      {events.map(event => (
        <div key={event.eventId} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>
          <p><strong>Date:</strong> {event.date}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Tickets:</strong> {event.ticketsSold || 0}/{event.totalTickets}</p>
          <p><strong>Status:</strong> {event.status}</p>
          
          <button onClick={() => handleUpdateEvent(event.eventId)}>
            Update Event
          </button>
          <button onClick={() => handleDeleteEvent(event.eventId)}>
            Delete Event
          </button>
        </div>
      ))}
    </div>
  );
};

// Direct API usage for events
const directEventsExample = async () => {
  try {
    // Get all events
    const events = await api.events.getAll();
    console.log('All events:', events);

    // Get specific event
    const event = await api.events.getById('event123');
    console.log('Specific event:', event);

    // Create event
    const newEvent = await api.events.create({
      name: 'Tech Conference',
      description: 'Annual tech conference',
      location: 'San Francisco',
      date: '2024-06-15',
      startTime: '09:00',
      endTime: '17:00',
      totalTickets: 500,
      ticketPrice: 200,
      organiserId: 'org456'
    });
    console.log('New event:', newEvent);

    // Get event stats
    const stats = await api.events.getStats();
    console.log('Event stats:', stats);
  } catch (error) {
    console.error('Events error:', error.message);
  }
};

// ===================================================================
// 3. REGISTRATIONS MANAGEMENT EXAMPLES
// ===================================================================

// Using the useRegistrations hook
const RegistrationsManager = () => {
  const { 
    registrations, 
    loading, 
    error, 
    createRegistration,
    checkInUser,
    startFaceVerification,
    completeFaceVerification,
    issueTicket,
    adminOverride
  } = useRegistrations();

  const handleCreateRegistration = async () => {
    try {
      await createRegistration({
        userId: 'user123',
        eventId: 'event456',
        adminBooked: false
      });
      alert('Registration created successfully!');
    } catch (error) {
      alert('Failed to create registration: ' + error.message);
    }
  };

  const handleCheckIn = async (registrationId) => {
    try {
      await checkInUser(registrationId);
      alert('User checked in successfully!');
    } catch (error) {
      alert('Check-in failed: ' + error.message);
    }
  };

  const handleFaceVerification = async (registrationId) => {
    try {
      // Step 1: Start face verification
      await startFaceVerification(registrationId, 'face-verification-id-123');
      
      // Step 2: Complete face verification (in real app, this would be after actual face recognition)
      await completeFaceVerification(registrationId, true, true);
      
      // Step 3: Issue ticket
      await issueTicket(registrationId);
      
      alert('Face verification and ticket issuance completed!');
    } catch (error) {
      alert('Face verification failed: ' + error.message);
    }
  };

  const handleAdminOverride = async (registrationId) => {
    const reason = prompt('Enter override reason:');
    if (reason) {
      try {
        await adminOverride(registrationId, reason, true);
        alert('Admin override successful!');
      } catch (error) {
        alert('Admin override failed: ' + error.message);
      }
    }
  };

  if (loading) return <div>Loading registrations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreateRegistration}>Create Registration</button>
      
      {registrations.map(registration => (
        <div key={registration.registrationId} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h4>Registration {registration.registrationId}</h4>
          <p><strong>Status:</strong> {registration.status}</p>
          <p><strong>Face Verification:</strong> {registration.faceVerificationStatus}</p>
          <p><strong>Ticket Issued:</strong> {registration.ticketIssued ? 'Yes' : 'No'}</p>
          <p><strong>Check-in Time:</strong> {registration.checkInTime || 'Not checked in'}</p>
          
          <button onClick={() => handleCheckIn(registration.registrationId)}>
            Check In
          </button>
          <button onClick={() => handleFaceVerification(registration.registrationId)}>
            Process Face Verification
          </button>
          <button onClick={() => handleAdminOverride(registration.registrationId)}>
            Admin Override
          </button>
        </div>
      ))}
    </div>
  );
};

// ===================================================================
// 4. USERS MANAGEMENT EXAMPLES
// ===================================================================

const UsersManager = () => {
  const { users, loading, error, createUser, updateUser, deleteUser, verifyUser } = useUsers();

  const handleCreateUser = async () => {
    try {
      await createUser({
        FullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890',
        faceId: 'face-id-123'
      });
      alert('User created successfully!');
    } catch (error) {
      alert('Failed to create user: ' + error.message);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreateUser}>Create User</button>
      
      {users.map(user => (
        <div key={user.userId} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h4>{user.FullName}</h4>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Status:</strong> {user.status}</p>
          <p><strong>Verification:</strong> {user.verificationStatus}</p>
          
          <button onClick={() => verifyUser(user.userId)}>
            Verify User
          </button>
          <button onClick={() => deleteUser(user.userId)}>
            Delete User
          </button>
        </div>
      ))}
    </div>
  );
};

// ===================================================================
// 5. DASHBOARD EXAMPLE
// ===================================================================

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load data from multiple endpoints
        const [events, registrations, users, organizers] = await Promise.all([
          api.events.getAll(),
          api.registrations.getAll(),
          api.users.getAll(),
          api.organizers.getAll()
        ]);

        // Get statistics
        const [eventStats, registrationStats] = await Promise.all([
          api.events.getStats().catch(() => ({ totalEvents: 0, activeEvents: 0 })),
          api.registrations.getStats().catch(() => ({ 
            statusStats: [], 
            faceVerificationStats: [], 
            ticketStats: { totalRegistrations: 0, ticketsIssued: 0 } 
          }))
        ]);

        setDashboardData({
          totalEvents: events.length,
          totalRegistrations: registrations.length,
          totalUsers: users.length,
          totalOrganizers: organizers.length,
          eventStats,
          registrationStats,
          pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
          verifiedRegistrations: registrations.filter(r => r.status === 'verified').length,
          lastUpdated: new Date().toLocaleString()
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!dashboardData) return <div>Failed to load dashboard data</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Last updated: {dashboardData.lastUpdated}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Total Events</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardData.totalEvents}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Total Registrations</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardData.totalRegistrations}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardData.totalUsers}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Total Organizers</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardData.totalOrganizers}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Registration Status</h3>
          <p>Pending: {dashboardData.pendingRegistrations}</p>
          <p>Verified: {dashboardData.verifiedRegistrations}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Quick Actions</h3>
          <button onClick={() => window.location.href = '/events'}>Manage Events</button>
          <button onClick={() => window.location.href = '/registrations'}>Manage Registrations</button>
          <button onClick={() => window.location.href = '/users'}>Manage Users</button>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// 6. ERROR HANDLING EXAMPLES
// ===================================================================

const ErrorHandlingExample = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await api.users.getAll();
      setUsers(userData);
      
    } catch (error) {
      setError(error.message);
      
      // Handle specific error types
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        // Redirect to login
        Auth.clear();
        window.location.href = '/login';
      } else if (error.message.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={loadUsers}>Load Users</button>
      
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {users.length > 0 && (
        <div>
          <h3>Users ({users.length})</h3>
          {users.map(user => (
            <div key={user.userId}>{user.FullName} - {user.email}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// 7. SUMMARY OF ALL AVAILABLE ENDPOINTS
// ===================================================================

/*
AUTHENTICATION ENDPOINTS:
- api.auth.login(email, password)
- api.auth.register(userData)
- api.auth.logout()
- api.auth.getCurrentUser()
- api.auth.uploadImage(imageFile, fullName)

EVENTS ENDPOINTS:
- api.events.getAll()
- api.events.getById(id)
- api.events.create(eventData)
- api.events.update(id, updateData)
- api.events.delete(id)
- api.events.getStats()

REGISTRATIONS ENDPOINTS:
- api.registrations.getAll()
- api.registrations.getById(id)
- api.registrations.create(registrationData)
- api.registrations.update(id, updateData)
- api.registrations.delete(id)
- api.registrations.checkIn(id)
- api.registrations.startFaceVerification(id, faceVerificationId)
- api.registrations.completeFaceVerification(id, success, ticketAvailable)
- api.registrations.issueTicket(id)
- api.registrations.adminOverride(id, overrideReason, issueTicket)
- api.registrations.getByStatus(status)
- api.registrations.getByEvent(eventId)
- api.registrations.getByUser(userId)
- api.registrations.getStats()

USERS ENDPOINTS:
- api.users.getAll()
- api.users.getById(id)
- api.users.create(userData)
- api.users.update(id, updateData)
- api.users.delete(id)
- api.users.getByFaceId(faceId)
- api.users.verify(id)
- api.users.search(query, limit, offset)

ORGANIZERS ENDPOINTS:
- api.organizers.getAll()
- api.organizers.getById(id)
- api.organizers.create(organizerData)
- api.organizers.update(id, updateData)
- api.organizers.delete(id)

TICKETS ENDPOINTS:
- api.tickets.getAll()
- api.tickets.getById(id)
- api.tickets.create(ticketData)
- api.tickets.update(id, updateData)
- api.tickets.verify(ticketId, eventId)

FACE IMAGES ENDPOINTS:
- api.faceImages.getAll()
- api.faceImages.getById(rekognitionId)
- api.faceImages.getByName(fullName)
- api.faceImages.create(faceImageData)
- api.faceImages.update(rekognitionId, updateData)
- api.faceImages.delete(rekognitionId)

FEEDBACK ENDPOINTS:
- api.feedback.getAll()
- api.feedback.getById(id)
- api.feedback.create(feedbackData)
- api.feedback.update(id, updateData)
- api.feedback.delete(id)

ADMIN ENDPOINTS:
- api.admin.createEmployee(employeeData)
- api.admin.deleteEmployee(id)
- api.admin.updatePermissions(employeeId, permissions)
- api.admin.getActivityLog()

REACT HOOKS:
- useAuth() - Authentication state and actions
- useEvents() - Events data and CRUD operations
- useRegistrations() - Registrations data and operations
- useUsers() - Users data and CRUD operations
- useOrganizers() - Organizers data and CRUD operations
- useAsync(asyncFunction, dependencies) - Generic async hook
*/

export default {
  LoginComponent,
  EventsManager,
  RegistrationsManager,
  UsersManager,
  AdminDashboard,
  ErrorHandlingExample,
  directAuthExample,
  directEventsExample
};
