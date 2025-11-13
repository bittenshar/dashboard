import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MessageSquare, Send, X, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { feedbackService } from "@/services/feedbackService";
import { eventsService } from "@/services/eventsService";
import { buildUrl } from "@/constants/api/config";

interface Event {
  id: string;
  title: string;
  date: string;
}

interface FeedbackFormData {
  event: string;
  rating: number;
  category: string;
  subject: string;
  message: string;
}

const UserFeedbackSubmission = () => {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [formData, setFormData] = useState<FeedbackFormData>({
    event: '',
    rating: 0,
    category: '',
    subject: '',
    message: '',
  });
  
  // Test API connectivity
  const checkApiConnection = async () => {
    try {
      const response = await fetch(buildUrl('/health-check'), { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('API connection successful');
        setApiStatus('connected');
        return true;
      } else {
        console.error('API connection failed:', response.status);
        setApiStatus('disconnected');
        return false;
      }
    } catch (error) {
      console.error('API connection error:', error);
      setApiStatus('disconnected');
      return false;
    }
  };

  // Check API and fetch events
  useEffect(() => {
    const initializeData = async () => {
      // First check API connectivity
      const isConnected = await checkApiConnection();
      
      if (!isConnected) {
        console.warn('API is not available, using mock events');
        setEvents([
          { id: '1', title: 'Thrillathon Music Festival 2024', date: '2024-01-20' },
          { id: '2', title: 'Tech Conference 2024', date: '2024-01-15' },
          { id: '3', title: 'Food & Music Fest', date: '2024-01-10' },
        ]);
        return;
      }
      
      // If API is connected, fetch events
      try {
        const token = getToken();
        if (!token) {
          console.warn('No token found, using mock events');
          setEvents([
            { id: '1', title: 'Thrillathon Music Festival 2024', date: '2024-01-20' },
            { id: '2', title: 'Tech Conference 2024', date: '2024-01-15' },
            { id: '3', title: 'Food & Music Fest', date: '2024-01-10' },
          ]);
          return;
        }

        console.log('Fetching events from API...');
        const response = await eventsService.getAllEvents(token);
        console.log('Events API response:', response);
        
        if (response && (response.status === 'success' || response.events)) {
          const events = response.data?.events || response.events || [];
          console.log('Raw events data:', events);
          
          const transformedEvents = events.map((event: any) => ({
            id: event._id || event.id,
            title: event.title || event.name,
            date: new Date(event.date || event.createdAt || new Date()).toISOString().split('T')[0],
          }));
          
          console.log('Transformed events:', transformedEvents);
          setEvents(transformedEvents);
        } else {
          throw new Error('Failed to fetch events or invalid response format');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Could not load events",
          description: "Using sample events instead. You can still submit feedback.",
          variant: "destructive",
        });
        // Fallback to mock data
        setEvents([
          { id: '1', title: 'Thrillathon Music Festival 2024', date: '2024-01-20' },
          { id: '2', title: 'Tech Conference 2024', date: '2024-01-15' },
          { id: '3', title: 'Food & Music Fest', date: '2024-01-10' },
        ]);
      }
    };

    initializeData();
  }, []);

  const feedbackCategories = [
    { value: 'overall', label: 'Overall Experience', icon: Heart },
    { value: 'security', label: 'Security & Verification', icon: ThumbsUp },
    { value: 'organization', label: 'Event Organization', icon: ThumbsUp },
    { value: 'venue', label: 'Venue & Facilities', icon: ThumbsUp },
    { value: 'performance', label: 'Performance/Content', icon: ThumbsUp },
    { value: 'technical', label: 'Technical Issues', icon: ThumbsDown },
  ];

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-8 w-8 cursor-pointer transition-all duration-200 hover:scale-110 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                : 'text-gray-300 hover:text-yellow-200'
            }`}
            onClick={() => onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.event || !formData.rating || !formData.category || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log('Submitting feedback to API:', {
        event: formData.event,
        rating: formData.rating,
        category: formData.category,
      });

      const response = await feedbackService.createFeedback(
        {
          user: user.id,
          event: formData.event,
          rating: formData.rating,
          category: formData.category,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        },
        token
      );

      console.log('Feedback API response:', response);

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We appreciate your input.",
      });

      // Reset form
      setFormData({
        event: '',
        rating: 0,
        category: '',
        subject: '',
        message: '',
      });
      setIsOpen(false);

    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <MessageSquare className="h-4 w-4" />
            Submit Feedback
          </Button>
          {apiStatus !== 'unknown' && (
            <div 
              className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={apiStatus === 'connected' ? 'API Connected' : 'API Disconnected'}
            />
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Share Your Experience
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Help us improve by sharing your feedback about the event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-3">
            <Label htmlFor="event" className="text-sm font-semibold text-gray-700">Select Event *</Label>
            <Select value={formData.event} onValueChange={(value) => setFormData(prev => ({ ...prev, event: value }))}>
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 transition-colors">
                <SelectValue placeholder="Choose an event to review" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-sm text-gray-500">{event.date}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700 text-center block">How would you rate your experience? *</Label>
            <div className="flex flex-col items-center gap-3">
              {renderStars(formData.rating, (rating) => setFormData(prev => ({ ...prev, rating })))}
              <span className="text-sm text-gray-600 font-medium">
                {formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''}` : 'Click to rate'}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Feedback Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 transition-colors">
                <SelectValue placeholder="What aspect would you like to review?" />
              </SelectTrigger>
              <SelectContent>
                {feedbackCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value} className="py-3">
                    <div className="flex items-center gap-3">
                      <category.icon className="h-4 w-4 text-purple-500" />
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-3">
            <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Brief Summary *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="What's the main point of your feedback?"
              maxLength={100}
              className="h-12 border-2 border-gray-200 focus:border-purple-500 transition-colors"
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.subject.length}/100 characters
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <Label htmlFor="message" className="text-sm font-semibold text-gray-700">Detailed Feedback *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Share your detailed experience, suggestions for improvement, or any issues you encountered..."
              rows={5}
              maxLength={1000}
              className="border-2 border-gray-200 focus:border-purple-500 transition-colors resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.message.length}/1000 characters
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="h-12 px-8 border-2 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFeedbackSubmission;
