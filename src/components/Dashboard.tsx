import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Clock, Camera, CreditCard, TrendingUp, Activity, Calendar, Ticket, Image, Briefcase, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import OrganizersDebug from "./OrganizersDebug";

const Dashboard = () => {
  const navigate = useNavigate();
  const api = useApiContext();
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerification: 0,
    rejectedUsers: 0,
    totalEvents: 0,
    totalTickets: 0,
    ticketsSold: 0,
    activeEvents: 0,
    totalRevenue: 0,
    faceImages: 0,
    eventOrganisers: 0,
    registrations: 0
  });

  useEffect(() => {
    // Calculate stats from API data
    const calculateStats = () => {
      // Defensive array checks to prevent runtime errors
      const usersArray = Array.isArray(api.users) ? api.users : [];
      const eventsArray = Array.isArray(api.events) ? api.events : [];
      const registrationsArray = Array.isArray(api.registrations) ? api.registrations : [];
      const organizersArray = Array.isArray(api.organizers) ? api.organizers : [];
      
      console.log('Dashboard calculating stats with:', { 
        usersCount: usersArray.length, 
        eventsCount: eventsArray.length, 
        registrationsCount: registrationsArray.length,
        organizersCount: organizersArray.length,
        organizersData: organizersArray
      });
      
      const totalUsers = usersArray.length;
      const verifiedUsers = usersArray.filter(user => 
        user.verificationStatus === 'verified'
      ).length;
      const pendingVerification = usersArray.filter(user => 
        user.verificationStatus === 'pending'
      ).length;
      const rejectedUsers = usersArray.filter(user => 
        user.verificationStatus === 'rejected'
      ).length;
      
      const activeEvents = eventsArray.filter(event => 
        event.status === 'active' || event.status === 'live'
      ).length;
      
      const totalTicketsSold = eventsArray.reduce((sum, event) => 
        sum + (event.ticketsSold || 0), 0
      );
      
      const totalRevenue = eventsArray.reduce((sum, event) => 
        sum + ((event.ticketsSold || 0) * (event.ticketPrice || 0)), 0
      );

      const totalRegistrations = registrationsArray.length;
      const totalOrganizers = organizersArray.length;

      setStats({
        totalUsers,
        verifiedUsers,
        pendingVerification,
        rejectedUsers,
        totalEvents: eventsArray.length,
        totalTickets: eventsArray.reduce((sum, event) => sum + (event.totalTickets || 0), 0),
        ticketsSold: totalTicketsSold,
        activeEvents,
        totalRevenue,
        faceImages: totalUsers, // Assuming each user has a face image
        eventOrganisers: totalOrganizers,
        registrations: totalRegistrations
      });
    };

    calculateStats();
  }, [api.users, api.events, api.registrations, api.organizers]);

  // Use dashboard stats from API if available
  const dashboardStats = api.dashboardStats || stats;
  const verificationRate = (stats.verifiedUsers / stats.totalUsers) * 100 || 0;
  const conversionRate = (stats.ticketsSold / stats.verifiedUsers) * 100 || 0;

  const entityCards = [
    {
      title: "Users",
      icon: Users,
      count: stats.totalUsers,
      color: "yellow",
      gradient: "gradient-primary",
      description: "Total registered users",
      route: "/users",
      actions: ["View All", "Add User", "Export Data"]
    },
    {
      title: "Events",
      icon: Calendar,
      count: stats.totalEvents || 0,
      color: "blue",
      gradient: "gradient-success", 
      description: `${stats.activeEvents || 0} active events`,
      route: "/events",
      actions: ["Manage Events", "Create Event", "Analytics"]
    },
    {
      title: "Event Tickets",
      icon: Ticket,
      count: stats.totalTickets,
      color: "orange",
      gradient: "gradient-accent",
      description: "Tickets sold",
      route: "/tickets",
      actions: ["View Tickets", "Generate Reports", "Refunds"]
    },
    {
      title: "Registrations", 
      icon: UserCheck,
      count: stats.registrations,
      color: "green",
      gradient: "gradient-secondary",
      description: "Event registrations",
      route: "/registrations",
      actions: ["View All", "Check-in", "Export List"]
    },
    {
      title: "Face Images",
      icon: Image,
      count: stats.faceImages,
      color: "purple",
      gradient: "gradient-primary",
      description: "Facial recognition data",
      route: "/face-images",
      actions: ["Manage Images", "Sync Rekognition", "Cleanup"]
    },
    {
      title: "Organisers",
      icon: Briefcase,
      count: stats.eventOrganisers,
      color: "red",
      gradient: "gradient-success",
      description: "Event organisers",
      route: "/organisers",
      actions: ["View Details", "Analytics", "Manage Events"]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3">
          Admin Dashboard
        </h2>
        <p className="text-gray-600 text-lg">Complete overview of your facial recognition ticketing system</p>
      </div>

      {/* Entity Management Cards - Based on Your Schema */}
      {/* Loading Skeleton */}
      {(api.loading.users || api.loading.events || api.loading.registrations) ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card
        key={i}
        className="relative overflow-hidden border-none bg-gray-200 animate-pulse"
      >
        <CardContent className="p-6">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Fixed Metric Cards */}
    <Card className="card-enhanced hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold gradient-text">
          {stats.totalUsers.toLocaleString()}
        </div>
        <div className="flex items-center text-xs text-green-600 mt-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          +12% from last month
        </div>
      </CardContent>
    </Card>

    <Card className="card-enhanced hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold gradient-text">
          {stats.verifiedUsers.toLocaleString()}
        </div>
        <div className="flex items-center text-xs text-green-600 mt-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          {verificationRate.toFixed(1)}% verification rate
        </div>
      </CardContent>
    </Card>

    <Card className="card-enhanced hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold gradient-text">
          {stats.pendingVerification}
        </div>
        <div className="flex items-center text-xs text-yellow-600 mt-1">
          Awaiting manual verification
        </div>
      </CardContent>
    </Card>

    <Card className="card-enhanced hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold gradient-text">
          {stats.ticketsSold.toLocaleString()}
        </div>
        <div className="flex items-center text-xs text-green-600 mt-1">
          ₹{stats.totalRevenue.toLocaleString()} revenue
        </div>
      </CardContent>
    </Card>

    {/* Entity Management Cards */}
    {entityCards.map((entity, index) => (
      <Card
        key={index}
        onClick={() => navigate(entity.route)}
        className={`card-enhanced hover-lift cursor-pointer`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{entity.title}</CardTitle>
          <entity.icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold gradient-text mb-1">
            {entity.count.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {entity.description}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)}



      

      {/* Verification Pipeline */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Verification Pipeline */}
  <Card className="border-0 glass-card hover-lift">
    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg p-3">
      <CardTitle className="flex items-center space-x-2">
        <div className="p-1.5 bg-blue-500 rounded-md">
          <Camera className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-medium">Verification Pipeline</span>
      </CardTitle>
      <CardDescription className="text-xs text-gray-600">User verification status</CardDescription>
    </CardHeader>

    <CardContent className="p-4 space-y-3">
      <div>
        <div className="flex justify-between text-sm font-medium">
          <span>Verification Rate</span>
          <span className="text-blue-600">{verificationRate.toFixed(1)}%</span>
        </div >
              </div>

        
        <Progress value={verificationRate} className="h-2 bg-gray-100" />

      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-3 status-verified rounded-md">
          <div className="text-lg font-semibold">{stats.totalUsers}</div>
          <div className="text-[10px]">Registered</div>
        </div>
        <div className="text-center p-3 status-verified rounded-md">
          <div className="text-lg font-semibold">{stats.verifiedUsers}</div>
          <div className="text-[10px]">Verified</div>
        </div>
        <div className="text-center p-3 status-pending rounded-md">
          <div className="text-lg font-semibold">{stats.pendingVerification}</div>
          <div className="text-[10px]">Pending</div>
        </div>
        <div className="text-center p-3 status-rejected rounded-md">
          <div className="text-lg font-semibold">{stats.rejectedUsers}</div>
          <div className="text-[10px]">Rejected</div>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Ticket Conversion */}
  <Card className="border-0 glass-card hover-lift">
    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg p-3">
      <CardTitle className="flex items-center space-x-2">
        <div className="p-1.5 bg-purple-500 rounded-md">
          <CreditCard className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-medium">Ticket Conversion</span>
      </CardTitle>
      <CardDescription className="text-xs text-gray-600">Verification → Purchase</CardDescription>
    </CardHeader>

    <CardContent className="p-4 space-y-3">
      <div>
        <div className="flex justify-between text-sm] font-medium">
          <span>Conversion Rate</span>
          <span className="text-purple-600">{conversionRate.toFixed(1)}%</span>
        </div>
      </div>
        <Progress value={conversionRate} className="h-2 bg-gray-100" />
     

      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-3 status-verified rounded-md">
          <div className="text-lg font-semibold">{stats.ticketsSold}</div>
          <div className="text-[10px]">Tickets Sold</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-md border border-gray-100">
          <div className="text-lg font-semibold">{stats.verifiedUsers - stats.ticketsSold}</div>
          <div className="text-[10px]">Not Purchased</div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

      {/* Data Flow Visualization */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gray-700 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl">System Data Flow</span>
          </CardTitle>
          <CardDescription className="text-gray-600">User journey from registration to ticket purchase</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4 overflow-x-auto">
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-center">Users Register</div>
              <div className="text-lg font-bold text-blue-600">{stats.totalUsers}</div>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-center">Face Images</div>
              <div className="text-lg font-bold text-purple-600">{stats.faceImages}</div>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-sm font-medium text-center">Verified</div>
              <div className="text-lg font-bold text-green-600">{stats.verifiedUsers}</div>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Ticket className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-sm font-medium text-center">Tickets Sold</div>
              <div className="text-lg font-bold text-orange-600">{stats.totalTickets}</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Recent Activity */}
      <Card className="border-0 glass-card">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-700 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl">Recent Activity</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/activity")}>
              View All
            </Button>
          </CardTitle>
          <CardDescription className="text-gray-600">Latest system activities across all entities</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { name: "Priya Sharma", action: "Photo verified", time: "2 min ago", status: "success" },
            { name: "Rahul Kumar", action: "Aadhaar uploaded", time: "5 min ago", status: "pending" },
            { name: "Anita Singh", action: "Registration complete", time: "8 min ago", status: "success" },
            { name: "Vikash Gupta", action: "Verification failed", time: "12 min ago", status: "error" },
            { name: "Sneha Patel", action: "Ticket purchased", time: "15 min ago", status: "success" }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover-lift">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-semibold">{activity.name}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-white shadow-sm">{activity.time}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Debug Panel - Temporary */}
      <OrganizersDebug />

    </div>
  );
};

export default Dashboard;