import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, Globe, MapPin, Calendar, DollarSign, Plus, Edit, Trash, Eye, Briefcase, User, TrendingUp, Activity, Search, Filter, Trash2 } from "lucide-react";
import CreateOrganiserModal from "./CreateOrganiserModal";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";

const OrganiserManagement = () => {
  const api = useApiContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filteredOrganizers, setFilteredOrganizers] = useState(api.organizers || []);

  // Fetch organizers when component mounts
  useEffect(() => {
    console.log('🔄 OrganiserManagement: Fetching organizers on mount...');
    console.log('🔐 Current auth status:', {
      token: !!localStorage.getItem('authToken'),
      user: !!localStorage.getItem('admin_user')
    });
    api.fetchOrganizers();
  }, []); // Empty dependency array to run only once on mount

  // Update filtered organizers when API data changes or filters change
  useEffect(() => {
    let filtered = api.organizers || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(organizer => 
        organizer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(organizer => organizer.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "revenue":
          return (b.totalRevenue || 0) - (a.totalRevenue || 0);
        case "events":
          return (b.totalEvents || 0) - (a.totalEvents || 0);
        case "joinDate":
          // Fallback to name sort since joinDate/createdAt not available
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredOrganizers(filtered);
  }, [api.organizers, searchTerm, statusFilter, sortBy]);

  const handleCreateOrganizer = async (organizerData: any) => {
    try {
      await api.createOrganizer(organizerData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create organizer:', error);
    }
  };

  const handleUpdateOrganizer = async (organizerId: string, updateData: any) => {
    try {
      await api.updateOrganizer(organizerId, updateData);
    } catch (error) {
      console.error('Failed to update organizer:', error);
    }
  };

  const handleDeleteOrganizer = async (organizerId: string, name: string) => {
    if (window.confirm(`Delete ${name}? This can't be undone.`)) {
      try {
        await api.deleteOrganizer(organizerId);
        toast({ title: "Organiser deleted", description: name });
      } catch (error) {
        console.error('Failed to delete organizer:', error);
        toast({
          title: "Couldn't delete organiser",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Calculate total stats
  const totalStats = {
    totalOrganisers: api.organizers?.length || 0,
    activeOrganisers: api.organizers?.filter(o => o.status === 'active').length || 0,
    totalRevenue: api.organizers?.reduce((sum, o) => sum + (o.totalRevenue || 0), 0) || 0,
    totalEvents: api.organizers?.reduce((sum, o) => sum + (o.totalEvents || 0), 0) || 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-red-700 to-red-900 bg-clip-text text-transparent">
            Organiser Management
          </h1>
          <p className="text-gray-600 mt-1">Manage event organisers and their details</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Organiser
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4 text-center">
            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <div className="text-2xl font-bold">{totalStats.totalOrganisers}</div>
            <div className="text-xs opacity-90">Total Organisers</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <div className="text-2xl font-bold">{totalStats.activeOrganisers}</div>
            <div className="text-xs opacity-90">Active Organisers</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <div className="text-2xl font-bold">{totalStats.totalEvents}</div>
            <div className="text-xs opacity-90">Total Events</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-90" />
            <div className="text-2xl font-bold">₹{(totalStats.totalRevenue / 100000).toFixed(1)}L</div>
            <div className="text-xs opacity-90">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Organisers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search organisers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="joinDate">Join Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {api.loading.organizers && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {api.errors.organizers && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600">Error loading organizers: {api.errors.organizers}</p>
                <Button onClick={() => api.fetchOrganizers()} className="mt-2">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Organisers List */}
          <div className="space-y-4">
            {!api.loading.organizers && filteredOrganizers.map((organizer) => {
              const organizerId = organizer._id || organizer.organiserId;
              return (
                <Card key={organizerId} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{organizer.name}</h3>
                            <p className="text-sm text-gray-600">ID: {organizerId}</p>
                          </div>
                          <Badge className={`ml-auto ${getStatusColor(organizer.status || 'active')}`}>
                            {organizer.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{organizer.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{organizer.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{organizer.address}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{organizer.totalEvents || 0}</div>
                            <div className="text-xs text-blue-600">Total Events</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">{organizer.activeEvents || 0}</div>
                            <div className="text-xs text-green-600">Active Events</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">₹{((organizer.totalRevenue || 0) / 1000).toFixed(0)}K</div>
                            <div className="text-xs text-purple-600">Revenue</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteOrganizer(organizerId, organizer.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {!api.loading.organizers && filteredOrganizers.length === 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No organizers found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "No organizers have been added yet"
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setShowCreateModal(true)} className="gradient-primary text-white border-none hover-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Organizer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Active Organisers</CardTitle>
              <CardDescription>Currently active organisers with ongoing events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrganizers.filter(o => o.status === 'active').map((organizer) => {
                  const organizerId = organizer._id || organizer.organiserId;
                  return (
                    <div key={organizerId} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{organizer.name}</p>
                          <p className="text-sm text-gray-600">{organizer.activeEvents || 0} active events</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Organiser Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Top Performers</h4>
                  {filteredOrganizers
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .slice(0, 3)
                    .map((organizer, index) => {
                      const organizerId = organizer._id || organizer.organiserId;
                      return (
                        <div key={organizerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="font-medium">{organizer.name}</span>
                          </div>
                          <span className="text-sm font-medium">₹{((organizer.totalRevenue || 0) / 1000).toFixed(0)}K</span>
                        </div>
                      );
                    })}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Activity</h4>
                  {filteredOrganizers.map((organizer) => {
                    const organizerId = organizer._id || organizer.organiserId;
                    return (
                      <div key={organizerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{organizer.name}</span>
                        <span className="text-xs text-gray-600">Recent</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Organiser Settings</CardTitle>
              <CardDescription>Configure organiser permissions and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Default Permissions</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Create Events</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Manage Tickets</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Access Analytics</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Manage Users</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Notification Settings</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Event updates</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Revenue reports</span>
                    </label>
                  </div>
                </div>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Organiser Modal */}
      <CreateOrganiserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default OrganiserManagement;
