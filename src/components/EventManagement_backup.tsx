import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, MapPin, CreditCard, Mail, Phone, Plus, Eye, Edit, Trash } from "lucide-react";
import EventAnalytics from                        View Analytics
                      </Button>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          console.log('Edit event:', selectedEvent);
                        }} className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(selectedEvent);
                        }} className="text-red-600 flex-1">
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Event Attendees */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>Event Attendees</span>
                          <Badge variant="secondary" className="ml-2">
                            {attendees.length} registered
                          </Badge>
                        </CardTitle>
                        <CardDescription>Verified ticket holders</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`relative border-2 rounded-full overflow-hidden w-8 h-8 ${
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
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{attendee.name}</p>
                              <p className="text-xs text-gray-500">{attendee.ticketId}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {attendee.verificationStatus === 'verified' && (
                              <Badge className="bg-green-100 text-green-800 text-xs px-1">✓</Badge>
                            )}
                            {attendee.checkedIn && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs px-1">📍</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {attendees.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <h3 className="text-sm font-medium text-gray-600 mb-1">No attendees yet</h3>
                          <p className="text-xs">Attendees will appear here once they register.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </div>
      </div>
    )}

      {/* Empty State */}s";
import CreateEventModal from "./CreateEventModal";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
 
const EventManagement = () => {
  const api = useApiContext();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
          verificationStatus: registration.faceVerificationStatus || 'pending',
          checkedIn: !!registration.checkInTime,
          photo: user?.avatar || user?.uploadedPhoto || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          registrationDate: registration.registrationDate,
          status: registration.status
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

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteEvent(eventId);
        if (selectedEvent === eventId) {
          setSelectedEvent("");
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
          {/* Debug info */}
          <p className="text-sm text-gray-500 mt-1">Selected Event: {selectedEvent || 'None'}</p>
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

      {/* Error State */}
      {api.errors.events && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Error loading events: {api.errors.events}</p>
            <Button onClick={() => api.fetchEvents()} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Layout - Events Grid Full Width */}
      <div className="h-[calc(100vh-400px)]">
        {/* Events in 3-column grid with scrolling */}
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
                
                // Debug log to see the actual event structure
                if (index === 0) {
                  console.log('First event object structure:', event);
                  console.log('Available event ID options:', {
                    eventId: event.eventId,
                    _id: (event as any)._id,
                    id: (event as any).id,
                    finalId: eventId
                  });
                }

                return (
                  <Card 
                    key={eventId}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedEvent === eventId ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
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

      {/* Animated Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => {
              setShowEventModal(false);
              setSelectedEvent("");
            }}
          />
          
          {/* Modal Panel - Slides in from right */}
          <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            showEventModal ? 'translate-x-0' : 'translate-x-full'
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
                <div className="p-6 space-y-6">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowEventModal(false);
                        setSelectedEvent("");
                      }}
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Event Statistics */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Event Statistics</CardTitle>
                          <CardDescription className="font-medium">{currentEvent.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tickets Sold</span>
                          <span className="font-bold text-lg text-blue-600">{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3 bg-gray-200" />
                        <div className="text-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-semibold text-gray-900">{soldTickets}</span> of{' '}
                          <span className="font-semibold text-gray-900">{totalTickets}</span> tickets sold
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
                          <div className="text-xl font-bold text-green-700">
                            {formatCurrency(revenue)}
                          </div>
                          <div className="text-xs text-green-600 font-medium">Total Revenue</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200">
                          <div className="text-xl font-bold text-blue-700">{checkedInCount}</div>
                          <div className="text-xs text-blue-600 font-medium">Checked In</div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                          onClick={handleViewAnalytics}
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Analytics
                        </Button>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            console.log('Edit event:', selectedEvent);
                          }} className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(selectedEvent);
                          }} className="text-red-600 flex-1">
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Event Attendees */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>Event Attendees</span>
                            <Badge variant="secondary" className="ml-2">
                              {attendees.length} registered
                            </Badge>
                          </CardTitle>
                          <CardDescription>Verified ticket holders</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`relative border-2 rounded-full overflow-hidden w-8 h-8 ${
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
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{attendee.name}</p>
                                <p className="text-xs text-gray-500">{attendee.ticketId}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {attendee.verificationStatus === 'verified' && (
                                <Badge className="bg-green-100 text-green-800 text-xs px-1">✓</Badge>
                              )}
                              {attendee.checkedIn && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs px-1">📍</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {attendees.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <h3 className="text-sm font-medium text-gray-600 mb-1">No attendees yet</h3>
                            <p className="text-xs">Attendees will appear here once they register.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        </div>
      )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Event Statistics</CardTitle>
                        <CardDescription className="font-medium">{currentEvent.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tickets Sold</span>
                        <span className="font-bold text-lg text-blue-600">{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3 bg-gray-200" />
                      <div className="text-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-semibold text-gray-900">{soldTickets}</span> of{' '}
                        <span className="font-semibold text-gray-900">{totalTickets}</span> tickets sold
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(revenue)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Total Revenue</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200">
                        <div className="text-xl font-bold text-blue-700">{checkedInCount}</div>
                        <div className="text-xs text-blue-600 font-medium">Checked In</div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setShowAnalytics(true);
                      }}>
                        <Eye className="h-4 w-4 mr-1" /> Analytics
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit event:', selectedEvent);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(selectedEvent);
                      }} className="text-red-600">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                        onClick={handleViewAnalytics}
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Notify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
          // The modal handles event creation internally,
          // this is just a callback to refresh the events list
          api.fetchEvents();
        }}
      />
    </div>
  );
};

export default EventManagement;