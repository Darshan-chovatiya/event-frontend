import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Store,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Filter,
} from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import { useToast } from "@/components/ui/use-toast";

interface Stall {
  _id: string;
  stallNumber: string;
  location: string;
  description: string;
  price: number;
  category: string;
  status: "pending" | "reserved" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  features: string[];
  eventName: string;
  eventId: string;
  applications?: { exhibitorId: { _id: string; name: string; email: string }; status: string }[];
}

interface Event {
  _id: string;
  name: string;
}

const Stalls: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [stallRequests, setStallRequests] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [category, setCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStallId, setCurrentStallId] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"stalls" | "requests">("stalls");

  const [formData, setFormData] = useState({
    stallNumber: "",
    eventId: "",
    location: "",
    description: "",
    price: 0,
    category: "",
    status: "pending",
    features: [] as string[],
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${BaseUrl}/admin/get-event-Ids`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.data) {
          setEventOptions(data.data);
        } else {
          toast({ variant: "destructive", title: "Error", description: data.message || "Failed to fetch events" });
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    };

    fetchEvents();
  }, []);

  const fetchStalls = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/get-stall-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ search, eventId, category, page: pagination.page, limit: pagination.limit }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch stalls");

      setStalls(data.data.stalls || []);
      setPagination({
        page: data.data.page,
        limit: data.data.limit,
        total: data.data.total,
        totalPages: data.data.totalPages,
      });
      setSuccess(data.message || "Stalls loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch stalls");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchStallRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/get-stall-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch stall requests");

      setStallRequests(data.data || []);
      setSuccess(data.message || "Stall requests loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch stall requests");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "stalls") {
        fetchStalls();
      } else {
        fetchStallRequests();
      }
    }
  }, [isAuthenticated, search, eventId, category, pagination.page, activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "price" ? Number(value) : value });
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formData.features;
    if (currentFeatures.includes(feature)) {
      setFormData({ ...formData, features: currentFeatures.filter((f) => f !== feature) });
    } else {
      setFormData({ ...formData, features: [...currentFeatures, feature] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const payload = {
        stalls: [{
          _id: isEditing ? currentStallId : undefined,
          stallNumber: formData.stallNumber,
          eventId: formData.eventId,
          location: formData.location,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          status: formData.status,
          features: formData.features,
        }],
      };

      const response = await fetch(`${BaseUrl}/admin/update-stall-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save stall");

      setSuccess(data.message || "Stall saved successfully");
      toast({ title: "Success", description: data.message });
      setShowAddModal(false);
      setFormData({
        stallNumber: "",
        eventId: "",
        location: "",
        description: "",
        price: 0,
        category: "",
        status: "pending",
        features: [],
      });
      setIsEditing(false);
      setCurrentStallId(null);
      fetchStalls();
    } catch (err: any) {
      setError(err.message || "Failed to save stall");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stallId: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/delete-stall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stallId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete stall");

      setSuccess(data.message || "Stall deleted successfully");
      toast({ title: "Success", description: data.message });
      fetchStalls();
    } catch (err: any) {
      setError(err.message || "Failed to delete stall");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stall: Stall) => {
    setFormData({
      stallNumber: stall.stallNumber,
      eventId: stall.eventId,
      location: stall.location,
      description: stall.description,
      price: stall.price,
      category: stall.category,
      status: stall.status,
      features: stall.features,
    });
    setIsEditing(true);
    setCurrentStallId(stall._id);
    setShowAddModal(true);
  };

  const handleStatusUpdate = async (stallId: string, status: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/update-stall-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stallId, status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status");

      setSuccess(data.message || "Status updated successfully");
      toast({ title: "Success", description: data.message });
      fetchStalls();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatusUpdate = async (stallId: string, exhibitorId: string, status: "accepted" | "rejected") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/update-stall-application-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stallId, exhibitorId, status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update application status");

      setSuccess(data.message || "Application status updated successfully");
      toast({ title: "Success", description: data.message });
      fetchStallRequests();
    } catch (err: any) {
      setError(err.message || "Failed to update application status");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "confirmed":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
        <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Stalls Management
              </h1>
              <p className="text-gray-600 text-lg">
                Manage stalls for your events, <span className="font-semibold text-blue-600">{user?.username}</span>.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setActiveTab("stalls")}
                className={`rounded-xl transition-all duration-300 ${
                  activeTab === "stalls"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 hover:border-gray-400"
                }`}
              >
                Stalls
              </Button>
              <Button
                onClick={() => setActiveTab("requests")}
                className={`rounded-xl transition-all duration-300 ${
                  activeTab === "requests"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 hover:border-gray-400"
                }`}
              >
                Stall Requests
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {activeTab === "stalls" && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <Filter className="h-5 w-5 text-blue-500 mr-3" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-blue-500" />
                  Search Stalls
                </Label>
                <Input
                  id="search"
                  placeholder="Search by stall number, description, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventId" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Store className="h-4 w-4 mr-2 text-purple-500" />
                  Event
                </Label>
                <Select
                  value={eventId}
                  onValueChange={(value) => {
                    setEventId(value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventOptions.map((event) => (
                      <SelectItem key={event._id} value={event._id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Store className="h-4 w-4 mr-2 text-purple-500" />
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="Enter category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-end mt-4">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r ms-auto my-auto from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add New Stall
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-0 shadow-lg bg-red-50/80 backdrop-blur-sm rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="border-0 shadow-lg bg-green-50/80 backdrop-blur-sm rounded-xl border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stalls List */}
      {activeTab === "stalls" && (
        <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-500 font-medium">Loading stalls...</p>
            </div>
          )}
          {stalls.length === 0 && !loading && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-6 text-center text-gray-600">
                No stalls found.
              </CardContent>
            </Card>
          )}
          {stalls.map((stall) => (
            <Card key={stall._id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30"></div>
              <CardHeader className="relative border-b border-gray-100/50 bg-white/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold flex items-center text-gray-800">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    {stall.eventName} - Stall {stall.stallNumber}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(stall)}
                      className="text-blue-600 hover:bg-blue-100 rounded-xl"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(stall._id)}
                      className="text-red-600 hover:bg-red-100 rounded-xl"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <span className="px-3"><span className="font-bold">Location:</span> {stall.location || "N/A"}</span>
                  <span className="px-3"><span className="font-bold">Price:</span> ${stall.price}</span>
                  <span className="px-3"><span className="font-bold">Category:</span> {stall.category || "N/A"}</span>
                  <span className="px-3"><span className="font-bold">Status:</span> <span className={`inline-block px-2 py-1 rounded-full ${getStatusColor(stall.status)}`}>{stall.status}</span></span>
                </div>
              </CardHeader>
              <CardContent className="relative p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Stall Number</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Location</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Price</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-blue-50/30">
                        <td className="py-4 px-6 font-medium text-gray-900">{stall.stallNumber}</td>
                        <td className="py-4 px-6 text-gray-800">{stall.location || "N/A"}</td>
                        <td className="py-4 px-6 text-gray-800">${stall.price}</td>
                        <td className="py-4 px-6 text-gray-800">{stall.category || "N/A"}</td>
                        <td className="py-4 px-6">
                          <Select
                            value={stall.status}
                            onValueChange={(value) => handleStatusUpdate(stall._id, value)}
                          >
                            <SelectTrigger className={`w-[120px] ${getStatusColor(stall.status)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(stall._id)}
                            className="text-red-600 hover:bg-red-100 rounded-xl"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stall Requests List */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {stallRequests.length === 0 && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-6 text-center text-gray-600">
                No pending stall requests found.
              </CardContent>
            </Card>
          )}
          {stallRequests.map((stall) => (
            <Card key={stall._id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30"></div>
              <CardHeader className="relative border-b border-gray-100/50 bg-white/30">
                <CardTitle className="text-xl font-bold flex items-center text-gray-800">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  Stall: {stall.stallNumber} ({stall.eventName})
                </CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  <span className="px-3"><span className="font-bold">Location:</span> {stall.location}</span>
                  <span className="px-3"><span className="font-bold">Price:</span> ${stall.price}</span>
                  <span className="px-3"><span className="font-bold">Category:</span> {stall.category || "N/A"}</span>
                  <span className="px-3"><span className="font-bold">Status:</span> <span className={`inline-block px-2 py-1 rounded-full ${getStatusColor(stall.status)}`}>{stall.status}</span></span>
                </div>
              </CardHeader>
              <CardContent className="relative p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Exhibitor</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Email</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stall.applications?.map((app) => (
                        <tr key={app.exhibitorId._id} className="hover:bg-blue-50/30">
                          <td className="py-4 px-6 font-medium text-gray-900">{app.exhibitorId.name}</td>
                          <td className="py-4 px-6 text-gray-800">{app.exhibitorId.email}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2 py-1 rounded-full ${getStatusColor(app.status)}`}>{app.status}</span>
                          </td>
                          <td className="py-4 px-6 flex space-x-2">
                            <Button
                              onClick={() => handleApplicationStatusUpdate(stall._id, app.exhibitorId._id, "accepted")}
                              disabled={loading || app.status !== "pending"}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleApplicationStatusUpdate(stall._id, app.exhibitorId._id, "rejected")}
                              disabled={loading || app.status !== "pending"}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && activeTab === "stalls" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" style={{ marginTop: "0px" }}>
          <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                <Store className="h-6 w-6 text-blue-500 mr-3" />
                {isEditing ? "Edit Stall" : "Add New Stall"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stallNumber" className="text-sm font-semibold text-gray-700">Stall Number</Label>
                  <Input
                    id="stallNumber"
                    name="stallNumber"
                    value={formData.stallNumber}
                    onChange={handleInputChange}
                    placeholder="Enter stall number"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventId" className="text-sm font-semibold text-gray-700">Event</Label>
                  <Select
                    value={formData.eventId}
                    onValueChange={(value) => setFormData({ ...formData, eventId: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventOptions.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter location"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold text-gray-700">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Enter category"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Features</Label>
                <div className="flex flex-wrap gap-2">
                  {["electricity", "wifi", "furniture", "other"].map((feature) => (
                    <Button
                      key={feature}
                      variant={formData.features.includes(feature) ? "default" : "outline"}
                      onClick={() => handleFeatureToggle(feature)}
                      className={`rounded-full ${formData.features.includes(feature) ? "bg-blue-600 text-white" : "border-gray-300"}`}
                    >
                      {feature.charAt(0).toUpperCase() + feature.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setCurrentStallId(null);
                    setFormData({
                      stallNumber: "",
                      eventId: "",
                      location: "",
                      description: "",
                      price: 0,
                      category: "",
                      status: "pending",
                      features: [],
                    });
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Saving...
                    </div>
                  ) : (
                    isEditing ? "Update Stall" : "Create Stall"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Stalls;