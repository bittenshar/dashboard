
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  CreditCard, 
  Clock,
  MapPin,
  Target,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useApiContext } from "@/contexts/ApiIntegrationContext";

interface EventAnalyticsProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

interface AnalyticsData {
  totalRevenue: number;
  ticketsSold: number;
  conversionRate: number;
  avgTicketPrice: number;
  salesData: Array<{
    date: string;
    tickets: number;
    revenue: number;
    day: string;
  }>;
  hourlyData: Array<{
    hour: string;
    sales: number;
  }>;
  demographicsData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  locationData: Array<{
    city: string;
    attendees: number;
    percentage: number;
  }>;
  checkInRate: number;
  noShowRate: number;
  satisfactionScore: number;
}

const EventAnalytics = ({ eventId, eventName, onClose }: EventAnalyticsProps) => {
  const api = useApiContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data for the specific event
  useEffect(() => {
    const fetchEventAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get event details
        const eventsArray = Array.isArray(api.events) ? api.events : [];
        const currentEvent = eventsArray.find((e, index) => {
          const eventId = e.eventId || (e as any)._id || (e as any).id || `event-${index}`;
          return eventId === eventId;
        });

        if (!currentEvent) {
          throw new Error('Event not found');
        }

        // Get registrations for this event
        const eventRegistrations = api.registrations?.filter(
          registration => registration.eventId === eventId
        ) || [];

        // Get users for these registrations
        const registeredUsers = eventRegistrations.map(registration => {
          const user = api.users?.find(u => 
            (u._id || u.id) === registration.userId
          );
          return { registration, user };
        }).filter(item => item.user);

        // Calculate analytics data
        const totalTickets = currentEvent.totalTickets || 0;
        const ticketsSold = eventRegistrations.length;
        const ticketPrice = currentEvent.ticketPrice || 0;
        const totalRevenue = ticketsSold * ticketPrice;
        const conversionRate = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;
        const avgTicketPrice = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;

        // Calculate check-in rate
        const checkedInCount = eventRegistrations.filter(r => 
          (r as any).checkInStatus || r.checkInTime
        ).length;
        const checkInRate = ticketsSold > 0 ? (checkedInCount / ticketsSold) * 100 : 0;
        const noShowRate = 100 - checkInRate;

        // Generate sales data (last 7 days)
        const salesData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dayTickets = Math.floor(Math.random() * 50) + 10; // Mock data
          return {
            date: date.toISOString().split('T')[0],
            tickets: dayTickets,
            revenue: dayTickets * ticketPrice,
            day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
        });

        // Generate hourly data
        const hourlyData = Array.from({ length: 8 }, (_, i) => ({
          hour: `${String(i * 3).padStart(2, '0')}:00`,
          sales: Math.floor(Math.random() * 30) + 5
        }));

        // Generate demographics data
        const demographicsData = [
          { name: "18-24", value: Math.floor(Math.random() * 200) + 50, fill: "#8884d8" },
          { name: "25-34", value: Math.floor(Math.random() * 300) + 100, fill: "#82ca9d" },
          { name: "35-44", value: Math.floor(Math.random() * 150) + 50, fill: "#ffc658" },
          { name: "45-54", value: Math.floor(Math.random() * 100) + 30, fill: "#ff7300" },
          { name: "55+", value: Math.floor(Math.random() * 50) + 10, fill: "#8dd1e1" },
        ];

        // Generate location data
        const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Others"];
        const locationData = cities.map((city, index) => ({
          city,
          attendees: Math.floor(Math.random() * 200) + 50,
          percentage: Math.floor(Math.random() * 30) + 10
        }));

        const analytics: AnalyticsData = {
          totalRevenue,
          ticketsSold,
          conversionRate,
          avgTicketPrice,
          salesData,
          hourlyData,
          demographicsData,
          locationData,
          checkInRate,
          noShowRate,
          satisfactionScore: 4.7
        };

        setAnalyticsData(analytics);
      } catch (err) {
        console.error('Failed to fetch event analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAnalytics();
  }, [eventId, api.events, api.registrations, api.users]);

  const chartConfig = {
    tickets: {
      label: "Tickets",
      color: "#3b82f6",
    },
    revenue: {
      label: "Revenue (₹)",
      color: "#10b981",
    },
    sales: {
      label: "Sales",
      color: "#8b5cf6",
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading analytics</div>
          <div className="text-sm text-gray-600">{error}</div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          No analytics data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onClose} className="h-10 w-10 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Event Analytics</h2>
            <p className="text-gray-600">{eventName}</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
          <Target className="h-4 w-4 mr-2" />
          Live Analytics
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(analyticsData.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Tickets Sold</p>
                <p className="text-2xl font-bold text-green-900">{analyticsData.ticketsSold}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.2%</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-900">{analyticsData.conversionRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg. Ticket Price</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(analyticsData.avgTicketPrice)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+5.0%</span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <AreaChart data={analyticsData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Sales</CardTitle>
                <CardDescription>Daily ticket sales progression</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={analyticsData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="tickets" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Sales Pattern</CardTitle>
                <CardDescription>Sales distribution throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={analyticsData.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="#8b5cf6" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Velocity</CardTitle>
                <CardDescription>Rate of ticket sales over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Peak Sales Hour</span>
                  <Badge>18:00 - 19:00</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Sales/Hour</span>
                  <Badge variant="outline">58 tickets</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Best Sales Day</span>
                  <Badge className="bg-green-100 text-green-800">Saturday</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sales Velocity</span>
                  <Badge className="bg-blue-100 text-blue-800">+15.3%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Attendee age groups breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={analyticsData.demographicsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.demographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Attendees by city</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.locationData.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{location.city}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${location.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {location.attendees}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{analyticsData.checkInRate.toFixed(1)}%</div>
                <p className="text-sm text-gray-600">of ticket holders checked in</p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: `${analyticsData.checkInRate}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>No-show Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{analyticsData.noShowRate.toFixed(1)}%</div>
                <p className="text-sm text-gray-600">tickets not used</p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-red-600 h-3 rounded-full" style={{ width: `${analyticsData.noShowRate}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{analyticsData.satisfactionScore}/5</div>
                <p className="text-sm text-gray-600">average rating</p>
                <div className="mt-4 flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div 
                      key={star} 
                      className={`h-4 w-4 ${star <= Math.floor(analyticsData.satisfactionScore) ? 'bg-yellow-400' : 'bg-gray-300'} rounded-sm`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventAnalytics;
