import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import CentralizedApi from "@/services/centralizedApi";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Image,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  adType: string;
  targetUrl?: string;
  displayDuration: number;
  priority: number;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected" | "archived";
  organizerId: { _id: string; name: string; email: string };
  impressions: number;
  clicks: number;
  budget: number;
  tags: string[];
  createdAt: string;
  rejectionReason?: string;
}

const AdsManagement = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingAdId, setRejectingAdId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all ads
  const fetchAds = async () => {
    setLoading(true);
    try {
      const response: any = await CentralizedApi.ads.getAll();
      let adsArray: Ad[] = [];
      
      if (Array.isArray(response)) {
        adsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        adsArray = response.data;
      } else if (response?.ads && Array.isArray(response.ads)) {
        adsArray = response.ads;
      }
      
      setAds(adsArray);
      console.log("📺 [ADS] Fetched all ads:", adsArray.length);
    } catch (error) {
      console.error("Failed to fetch ads:", error);
      setAds([]);
      toast({ title: "Error", description: "Failed to fetch ads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending ads (for admin review)
  const fetchPendingAds = async () => {
    try {
      const response: any = await CentralizedApi.ads.getPending();
      let pendingArray: Ad[] = [];
      
      if (Array.isArray(response)) {
        pendingArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        pendingArray = response.data;
      } else if (response?.ads && Array.isArray(response.ads)) {
        pendingArray = response.ads;
      }
      
      setPendingAds(pendingArray);
      console.log("📺 [ADS] Fetched pending ads:", pendingArray.length);
    } catch (error) {
      console.error("Failed to fetch pending ads:", error);
      setPendingAds([]);
    }
  };

  // Load ads on component mount
  useEffect(() => {
    fetchAds();
    fetchPendingAds();
  }, []);

  // Filter ads based on search and tab
  const filteredAds = ads.filter((ad) => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "pending") return ad.status === "pending" && matchesSearch;
    if (activeTab === "approved") return ad.status === "approved" && matchesSearch;
    if (activeTab === "rejected") return ad.status === "rejected" && matchesSearch;
    return matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="text-gray-600">
            Archived
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Approve ad
  const handleApproveAd = async (adId: string) => {
    try {
      await CentralizedApi.ads.approve(adId);
      toast({ title: "Success", description: "Ad approved successfully" });
      fetchAds();
      fetchPendingAds();
    } catch (error) {
      console.error("Failed to approve ad:", error);
      toast({ title: "Error", description: "Failed to approve ad", variant: "destructive" });
    }
  };

  // Reject ad
  const handleRejectAd = async (adId: string) => {
    if (!rejectReason.trim()) {
      toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    try {
      await CentralizedApi.ads.reject(adId, rejectReason);
      toast({ title: "Success", description: "Ad rejected successfully" });
      setRejectingAdId(null);
      setRejectReason("");
      fetchAds();
      fetchPendingAds();
    } catch (error) {
      console.error("Failed to reject ad:", error);
      toast({ title: "Error", description: "Failed to reject ad", variant: "destructive" });
    }
  };

  // Delete ad
  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    try {
      await CentralizedApi.ads.delete(adId);
      toast({ title: "Success", description: "Ad deleted successfully" });
      fetchAds();
    } catch (error) {
      console.error("Failed to delete ad:", error);
      toast({ title: "Error", description: "Failed to delete ad", variant: "destructive" });
    }
  };

  // Calculate CTR
  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading ads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">📺 Ads Management</h1>
          <p className="text-muted-foreground mt-1">Manage and review advertisements</p>
        </div>
        <Button className="gradient-primary text-white hover-glow">
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <Input
          placeholder="Search ads by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Ads
            <Badge variant="outline" className="ml-2">{ads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending
            <Badge variant="outline" className="ml-2">
              {ads.filter(ad => ad.status === "pending").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved
            <Badge variant="outline" className="ml-2">
              {ads.filter(ad => ad.status === "approved").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            Rejected
            <Badge variant="outline" className="ml-2">
              {ads.filter(ad => ad.status === "rejected").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Ads Tab */}
        <TabsContent value="all" className="space-y-4 animate-fade-in">
          {filteredAds.length === 0 ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No ads found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAds.map((ad) => (
              <Card key={ad._id} className="glass-card border-primary/20 hover-lift">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Image */}
                    {ad.imageUrl && (
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold gradient-text">{ad.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                        </div>
                        {getStatusBadge(ad.status)}
                      </div>

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="font-medium capitalize">{ad.adType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Impressions</p>
                          <p className="font-medium">{ad.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                          <p className="font-medium">{ad.clicks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CTR</p>
                          <p className="font-medium">{calculateCTR(ad.clicks, ad.impressions)}%</p>
                        </div>
                      </div>

                      {/* Organizer Info */}
                      <div className="text-xs text-muted-foreground mb-4">
                        Organizer: {ad.organizerId?.name} ({ad.organizerId?.email})
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedAd(ad);
                          setShowDetails(true);
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {ad.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleApproveAd(ad._id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setRejectingAdId(ad._id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteAd(ad._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>

                      {/* Rejection Form */}
                      {rejectingAdId === ad._id && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <textarea
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-2 border rounded text-sm mb-2"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleRejectAd(ad._id)}
                            >
                              Confirm Rejection
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectingAdId(null);
                                setRejectReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending Ads Tab */}
        <TabsContent value="pending" className="space-y-4 animate-fade-in">
          {!pendingAds || pendingAds.length === 0 ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No pending ads for review</p>
              </CardContent>
            </Card>
          ) : (
            pendingAds.map((ad) => (
              <Card key={ad._id} className="glass-card border-yellow-200 bg-yellow-50/20 hover-lift">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-700">Awaiting Review</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveAd(ad._id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Ad
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setRejectingAdId(ad._id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Ad
                    </Button>
                  </div>

                  {rejectingAdId === ad._id && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <textarea
                        placeholder="Enter rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2 border rounded text-sm mb-2"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleRejectAd(ad._id)}
                        >
                          Confirm Rejection
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingAdId(null);
                            setRejectReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Approved Ads Tab */}
        <TabsContent value="approved" className="space-y-4 animate-fade-in">
          {filteredAds.filter(ad => ad.status === "approved").length === 0 ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No approved ads</p>
              </CardContent>
            </Card>
          ) : (
            filteredAds
              .filter(ad => ad.status === "approved")
              .map((ad) => (
                <Card key={ad._id} className="glass-card border-green-200 hover-lift">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{ad.title}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>📊 {ad.impressions.toLocaleString()} impressions</span>
                          <span>👆 {ad.clicks} clicks</span>
                          <span>⚡ {calculateCTR(ad.clicks, ad.impressions)}% CTR</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-700">Live</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Rejected Ads Tab */}
        <TabsContent value="rejected" className="space-y-4 animate-fade-in">
          {filteredAds.filter(ad => ad.status === "rejected").length === 0 ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected ads</p>
              </CardContent>
            </Card>
          ) : (
            filteredAds
              .filter(ad => ad.status === "rejected")
              .map((ad) => (
                <Card key={ad._id} className="glass-card border-red-200 hover-lift">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{ad.title}</h3>
                        {ad.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Reason: {ad.rejectionReason}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-red-500/20 text-red-700">Rejected</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdsManagement;
