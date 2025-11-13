/**
 * DUMMY DATA FOR FRONTEND TESTING
 * 
 * This file contains sample data to populate the frontend components
 * before connecting to the actual backend APIs.
 * 
 * To use this data, import it in your components:
 * import { dummyUsers, dummyEvents, dummyRegistrations } from '@/data/dummyData';
 */

// ===================================================================
// DUMMY USERS DATA (matching backend schema)
// ===================================================================
export const dummyUsers = [
  {
    _id: "usr_1698765432001",
    name: "John Doe",
    fullName: "John Doe", // For compatibility
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    role: "user",
    faceId: "face_12345",
    verificationStatus: "verified",
    status: "active",
    avatar: null,
    lastLogin: new Date("2024-01-15T10:30:00Z"),
    createdAt: new Date("2024-01-01T09:00:00Z"),
    updatedAt: new Date("2024-01-15T10:30:00Z")
  },
  {
    _id: "usr_1698765432002",
    name: "Jane Smith",
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 234-5678",
    role: "user",
    faceId: "face_23456",
    verificationStatus: "pending",
    status: "active",
    avatar: null,
    lastLogin: new Date("2024-01-14T15:45:00Z"),
    createdAt: new Date("2024-01-02T11:15:00Z"),
    updatedAt: new Date("2024-01-14T15:45:00Z")
  },
  {
    _id: "usr_1698765432003",
    name: "Mike Johnson",
    fullName: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1 (555) 345-6789",
    role: "employee",
    faceId: "face_34567",
    verificationStatus: "rejected",
    status: "active",
    avatar: null,
    lastLogin: new Date("2024-01-13T08:20:00Z"),
    createdAt: new Date("2024-01-03T14:30:00Z"),
    updatedAt: new Date("2024-01-13T08:20:00Z")
  },
  {
    _id: "usr_1698765432004",
    name: "Sarah Wilson",
    fullName: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1 (555) 456-7890",
    role: "user",
    faceId: "face_45678",
    verificationStatus: "verified",
    status: "suspended",
    avatar: null,
    lastLogin: new Date("2024-01-12T16:10:00Z"),
    createdAt: new Date("2024-01-04T12:45:00Z"),
    updatedAt: new Date("2024-01-12T16:10:00Z")
  },
  {
    _id: "usr_1698765432005",
    name: "David Brown",
    fullName: "David Brown",
    email: "david.brown@example.com",
    phone: "+1 (555) 567-8901",
    role: "user",
    faceId: null,
    verificationStatus: "pending",
    status: "active",
    avatar: null,
    lastLogin: null,
    createdAt: new Date("2024-01-05T09:15:00Z"),
    updatedAt: new Date("2024-01-05T09:15:00Z")
  },
  {
    _id: "usr_1698765432006",
    name: "Emily Davis",
    fullName: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1 (555) 678-9012",
    role: "user",
    faceId: "face_56789",
    verificationStatus: "verified",
    status: "active",
    avatar: null,
    lastLogin: new Date("2024-01-16T11:25:00Z"),
    createdAt: new Date("2024-01-06T10:20:00Z"),
    updatedAt: new Date("2024-01-16T11:25:00Z")
  }
];

// ===================================================================
// DUMMY ADMIN USERS DATA
// ===================================================================
export const dummyAdminUsers = [
  {
    _id: "admin_1698765432001",
    userId: "admin_1698765432001",
    email: "admin@thrillathon.com",
    role: "superadmin",
    permissions: ["all"],
    status: "active",
    statusReason: null,
    lastActivity: new Date("2024-01-16T14:30:00Z"),
    lastLogin: new Date("2024-01-16T09:00:00Z"),
    activityLog: [
      {
        action: "login",
        timestamp: new Date("2024-01-16T09:00:00Z"),
        details: { ip: "192.168.1.100" }
      }
    ],
    createdAt: new Date("2024-01-01T08:00:00Z"),
    updatedAt: new Date("2024-01-16T14:30:00Z")
  },
  {
    _id: "admin_1698765432002",
    userId: "admin_1698765432002",
    email: "eventmanager@thrillathon.com",
    role: "eventadmin",
    permissions: ["events", "users", "registrations"],
    status: "active",
    statusReason: null,
    lastActivity: new Date("2024-01-15T16:45:00Z"),
    lastLogin: new Date("2024-01-15T08:30:00Z"),
    activityLog: [],
    createdAt: new Date("2024-01-02T10:00:00Z"),
    updatedAt: new Date("2024-01-15T16:45:00Z")
  }
];

// ===================================================================
// DUMMY EVENTS DATA
// ===================================================================
export const dummyEvents = [
  {
    _id: "evt_1698765432001",
    eventId: "evt_1698765432001",
    name: "Tech Conference 2024",
    description: "Annual technology conference featuring the latest innovations in AI, blockchain, and web development.",
    location: "Convention Center, Downtown",
    date: new Date("2024-03-15T00:00:00Z"),
    startTime: "09:00",
    endTime: "18:00",
    totalTickets: 500,
    ticketsSold: 342,
    ticketPrice: 150,
    status: "active",
    organiserId: "org_1698765432001",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-15T14:30:00Z")
  },
  {
    _id: "evt_1698765432002",
    eventId: "evt_1698765432002",
    name: "Music Festival Summer",
    description: "Three-day music festival featuring local and international artists across multiple genres.",
    location: "Central Park Amphitheater",
    date: new Date("2024-06-20T00:00:00Z"),
    startTime: "12:00",
    endTime: "23:00",
    totalTickets: 2000,
    ticketsSold: 1875,
    ticketPrice: 75,
    status: "active",
    organiserId: "org_1698765432002",
    coverImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    createdAt: new Date("2024-01-05T11:00:00Z"),
    updatedAt: new Date("2024-01-16T09:15:00Z")
  },
  {
    _id: "evt_1698765432003",
    eventId: "evt_1698765432003",
    name: "Business Workshop",
    description: "Interactive workshop on entrepreneurship and business development strategies.",
    location: "Business Hub, 5th Floor",
    date: new Date("2024-02-28T00:00:00Z"),
    startTime: "13:00",
    endTime: "17:00",
    totalTickets: 100,
    ticketsSold: 87,
    ticketPrice: 200,
    status: "completed",
    organiserId: "org_1698765432001",
    coverImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
    createdAt: new Date("2024-01-10T15:00:00Z"),
    updatedAt: new Date("2024-03-01T10:00:00Z")
  },
  {
    _id: "evt_1698765432004",
    eventId: "evt_1698765432004",
    name: "Art Exhibition Opening",
    description: "Grand opening of contemporary art exhibition featuring works from emerging artists.",
    location: "Modern Art Gallery",
    date: new Date("2024-04-10T00:00:00Z"),
    startTime: "18:00",
    endTime: "21:00",
    totalTickets: 200,
    ticketsSold: 45,
    ticketPrice: 25,
    status: "draft",
    organiserId: "org_1698765432003",
    coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    createdAt: new Date("2024-01-12T16:30:00Z"),
    updatedAt: new Date("2024-01-14T11:20:00Z")
  }
];

// ===================================================================
// DUMMY ORGANIZERS DATA
// ===================================================================
export const dummyOrganizers = [
  {
    _id: "org_1698765432001",
    organiserId: "org_1698765432001",
    name: "TechEvents Inc.",
    email: "contact@techevents.com",
    phone: "+1 (555) 100-2000",
    address: "123 Tech Street, Silicon Valley, CA 94000",
    website: "https://techevents.com",
    description: "Premier technology event organizer specializing in conferences and workshops.",
    contactPerson: "Alex Johnson",
    status: "active",
    joinDate: new Date("2023-06-01T00:00:00Z"),
    totalRevenue: 145750,
    totalEvents: 8,
    activeEvents: 2
  },
  {
    _id: "org_1698765432002",
    organiserId: "org_1698765432002",
    name: "Music Makers LLC",
    email: "info@musicmakers.com",
    phone: "+1 (555) 200-3000",
    address: "456 Music Ave, Nashville, TN 37000",
    website: "https://musicmakers.com",
    description: "Creating unforgettable music experiences for audiences of all ages.",
    contactPerson: "Sarah Martinez",
    status: "active",
    joinDate: new Date("2023-03-15T00:00:00Z"),
    totalRevenue: 234500,
    totalEvents: 12,
    activeEvents: 3
  },
  {
    _id: "org_1698765432003",
    organiserId: "org_1698765432003",
    name: "Art & Culture Co.",
    email: "hello@artculture.com",
    phone: "+1 (555) 300-4000",
    address: "789 Gallery Blvd, New York, NY 10000",
    website: "https://artculture.com",
    description: "Promoting contemporary art and cultural events in urban spaces.",
    contactPerson: "Michael Chen",
    status: "active",
    joinDate: new Date("2023-09-20T00:00:00Z"),
    totalRevenue: 67200,
    totalEvents: 5,
    activeEvents: 1
  }
];

// ===================================================================
// DUMMY REGISTRATIONS DATA
// ===================================================================
export const dummyRegistrations = [
  {
    _id: "reg_1698765432001",
    registrationId: "reg_1698765432001",
    eventId: "evt_1698765432001",
    userId: "usr_1698765432001",
    registrationDate: new Date("2024-01-08T14:30:00Z"),
    status: "verified",
    checkInTime: new Date("2024-03-15T08:45:00Z"),
    waitingStatus: "complete",
    faceVerificationStatus: "success",
    ticketAvailabilityStatus: "available",
    verificationAttempts: 1,
    lastVerificationAttempt: new Date("2024-01-10T16:20:00Z"),
    ticketIssued: true,
    ticketIssuedDate: new Date("2024-01-10T16:25:00Z"),
    adminBooked: false,
    adminOverrideReason: null
  },
  {
    _id: "reg_1698765432002",
    registrationId: "reg_1698765432002",
    eventId: "evt_1698765432001",
    userId: "usr_1698765432002",
    registrationDate: new Date("2024-01-09T11:15:00Z"),
    status: "pending",
    checkInTime: null,
    waitingStatus: "processing",
    faceVerificationStatus: "pending",
    ticketAvailabilityStatus: "pending",
    verificationAttempts: 0,
    lastVerificationAttempt: null,
    ticketIssued: false,
    ticketIssuedDate: null,
    adminBooked: false,
    adminOverrideReason: null
  },
  {
    _id: "reg_1698765432003",
    registrationId: "reg_1698765432003",
    eventId: "evt_1698765432002",
    userId: "usr_1698765432003",
    registrationDate: new Date("2024-01-07T09:45:00Z"),
    status: "rejected",
    checkInTime: null,
    waitingStatus: "complete",
    faceVerificationStatus: "failed",
    ticketAvailabilityStatus: "unavailable",
    verificationAttempts: 3,
    lastVerificationAttempt: new Date("2024-01-12T13:30:00Z"),
    ticketIssued: false,
    ticketIssuedDate: null,
    adminBooked: false,
    adminOverrideReason: null
  },
  {
    _id: "reg_1698765432004",
    registrationId: "reg_1698765432004",
    eventId: "evt_1698765432002",
    userId: "usr_1698765432004",
    registrationDate: new Date("2024-01-11T16:20:00Z"),
    status: "verified",
    checkInTime: null,
    waitingStatus: "complete",
    faceVerificationStatus: "success",
    ticketAvailabilityStatus: "available",
    verificationAttempts: 1,
    lastVerificationAttempt: new Date("2024-01-13T10:15:00Z"),
    ticketIssued: true,
    ticketIssuedDate: new Date("2024-01-13T10:20:00Z"),
    adminBooked: true,
    adminOverrideReason: "VIP customer - direct booking"
  }
];

// ===================================================================
// DUMMY TICKETS DATA
// ===================================================================
export const dummyTickets = [
  {
    _id: "tkt_1698765432001",
    ticketId: "tkt_1698765432001",
    userId: "usr_1698765432001",
    eventId: "evt_1698765432001",
    registrationId: "reg_1698765432001",
    seatNumber: "A-15",
    price: 150,
    purchaseDate: new Date("2024-01-10T16:25:00Z"),
    checkInTime: new Date("2024-03-15T08:45:00Z"),
    status: "used",
    faceVerified: true,
    bookedByAdminUserId: null
  },
  {
    _id: "tkt_1698765432002",
    ticketId: "tkt_1698765432002",
    userId: "usr_1698765432004",
    eventId: "evt_1698765432002",
    registrationId: "reg_1698765432004",
    seatNumber: "VIP-5",
    price: 75,
    purchaseDate: new Date("2024-01-13T10:20:00Z"),
    checkInTime: null,
    status: "active",
    faceVerified: true,
    bookedByAdminUserId: "admin_1698765432002"
  }
];

// ===================================================================
// DUMMY FEEDBACK DATA
// ===================================================================
export const dummyFeedback = [
  {
    _id: "fb_1698765432001",
    feedbackId: "fb_1698765432001",
    userId: "usr_1698765432001",
    eventId: "evt_1698765432003",
    feedbackEntries: [
      {
        rating: 5,
        category: "event",
        subject: "Excellent Workshop",
        message: "The business workshop was incredibly informative and well-organized. Great speakers!",
        date: new Date("2024-03-01T15:30:00Z"),
        status: "new",
        helpful: 12,
        notHelpful: 1
      }
    ],
    createdAt: new Date("2024-03-01T15:30:00Z"),
    updatedAt: new Date("2024-03-01T15:30:00Z")
  },
  {
    _id: "fb_1698765432002",
    feedbackId: "fb_1698765432002",
    userId: "usr_1698765432004",
    eventId: "evt_1698765432002",
    feedbackEntries: [
      {
        rating: 4,
        category: "logistics",
        subject: "Good but crowded",
        message: "Great music and atmosphere, but the venue was quite crowded. Better crowd management needed.",
        date: new Date("2024-06-21T20:15:00Z"),
        status: "processed",
        helpful: 8,
        notHelpful: 2
      }
    ],
    createdAt: new Date("2024-06-21T20:15:00Z"),
    updatedAt: new Date("2024-06-22T09:00:00Z")
  }
];

// ===================================================================
// DUMMY STATS & ANALYTICS DATA
// ===================================================================
export const dummyStats = {
  users: {
    total: 6,
    verified: 3,
    pending: 2,
    rejected: 1,
    active: 5,
    suspended: 1
  },
  events: {
    total: 4,
    active: 2,
    completed: 1,
    draft: 1,
    cancelled: 0
  },
  registrations: {
    total: 4,
    verified: 2,
    pending: 1,
    rejected: 1
  },
  tickets: {
    total: 2,
    active: 1,
    used: 1,
    refunded: 0,
    void: 0
  },
  revenue: {
    total: 225,
    thisMonth: 150,
    lastMonth: 75
  }
};

// ===================================================================
// UTILITY FUNCTIONS FOR DUMMY DATA
// ===================================================================

// Function to get users by status
export const getUsersByStatus = (status) => {
  return dummyUsers.filter(user => user.verificationStatus === status);
};

// Function to get events by status
export const getEventsByStatus = (status) => {
  return dummyEvents.filter(event => event.status === status);
};

// Function to get registrations by event
export const getRegistrationsByEvent = (eventId) => {
  return dummyRegistrations.filter(reg => reg.eventId === eventId);
};

// Function to get user's registrations
export const getUserRegistrations = (userId) => {
  return dummyRegistrations.filter(reg => reg.userId === userId);
};

// Function to simulate API delay
export const simulateApiDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Function to simulate API response
export const simulateApiResponse = async (data, delay = 1000) => {
  await simulateApiDelay(delay);
  return {
    status: 'success',
    data: data,
    message: 'Data retrieved successfully'
  };
};

// ===================================================================
// EXPORT ALL DUMMY DATA
// ===================================================================
export default {
  users: dummyUsers,
  adminUsers: dummyAdminUsers,
  events: dummyEvents,
  organizers: dummyOrganizers,
  registrations: dummyRegistrations,
  tickets: dummyTickets,
  feedback: dummyFeedback,
  stats: dummyStats,
  utils: {
    getUsersByStatus,
    getEventsByStatus,
    getRegistrationsByEvent,
    getUserRegistrations,
    simulateApiResponse,
    simulateApiDelay
  }
};
