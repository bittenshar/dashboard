import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Star, Search, Filter, Eye, ThumbsUp, ThumbsDown, Calendar, User, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useAuth } from "@/contexts/AuthContext";
import { feedbackService } from "@/services/feedbackService";
import UserFeedbackSubmission from "./UserFeedbackSubmission";

const UserFeedbackSystem = () => {
  const api = useApiContext();
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Mock data to use as fallback
  const mockFeedbacks = [
    {
      id: 'mock-1',
      userId: 'user-123',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      userAvatar: '',
      eventId: 'evt-456',
      eventName: 'Summer Music Festival',
      rating: 5,
      category: 'event',
      subject: 'Amazing Experience',
      message: 'This was an incredible event! The organization was perfect.',
      date: '2025-09-01',
      status: 'new',
      helpful: 3,
      notHelpful: 0,
    },
    {
      id: 'mock-2',
      userId: 'user-456',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      userAvatar: '',
      eventId: 'evt-789',
      eventName: 'Tech Conference 2025',
      rating: 4,
      category: 'organization',
      subject: 'Well Organized Event',
      message: 'The speakers were great and the venue was excellent. Could use better Wi-Fi.',
      date: '2025-08-28',
      status: 'reviewed',
      helpful: 5,
      notHelpful: 1,
    },
    {
      id: 'mock-3',
      userId: 'user-789',
      userName: 'Alex Johnson',
      userEmail: 'alex@example.com',
      userAvatar: '',
      eventId: 'evt-456',
      eventName: 'Summer Music Festival',
      rating: 2,
      category: 'technical',
      subject: 'Sound Issues',
      message: 'The sound quality was poor in some areas of the venue.',
      date: '2025-09-02',
      status: 'new',
      helpful: 2,
      notHelpful: 0,
    }
  ];
  
  

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === "all" || feedback.rating.toString() === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const getRatingStars = (rating: number) => {
    const safeRating = rating || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={`star-${i}`} 
        className={`h-4 w-4 ${i < safeRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    if (!status) {
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    return status === "new" ? 
      <Badge className="bg-blue-100 text-blue-800">New</Badge> :
      <Badge className="bg-green-100 text-green-800">Reviewed</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    if (!category) {
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    
    const colors = {
      overall: "bg-purple-100 text-purple-800",
      security: "bg-green-100 text-green-800",
      technical: "bg-blue-100 text-blue-800",
      support: "bg-orange-100 text-orange-800",
      organization: "bg-yellow-100 text-yellow-800",
      venue: "bg-indigo-100 text-indigo-800",
      performance: "bg-pink-100 text-pink-800"
    };
    return <Badge className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>;
  };

  const handleMarkAsReviewed = (feedbackId: string) => {
    toast({
      title: "Feedback Updated",
      description: "Feedback marked as reviewed successfully.",
    });
  };

  const handleHelpfulVote = (feedbackId: string, isHelpful: boolean) => {
    toast({
      title: "Vote Recorded",
      description: `Feedback marked as ${isHelpful ? 'helpful' : 'not helpful'}.`,
    });
  };

  // Fetch feedback from API
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        console.warn('No authentication token found, using mock data');
        setFeedbacks(mockFeedbacks);
        setLoading(false);
        return;
      }

      console.log('Fetching feedback data from API...');
      const response = await feedbackService.getAllFeedback(token);
      console.log('API Response:', response);
      
      if (response && response.status === 'success' && response.data?.feedback) {
        // Transform backend data to match frontend format
        const transformedFeedbacks: any[] = [];
        
        // Handle the API response format:
        // {
        //   "status": "success",
        //   "results": 1,
        //   "data": {
        //     "feedback": [
        //       {
        //         "subject": "Event Feedback",
        //         "eventId": "evt_001",
        //         "notHelpful": 0,
        //         "helpful": 0,
        //         "rating": 5,
        //         "userId": "testuserid",
        //         "updatedAt": "2025-09-05T16:38:02.432Z",
        //         "status": "new",
        //         "category": "event",
        //         "createdAt": "2025-09-05T16:38:02.432Z",
        //         "message": "This was an amazing event!",
        //         "feedbackId": "fb_1757090282432"
        //       }
        //     ]
        //   }
        // }

        response.data.feedback.forEach((item: any) => {
          // Handling the new API format
          transformedFeedbacks.push({
            id: item.feedbackId || item._id,
            userId: item.userId,
            // If we don't have user details, use userId or fallback
            userName: item.userName || item.userId || 'Unknown User',
            userEmail: item.userEmail || '',
            userAvatar: item.userAvatar || '',
            eventId: item.eventId,
            // If we don't have event details, use eventId or fallback
            eventName: item.eventName || `Event ${item.eventId}` || 'Unknown Event',
            rating: item.rating || 0,
            category: item.category || 'unknown',
            subject: item.subject || 'No Subject',
            message: item.message || 'No feedback provided',
            date: new Date(item.createdAt || item.updatedAt).toISOString().split('T')[0],
            status: item.status || 'new',
            helpful: item.helpful || 0,
            notHelpful: item.notHelpful || 0,
          });
        });
        
        console.log('Transformed feedback data:', transformedFeedbacks);
        setFeedbacks(transformedFeedbacks);
      } else {
        console.warn('Failed to fetch feedback or invalid response format:', response);
        toast({
          title: "Invalid Data Format",
          description: "The API returned an unexpected data format. Using sample data instead.",
          variant: "destructive",
        });
        // Fallback to mock data
        setFeedbacks(mockFeedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load feedback. Using sample data instead.",
        variant: "destructive",
      });
      // Fallback to mock data on error
      setFeedbacks(mockFeedbacks);
    } finally {
      setLoading(false);
    }
  };

  // Load feedback on component mount
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Statistics
  const totalFeedbacks = feedbacks.length;
  const averageRating = totalFeedbacks > 0 ? feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / totalFeedbacks : 0;
  const newFeedbacks = feedbacks.filter(fb => fb.status === "new").length;
  const highRatingFeedbacks = feedbacks.filter(fb => (fb.rating || 0) >= 4).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">User Feedback System</h2>
          <p className="text-gray-600">Monitor and manage individual user feedback from mobile app</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchFeedbacks}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <UserFeedbackSubmission />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card key="stat-total">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Feedbacks</p>
                <p className="text-2xl font-bold">{totalFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card key="stat-average">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card key="stat-new">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">New Feedbacks</p>
                <p className="text-2xl font-bold">{newFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card key="stat-high">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">High Ratings</p>
                <p className="text-2xl font-bold">{highRatingFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by user, subject, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Feedback</TabsTrigger>
          <TabsTrigger value="new">New ({newFeedbacks})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="high-rating">High Rating</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading feedback...</span>
            </div>
          ) : (
            <>
              {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={feedback.userAvatar} alt={feedback.userName} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                      <CardDescription>
                        by {feedback.userName} • {feedback.eventName} • {feedback.date}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(feedback.status)}
                    {getCategoryBadge(feedback.category)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getRatingStars(feedback.rating)}
                  <span className="text-sm text-gray-600">({feedback.rating}/5)</span>
                </div>
                
                <p className="text-gray-700">{feedback.message}</p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{feedback.helpful}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsDown className="h-4 w-4" />
                      <span>{feedback.notHelpful}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedFeedback(feedback)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Feedback Details</DialogTitle>
                          <DialogDescription>
                            Detailed view of user feedback
                          </DialogDescription>
                        </DialogHeader>
                        {selectedFeedback && (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={selectedFeedback.userAvatar} alt={selectedFeedback.userName} />
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{selectedFeedback.userName}</h3>
                                <p className="text-sm text-gray-600">{selectedFeedback.userEmail}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Event</p>
                                <p className="font-medium">{selectedFeedback.eventName}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Date</p>
                                <p className="font-medium">{selectedFeedback.date}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Category</p>
                                <p className="font-medium">{selectedFeedback.category}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Rating</p>
                                <div className="flex items-center space-x-1">
                                  {selectedFeedback && getRatingStars(selectedFeedback.rating)}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-gray-600 mb-2">Message</p>
                              <p className="bg-gray-50 p-3 rounded-lg">{selectedFeedback.message}</p>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => handleHelpfulVote(selectedFeedback.id, true)}
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Helpful
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleHelpfulVote(selectedFeedback.id, false)}
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                Not Helpful
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {feedback.status === "new" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsReviewed(feedback.id)}
                      >
                        Mark as Reviewed
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading feedback...</span>
            </div>
          ) : (
            <>
              {filteredFeedbacks.filter(fb => fb.status === "new").map((feedback) => (
                <Card key={`new-${feedback.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={feedback.userAvatar} alt={feedback.userName} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                          <CardDescription>
                            by {feedback.userName} • {feedback.eventName} • {feedback.date}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(feedback.status)}
                        {getCategoryBadge(feedback.category)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getRatingStars(feedback.rating)}
                      <span className="text-sm text-gray-600">({feedback.rating}/5)</span>
                    </div>
                    
                    <p className="text-gray-700">{feedback.message}</p>
                    
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsReviewed(feedback.id)}
                      >
                        Mark as Reviewed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredFeedbacks.filter(fb => fb.status === "new").length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500">No new feedback found.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading feedback...</span>
            </div>
          ) : (
            <>
              {filteredFeedbacks.filter(fb => fb.status === "reviewed").map((feedback) => (
                <Card key={`reviewed-${feedback.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={feedback.userAvatar} alt={feedback.userName} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                          <CardDescription>
                            by {feedback.userName} • {feedback.eventName} • {feedback.date}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(feedback.status)}
                        {getCategoryBadge(feedback.category)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getRatingStars(feedback.rating)}
                      <span className="text-sm text-gray-600">({feedback.rating}/5)</span>
                    </div>
                    
                    <p className="text-gray-700">{feedback.message}</p>
                  </CardContent>
                </Card>
              ))}
              {filteredFeedbacks.filter(fb => fb.status === "reviewed").length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500">No reviewed feedback found.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="high-rating" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading feedback...</span>
            </div>
          ) : (
            <>
              {filteredFeedbacks.filter(fb => (fb.rating || 0) >= 4).map((feedback) => (
                <Card key={`high-rating-${feedback.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={feedback.userAvatar} alt={feedback.userName} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                          <CardDescription>
                            by {feedback.userName} • {feedback.eventName} • {feedback.date}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(feedback.status)}
                        {getCategoryBadge(feedback.category)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getRatingStars(feedback.rating)}
                      <span className="text-sm text-gray-600">({feedback.rating}/5)</span>
                    </div>
                    
                    <p className="text-gray-700">{feedback.message}</p>
                  </CardContent>
                </Card>
              ))}
              {filteredFeedbacks.filter(fb => (fb.rating || 0) >= 4).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500">No high-rating feedback found.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {filteredFeedbacks.length === 0 && (
        <Card key="no-results">
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No feedback found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserFeedbackSystem;