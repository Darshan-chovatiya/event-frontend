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
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import { useToast } from "@/components/ui/use-toast";

interface Stall {
  _id: string;
  stallNumber: string;
  location: string;
  description: string;
  price: number;
  status: "pending" | "reserved" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  features: string[];
  applications?: { exhibitorId: { _id: string; name: string; email: string }; status: string }[];
}

interface Booth {
  _id: string;
  eventName: string;
  name: string;
  eventId: string;
  hall: string;
  category: string;
  description: string;
  location: string;
  status: string;
  stalls: Stall[];
}

interface Event {
  _id: string;
  name: string;
}

const Stalls: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [stallRequests, setStallRequests] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [expandedBooth, setExpandedBooth] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBoothId, setCurrentBoothId] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"booths" | "requests">("booths");

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

  const [formData, setFormData] = useState({
    name: "",
    eventId: "",
    hall: "",
    category: "",
    description: "",
    location: "",
    status: "open",
    stalls: [{ stallNumber: "", location: "", description: "", price: 0, status: "pending", features: [] }],
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchBooths = async () => {
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
        body: JSON.stringify({ search, eventId, page: pagination.page, limit: pagination.limit }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch booths");

      setBooths(data.data.booths || []);
      setPagination({
        page: data.data.page,
        limit: data.data.limit,
        total: data.data.total,
        totalPages: data.data.totalPages,
      });
      setSuccess(data.message || "Booths and stalls loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch booths");
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
      if (activeTab === "booths") {
        fetchBooths();
      } else {
        fetchStallRequests();
      }
    }
  }, [isAuthenticated, search, eventId, pagination.page, activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const { name, value } = e.target;
    if (index !== undefined) {
      const newStalls = [...formData.stalls];
      newStalls[index] = { ...newStalls[index], [name]: value };
      setFormData({ ...formData, stalls: newStalls });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFeatureToggle = (feature: string, index: number) => {
    const newStalls = [...formData.stalls];
    const currentFeatures = newStalls[index].features;
    if (currentFeatures.includes(feature)) {
      newStalls[index].features = currentFeatures.filter((f) => f !== feature);
    } else {
      newStalls[index].features = [...currentFeatures, feature];
    }
    setFormData({ ...formData, stalls: newStalls });
  };

  const addStallField = () => {
    setFormData({
      ...formData,
      stalls: [...formData.stalls, { stallNumber: "", location: "", description: "", price: 0, status: "pending", features: [] }],
    });
  };

  const removeStallField = (index: number) => {
    setFormData({
      ...formData,
      stalls: formData.stalls.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const payload = {
        booths: [{
          _id: isEditing ? currentBoothId : undefined,
          name: formData.name,
          eventId: formData.eventId,
          hall: formData.hall,
          category: formData.category,
          description: formData.description,
          location: formData.location,
          status: formData.status,
          stalls: formData.stalls.map((stall) => ({
            _id: isEditing ? (stall as any)._id : undefined,
            stallNumber: stall.stallNumber,
            location: stall.location,
            description: stall.description,
            price: Number(stall.price),
            status: stall.status,
            features: stall.features,
          })),
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
      if (!response.ok) throw new Error(data.message || "Failed to save booth");

      setSuccess(data.message || "Booth and stalls saved successfully");
      toast({ title: "Success", description: data.message });
      setShowAddModal(false);
      setFormData({
        name: "",
        eventId: "",
        hall: "",
        category: "",
        description: "",
        location: "",
        status: "open",
        stalls: [{ stallNumber: "", location: "", description: "", price: 0, status: "pending", features: [] }],
      });
      setIsEditing(false);
      setCurrentBoothId(null);
      fetchBooths();
    } catch (err: any) {
      setError(err.message || "Failed to save booth");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (boothId: string | null, stallId?: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/delete-booth-stall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boothId, stallId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete");

      setSuccess(data.message || "Deleted successfully");
      toast({ title: "Success", description: data.message });
      fetchBooths();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booth: Booth) => {
    setFormData({
      name: booth.name,
      eventId: booth.eventId,
      hall: booth.hall,
      category: booth.category,
      description: booth.description,
      location: booth.location,
      status: booth.status,
      stalls: booth.stalls.map((stall) => ({
        _id: stall._id,
        stallNumber: stall.stallNumber,
        location: stall.location,
        description: stall.description,
        price: stall.price,
        status: stall.status,
        features: stall.features,
      })),
    });
    setIsEditing(true);
    setCurrentBoothId(booth._id);
    setShowAddModal(true);
  };

  const handleStatusUpdate = async (boothId: string | null, stallId: string | null, status: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${BaseUrl}/admin/update-booth-stall-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boothId, stallId, status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status");

      setSuccess(data.message || "Status updated successfully");
      toast({ title: "Success", description: data.message });
      fetchBooths();
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
                Manage booths and stalls for your events, <span className="font-semibold text-blue-600">{user?.username}</span>.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setActiveTab("booths")}
                className={`rounded-xl transition-all duration-300 ${
                  activeTab === "booths"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 hover:border-gray-400"
                }`}
              >
                Booths
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
      {activeTab === "booths" && (
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
                  Search Booths
                </Label>
                <Input
                  id="search"
                  placeholder="Search by hall or category..."
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
              <div className="flex items-end">
                {/* <Button
                  onClick={() => setPagination({ ...pagination, page: 1 })}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Apply Filters
                </Button> */}
                {activeTab === "booths" && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r ms-auto my-auto from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add New Booth
                </Button>
              )}
              </div>
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

      {/* Booths List */}
      {activeTab === "booths" && (
        <div className="space-y-4">
          {booths.map((booth) => (
            <Card key={booth._id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30"></div>
              <CardHeader className="relative border-b border-gray-100/50 bg-white/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold flex items-center text-gray-800">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    {booth.eventName} - {booth.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(booth)}
                      className="text-blue-600 hover:bg-blue-100 rounded-xl"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(booth._id, undefined)}
                      className="text-red-600 hover:bg-red-100 rounded-xl"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedBooth(expandedBooth === booth._id ? null : booth._id)}
                      className="text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                      {expandedBooth === booth._id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <span className="px-3"><span className="font-bold">Hall:</span> {booth.hall}</span>
                  <span className="px-3"><span className="font-bold">Category:</span> {booth.category}</span>
                  <span className="px-3"><span className="font-bold">Status:</span> <span className={`inline-block px-2 py-1 rounded-full ${getStatusColor(booth.status)}`}>{booth.status}</span></span>
                </div>
              </CardHeader>
              {expandedBooth === booth._id && (
                <CardContent className="relative p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Stall Number</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Location</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Price</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {booth.stalls.map((stall) => (
                          <tr key={stall._id} className="hover:bg-blue-50/30">
                            <td className="py-4 px-6 font-medium text-gray-900">{stall.stallNumber}</td>
                            <td className="py-4 px-6 text-gray-800">{stall.location || "N/A"}</td>
                            <td className="py-4 px-6 text-gray-800">${stall.price}</td>
                            <td className="py-4 px-6">
                              <Select
                                value={stall.status}
                                onValueChange={(value) => handleStatusUpdate(null, stall._id, value)}
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
                                onClick={() => handleDelete(null, stall._id)}
                                className="text-red-600 hover:bg-red-100 rounded-xl"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
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
                  Stall: {stall.stallNumber}
                </CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  <span className="px-3"><span className="font-bold">Location:</span> {stall.location}</span>
                  <span className="px-3"><span className="font-bold">Price:</span> ${stall.price}</span>
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
      {showAddModal && activeTab === "booths" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" style={{ marginTop: "0px" }}>
          <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                <Store className="h-6 w-6 text-blue-500 mr-3" />
                {isEditing ? "Edit Booth" : "Add New Booth"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Booth Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter booth name"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventId" className="text-sm font-semibold text-gray-700">Event ID</Label>
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
                  <Label htmlFor="hall" className="text-sm font-semibold text-gray-700">Hall</Label>
                  <Input
                    id="hall"
                    name="hall"
                    value={formData.hall}
                    onChange={handleInputChange}
                    placeholder="Enter hall"
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
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">St Mello</h3>
                  <Button
                    onClick={addStallField}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add Stall
                  </Button>
                </div>
                {formData.stalls.map((stall, index) => (
                  <div key={index} className="border border-gray-200 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`stallNumber-${index}`} className="text-sm font-semibold text-gray-700">Stall Number</Label>
                        <Input
                          id={`stallNumber-${index}`}
                          name="stallNumber"
                          value={stall.stallNumber}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Enter stall number"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`location-${index}`} className="text-sm font-semibold text-gray-700">Location</Label>
                        <Input
                          id={`location-${index}`}
                          name="location"
                          value={stall.location}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Enter stall location"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`} className="text-sm font-semibold text-gray-700">Description</Label>
                        <Input
                          id={`description-${index}`}
                          name="description"
                          value={stall.description}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Enter stall description"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`} className="text-sm font-semibold text-gray-700">Price</Label>
                        <Input
                          id={`price-${index}`}
                          name="price"
                          type="number"
                          value={stall.price}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Enter price"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`status-${index}`} className="text-sm font-semibold text-gray-700">Status</Label>
                        <Select
                          value={stall.status}
                          onValueChange={(value) => {
                            const newStalls = [...formData.stalls];
                            newStalls[index].status = value;
                            setFormData({ ...formData, stalls: newStalls });
                          }}
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
                            variant={stall.features.includes(feature) ? "default" : "outline"}
                            onClick={() => handleFeatureToggle(feature, index)}
                            className={`rounded-full ${stall.features.includes(feature) ? "bg-blue-600 text-white" : "border-gray-300"}`}
                          >
                            {feature.charAt(0).toUpperCase() + feature.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {formData.stalls.length > 1 && (
                      <Button
                        variant="destructive"
                        onClick={() => removeStallField(index)}
                        className="rounded-xl"
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Remove Stall
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setCurrentBoothId(null);
                    setFormData({
                      name: "",
                      eventId: "",
                      hall: "",
                      category: "",
                      description: "",
                      location: "",
                      status: "open",
                      stalls: [{ stallNumber: "", location: "", description: "", price: 0, status: "pending", features: [] }],
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
                    isEditing ? "Update Booth" : "Create Booth"
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