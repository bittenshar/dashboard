import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Ticket, 
  DollarSign, 
  Eye,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BusinessAnalytics = () => {
  // Mock analytics data
  const overallStats = {
    totalEvents: 15,
    totalUsers: 2847,
    totalRevenue: 4250000,
    totalTicketsSold: 8567,
    verificationRate: 94.2,
    attendanceRate: 87.5
  };

  const monthlyData = [
    { month: 'Jan', revenue: 320000, events: 2, users: 450 },
    { month: 'Feb', revenue: 450000, events: 3, users: 720 },
    { month: 'Mar', revenue: 680000, events: 4, users: 980 },
    { month: 'Apr', revenue: 520000, events: 3, users: 650 },
    { month: 'May', revenue: 890000, events: 5, users: 1200 },
    { month: 'Jun', revenue: 750000, events: 4, users: 890 }
  ];

  const eventTypesData = [
    { name: 'Music Festivals', value: 45, color: '#8b5cf6' },
    { name: 'Tech Conferences', value: 25, color: '#06b6d4' },
    { name: 'Cultural Events', value: 20, color: '#10b981' },
    { name: 'Sports Events', value: 10, color: '#f59e0b' }
  ];

  const topEvents = [
    { name: 'Thrillathon Music Festival 2024', attendees: 3247, revenue: 974100, location: 'Mumbai' },
    { name: 'Tech Conference Bangalore', attendees: 1823, revenue: 911500, location: 'Bangalore' },
    { name: 'Cultural Fest Delhi', attendees: 245, revenue: 61250, location: 'Delhi' }
  ];

  const recentActivities = [
    { action: 'New user registered', user: 'Priya Sharma', time: '2 minutes ago', type: 'user' },
    { action: 'Ticket purchased', user: 'Amit Patel', time: '5 minutes ago', type: 'ticket' },
    { action: 'Event created', user: 'Admin', time: '1 hour ago', type: 'event' },
    { action: 'Face verification completed', user: 'Neha Kapoor', time: '2 hours ago', type: 'verification' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Business Analytics</h2>
        <p className="text-muted-foreground">Comprehensive insights into your event management platform</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-enhanced hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">₹{overallStats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{overallStats.totalEvents}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +3 new this month
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{overallStats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{overallStats.totalTicketsSold.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.7% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="card-enhanced hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{overallStats.verificationRate}%</div>
            <Progress value={overallStats.verificationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-enhanced hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{overallStats.attendanceRate}%</div>
            <Progress value={overallStats.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Types Distribution */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Event Types Distribution</CardTitle>
            <CardDescription>Breakdown of events by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {eventTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Events and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Events */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Top Performing Events</CardTitle>
            <CardDescription>Events ranked by revenue and attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{event.name}</p>
                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {event.attendees} attendees
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-green-600">₹{event.revenue.toLocaleString()}</p>
                  <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'ticket' ? 'bg-green-100 text-green-600' :
                  activity.type === 'event' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {activity.type === 'user' && <Users className="h-4 w-4" />}
                  {activity.type === 'ticket' && <Ticket className="h-4 w-4" />}
                  {activity.type === 'event' && <Calendar className="h-4 w-4" />}
                  {activity.type === 'verification' && <CheckCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessAnalytics;