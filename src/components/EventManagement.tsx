import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, MapPin, CreditCard, Mail, Phone, Plus, Eye, Edit, Trash, X } from "lucide-react";
import EventAnalytics from "./EventAnalytics";
import CreateEventModal from "./CreateEventModal";
import EditEventModal from "./EditEventModal";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
 
const EventManagement = () => {
  const api = useApiContext();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
   

  // Update filtered events when API data changes or filters change
  useEffect(() => {
    // Defensive array check to prevent runtime errors
    const eventsArray = Array.isArray(api.events) ? api.events : [];
    let filtered = eventsArray;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  }, [api.events, searchTerm, statusFilter]);

  // Load attendees when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      // Filter registrations for the selected event to get attendees
      const eventAttendees = api.registrations?.filter(
        registration => registration.eventId === selectedEvent
      ) || [];
      
      // Transform registrations to attendee format
      const transformedAttendees = eventAttendees.map(registration => {
        // Find the user data for this registration
        const user = api.users?.find(u => u._id === registration.userId || u.id === registration.userId);
        
        return {
          id: registration.registrationId,
          name: user?.fullName || user?.FullName || `User ${registration.userId}`,
          email: user?.email || '',
          phone: user?.phone || '',
          ticketId: registration.registrationId,
          faceId: user?.faceId || registration.userId,
          verificationStatus: user?.verificationStatus || 'pending',
          checkedIn: (registration as any).checkInStatus || false,
          photo: user?.avatar || user?.uploadedPhoto || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          registrationDate: registration.registrationDate,
          status: user?.status || 'active'
        };
      });
      
      setAttendees(transformedAttendees);
    } else {
      setAttendees([]);
    }
  }, [selectedEvent, api.registrations, api.users]);

  const handleUpdateEvent = async (eventId: string, updateData: any) => {
    try {
      await api.updateEvent(eventId, updateData);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleEditEvent = (event: any) => {
    console.log('📝 Opening edit modal for event:', event);
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleEditEventClose = () => {
    setShowEditModal(false);
    setEditingEvent(null);
  };

  const handleEventUpdated = () => {
    // Refresh events list after update
    api.fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteEvent(eventId);
        if (selectedEvent === eventId) {
          setSelectedEvent("");
          setShowEventModal(false);
        }
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "live":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateProgress = (soldTickets: number, totalTickets: number) => {
    if (!totalTickets) return 0;
    return Math.min((soldTickets / totalTickets) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleViewAnalytics = () => {
    if (selectedEvent) {
      setShowAnalytics(true);
    }
  };

  const handleCloseAnalytics = () => {
    setShowAnalytics(false);
  };

  const checkedInCount = attendees.filter(a => a.checkedIn).length;

  // Show analytics if requested
  if (showAnalytics && selectedEvent) {
    const eventsArray = Array.isArray(api.events) ? api.events : [];
    const currentEvent = eventsArray.find((e, index) => {
      const eventId = e.eventId || (e as any)._id || (e as any).id || `event-${index}`;
      return eventId === selectedEvent;
    });
    if (currentEvent) {
      const eventId = currentEvent.eventId || (currentEvent as any)._id || (currentEvent as any).id || selectedEvent;
      return (
        <EventAnalytics 
          eventId={eventId}
          eventName={currentEvent.name}
          onClose={handleCloseAnalytics}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
          <p className="text-gray-600">Manage events and track ticket sales with facial recognition</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search events by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {api.loading.events && (
        <div className="text-center py-8">
          <div className="animate-pulse">Loading events...</div>
        </div>
      )}

      {/* Error handling is done through try-catch in individual operations */}

      {/* Main Layout - Events Grid Full Width */}
      <div className="h-[calc(100vh-400px)]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">All Events</h2>
            <Badge variant="outline">{filteredEvents.length} events</Badge>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 pl-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4">
              {filteredEvents.map((event, index) => {
                const soldTickets = event.ticketsSold || 0;
                const totalTickets = event.totalTickets || 0;
                const progress = calculateProgress(soldTickets, totalTickets);
                const revenue = soldTickets * (event.ticketPrice || 0);
                
                // Use multiple fallbacks for event ID
                const eventId = event.eventId || (event as any)._id || (event as any).id || `event-${index}`;

                return (
                  <Card 
                    key={eventId}
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onClick={() => {
                      console.log('Selecting event:', eventId);
                      setSelectedEvent(eventId);
                      setShowEventModal(true);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{event.name}</CardTitle>
                        {getStatusBadge(event.status)}
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                          <span className="font-medium">
                            {new Date(event.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1 text-green-500" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Tickets</span>
                          <span className="font-medium text-gray-900">{soldTickets}/{totalTickets}</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(revenue)}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(event.ticketPrice || 0)}</p>
                          <p className="text-xs text-gray-500">Per ticket</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Simple backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => {
              setShowEventModal(false);
              setSelectedEvent("");
            }}
          />
          
          {/* Clean Modal Panel */}
          <div className={`relative w-full max-w-4xl max-h-[90vh] bg-white shadow-xl rounded-lg transform transition-all duration-300 ease-out overflow-hidden ${
            showEventModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            {(() => {
              const eventsArray = Array.isArray(api.events) ? api.events : [];
              const currentEvent = eventsArray.find((e, index) => {
                const eventId = e.eventId || (e as any)._id || (e as any).id || `event-${index}`;
                return eventId === selectedEvent;
              });
              
              if (!currentEvent) return null;
              
              const soldTickets = currentEvent.ticketsSold || 0;
              const totalTickets = currentEvent.totalTickets || 0;
              const ticketPrice = currentEvent.ticketPrice || 0;
              const revenue = soldTickets * ticketPrice;
              const progressPercentage = calculateProgress(soldTickets, totalTickets);
              
              return (
                <div className="flex flex-col h-full">
                  {/* Clean Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{currentEvent.name}</h2>
                      <p className="text-gray-600 mt-1">Event Details</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
                      onClick={() => {
                        setShowEventModal(false);
                        setSelectedEvent("");
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Left Column - Event Info */}
                      <div className="space-y-6">
                        
                        {/* Event Statistics */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-orange-100 rounded-lg mr-3">
                              <Calendar className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Event Statistics</h3>
                              <p className="text-sm text-gray-600">{currentEvent.name}</p>
                            </div>
                          </div>
                          
                          {/* Tickets Progress */}
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Tickets Sold</span>
                              <span className="text-lg font-bold text-orange-600">{progressPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-center py-3 bg-orange-50 rounded-lg border border-orange-200">
                              <span className="font-bold text-xl text-gray-900">{soldTickets}</span>
                              <span className="text-sm text-gray-600">/{totalTickets} sold</span>
                            </div>
                          </div>

                          {/* Revenue and Check-in Stats */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-700 mb-1">
                                {formatCurrency(revenue)}
                              </div>
                              <div className="text-sm font-medium text-green-600">Revenue</div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="text-2xl font-bold text-blue-700 mb-1">{checkedInCount}</div>
                              <div className="text-sm font-medium text-blue-600">Checked In</div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <Button 
                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium" 
                            onClick={handleViewAnalytics}
                            size="lg"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              size="lg" 
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Edit event:', currentEvent);
                                handleEditEvent(currentEvent);
                              }} 
                              className="h-12 border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-700 hover:text-orange-700"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="lg" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(selectedEvent);
                              }} 
                              className="h-12 border-gray-300 hover:border-red-500 hover:bg-red-50 text-gray-700 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Attendees */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Attendees</h3>
                            <p className="text-sm text-gray-600">{attendees.length} verified ticket holders</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {attendees.map((attendee) => (
                            <div key={attendee.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className={`relative w-8 h-8 rounded-full overflow-hidden border-2 ${
                                  attendee.verificationStatus === 'verified' && attendee.checkedIn ? 'border-green-500' :
                                  attendee.verificationStatus === 'verified' ? 'border-blue-500' :
                                  'border-yellow-500'
                                }`}>
                                  <img 
                                    src={attendee.photo} 
                                    alt={attendee.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 text-sm truncate">{attendee.name}</p>
                                  <p className="text-xs text-gray-500 truncate">#{attendee.ticketId}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {attendee.verificationStatus === 'verified' && (
                                  <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">✓ Verified</Badge>
                                )}
                                {attendee.checkedIn && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">📍 Checked In</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {attendees.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                              <h3 className="text-sm font-medium text-gray-600 mb-1">No attendees yet</h3>
                              <p className="text-xs text-gray-500">Attendees will appear here once they register.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!api.loading.events && filteredEvents.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No events found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "No events have been created yet"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button 
                onClick={() => setShowCreateModal(true)} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={() => {
          // api.createEvent already refreshes the events list, no need to call again
          // This is just a callback to close the modal
        }}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={showEditModal}
        onClose={handleEditEventClose}
        onEventUpdated={handleEventUpdated}
        eventData={editingEvent}
      />
    </div>
  );
};

export default EventManagement;
