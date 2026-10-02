import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, Ticket, DollarSign, Image, User, Save } from "lucide-react";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";
import EventNotifyFields from "./EventNotifyFields";
import { notifyPayload } from "@/lib/eventNotify";
import type { EventNotify } from "@/hooks/useApiIntegration";

// Edits stay silent unless the admin chooses to tell ticket holders.
const DEFAULT_NOTIFY: EventNotify = { send: false };

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
  eventData: any; // The event to edit
}

// Event interface matching backend schema
interface EventFormData {
  eventId?: string;
  name: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  totalTickets: number;
  ticketPrice: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  organiserId: string;
  coverImage?: string;
}

const EditEventModal = ({ isOpen, onClose, onEventUpdated, eventData }: EditEventModalProps) => {
  const api = useApiContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState<EventNotify>(DEFAULT_NOTIFY);

  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    totalTickets: 0,
    ticketPrice: 0,
    status: "upcoming",
    organiserId: "",
    coverImage: ""
  });

  // Initialize form data when modal opens with event data
  useEffect(() => {
    if (isOpen && eventData) {
      console.log('📝 Initializing edit form with event data:', eventData);
      
      // Convert date format if needed
      let dateStr = eventData.date || '';
      if (dateStr) {
        try {
          // Handle different date formats
          const date = new Date(dateStr);
          dateStr = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        } catch (e) {
          console.warn('Date parsing failed, using original:', dateStr);
        }
      }

      setNotify(DEFAULT_NOTIFY);
      setFormData({
        eventId: eventData.eventId || eventData._id || eventData.id,
        name: eventData.name || "",
        description: eventData.description || "",
        location: eventData.location || "",
        date: dateStr,
        startTime: eventData.startTime || "",
        endTime: eventData.endTime || "",
        totalTickets: Number(eventData.totalTickets) || 0,
        ticketPrice: Number(eventData.ticketPrice) || 0,
        status: eventData.status || "upcoming",
        organiserId: eventData.organiserId || eventData.organizer || "",
        coverImage: eventData.coverImage || ""
      });
    }
  }, [isOpen, eventData]);

  // Fetch organizers when modal opens
  useEffect(() => {
    if (isOpen && (!api.organizers || api.organizers.length === 0) && !api.loading?.organizers) {
      console.log('🔄 Fetching organizers for event editing...');
      api.fetchOrganizers();
    }
  }, [isOpen, api.organizers, api.loading?.organizers, api.fetchOrganizers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.location || !formData.date || 
          !formData.startTime || !formData.endTime || !formData.organiserId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields including organizer selection",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Updating event with data:', formData);

      // Prepare event data for API - map organiserId to organizer for backend
      const updateData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: new Date(formData.date).toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalTickets: Number(formData.totalTickets),
        ticketPrice: Number(formData.ticketPrice),
        status: formData.status,
        organizer: formData.organiserId, // Backend expects 'organizer' field
        coverImage: formData.coverImage,
        notify: notifyPayload(notify)
      };

      console.log('📤 Sending update data to backend:', updateData);

      const eventId = formData.eventId || eventData?.eventId || eventData?._id || eventData?.id;
      if (!eventId) {
        throw new Error('Event ID not found');
      }

      const response = await api.updateEvent(eventId, updateData);
      console.log('✅ Event updated successfully:', response);

      const { notifiedTicketHolders, notificationFailed } =
        (response as { data?: { notifiedTicketHolders?: number; notificationFailed?: boolean } })?.data || {};
      if (notificationFailed) {
        toast({
          title: "Event updated",
          description: "The changes were saved, but the notification to ticket holders could not be sent.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: typeof notifiedTicketHolders === "number"
            ? `Event updated and ${notifiedTicketHolders} ticket holder${notifiedTicketHolders === 1 ? "" : "s"} notified`
            : "Event updated successfully",
        });
      }
      
      // Callback to refresh events list
      if (onEventUpdated) {
        onEventUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      // Check for specific organizer-related errors
      if (errorMessage.includes('organizer') || errorMessage.includes('Organizer')) {
        errorMessage = `Organizer selection error: ${errorMessage}. Please ensure you've selected a valid organizer.`;
      }
      
      toast({
        title: "Error Updating Event",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl gradient-text">
            <Save className="h-6 w-6" />
            <span>Edit Event</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the event details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event ID (Display Only) */}
            <div className="space-y-2">
              <Label htmlFor="eventId" className="flex items-center space-x-2">
                <Ticket className="h-4 w-4" />
                <span>Event ID</span>
              </Label>
              <Input
                id="eventId"
                value={formData.eventId || ""}
                placeholder="Event ID"
                className="glass-input"
                disabled
              />
            </div>

            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Summer Music Festival"
                className="glass-input"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location *</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Central Park, New York"
                className="glass-input"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date *</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Start Time *</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>End Time *</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* Total Tickets */}
            <div className="space-y-2">
              <Label htmlFor="totalTickets" className="flex items-center space-x-2">
                <Ticket className="h-4 w-4" />
                <span>Total Tickets *</span>
              </Label>
              <Input
                id="totalTickets"
                type="number"
                min="1"
                value={formData.totalTickets}
                onChange={(e) => handleInputChange("totalTickets", parseInt(e.target.value) || 0)}
                placeholder="1000"
                className="glass-input"
                required
              />
            </div>

            {/* Ticket Price */}
            <div className="space-y-2">
              <Label htmlFor="ticketPrice" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Ticket Price ($) *</span>
              </Label>
              <Input
                id="ticketPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.ticketPrice}
                onChange={(e) => handleInputChange("ticketPrice", parseFloat(e.target.value) || 0)}
                placeholder="50.00"
                className="glass-input"
                required
              />
            </div>

            {/* Event Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Event Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organiser Selection */}
            <div className="space-y-2">
              <Label htmlFor="organiserId" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Organiser *</span>
              </Label>
              <div className="flex space-x-2">
                <Select 
                  value={formData.organiserId} 
                  onValueChange={(value) => handleInputChange("organiserId", value)}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select an organiser" />
                  </SelectTrigger>
                  <SelectContent>
                    {api.loading?.organizers ? (
                      <SelectItem value="" disabled>Loading organizers...</SelectItem>
                    ) : api.organizers && api.organizers.length > 0 ? (
                      api.organizers
                        .filter(org => org.status === 'active') // Only show active organizers
                        .map((organizer: any) => {
                          const organizerId = organizer._id || organizer.organiserId;
                          return (
                            <SelectItem key={organizerId} value={organizerId}>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{organizer.name}</span>
                                <span className="text-xs text-gray-500">({organizer.email})</span>
                              </div>
                            </SelectItem>
                          );
                        })
                    ) : (
                      <SelectItem value="" disabled>No active organizers found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(api.organizers && api.organizers.length === 0) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => api.fetchOrganizers()}
                    disabled={api.loading?.organizers}
                    className="hover-glow"
                  >
                    {api.loading?.organizers ? 'Loading...' : 'Refresh'}
                  </Button>
                )}
              </div>
              {api.organizers && api.organizers.length === 0 && !api.loading?.organizers && (
                <div className="text-xs text-gray-500 mt-1 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p>No organizers available. Please create an organizer first.</p>
                  <p className="mt-1">
                    Go to <strong>Organisers</strong> tab to add a new organizer.
                  </p>
                </div>
              )}
            </div>

            {/* Cover Image URL */}
            <div className="space-y-2">
              <Label htmlFor="coverImage" className="flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span>Cover Image URL</span>
              </Label>
              <Input
                id="coverImage"
                value={formData.coverImage || ""}
                onChange={(e) => handleInputChange("coverImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="glass-input"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your event..."
              className="glass-input min-h-[100px]"
              rows={4}
            />
          </div>

          <EventNotifyFields
            id="edit-notify"
            value={notify}
            onChange={setNotify}
            label="Notify ticket holders about this change"
            hint="Leave off for small fixes. When on, everyone with a confirmed ticket gets a push when you save."
            bodyLabel="What changed? (optional)"
            titlePlaceholder="📝 Event Updated"
            bodyPlaceholder="e.g. The venue has moved to Hall B"
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              className="hover-glow"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary hover-glow"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
