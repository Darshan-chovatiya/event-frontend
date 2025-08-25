import React, { useState, useEffect, useRef } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Store, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, MapPin, Users, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Event {
  _id: string;
  name: string;
  date: string;
  venue: { name: string; address: string } | null;
}

interface Stall {
  _id: string;
  stallNumber: string;
  eventId: {
    _id: string;
    name: string;
  };
  location: string;
  description: string;
  price: number;
  category: string;
  status: string;
  features: string[];
  applications: { exhibitorId: string; status: string }[];
}

interface Complaint {
  _id: string;
  eventId: { name: string };
  userId: { name: string };
  userType: "Visitor" | "Exhibitor";
  type: "Stall" | "Event" | "General";
  description: string;
  status: "Pending" | "Resolved";
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

const UserStalls: React.FC = () => {
  const { user } = useUserAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isViewComplaintsModalOpen, setIsViewComplaintsModalOpen] = useState(false);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    designation: "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    representativesName: "",
    representativesDesignation: "",
    representativesEmail: "",
    representativesMobile: "",
  });
  const [complaintFormData, setComplaintFormData] = useState({
    type: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [file, setFile] = useState<File | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintPage, setComplaintPage] = useState(1);
  const [complaintTotalPages, setComplaintTotalPages] = useState(1);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/get-event-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch events");
      }

      const responseData = await response.json();
      setEvents(responseData.data.docs || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch events. Please try again.");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (eventId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/get-category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch categories");
      }

      const responseData = await response.json();
      setCategories(responseData.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch categories. Please try again.");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchStalls = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/get-stall-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search,
          eventId: selectedEvent,
          category: selectedCategory,
          status: "pending",
          page: 1,
          limit: 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch stalls");
      }

      const responseData = await response.json();
      setStalls(responseData.data.stalls || []);
      setSuccess(responseData.message || "Stalls loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch stalls");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async (page: number = 1, search: string = "") => {
    setComplaintLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/get-complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          page,
          limit: 10,
          search,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch complaints");
      }

      const responseData = await response.json();
      setComplaints(responseData.data.docs || []);
      setComplaintTotalPages(responseData.data.totalPages || 1);
      setSuccess(responseData.message || "Complaints loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch complaints");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setComplaintLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchCategories(selectedEvent);
      fetchStalls();
    }
  }, [selectedEvent, search, selectedCategory]);

  useEffect(() => {
    if (isViewComplaintsModalOpen) {
      fetchComplaints(complaintPage, complaintSearch);
    }
  }, [isViewComplaintsModalOpen, complaintPage, complaintSearch]);

  useEffect(() => {
    // Reset page to 1 when search changes
    setComplaintPage(1);
  }, [complaintSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleComplaintInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setComplaintFormData({ ...complaintFormData, [name]: value });
    validateComplaintForm();
  };

  const handleComplaintSelectChange = (value: string) => {
    setComplaintFormData({ ...complaintFormData, type: value });
    validateComplaintForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComplaintSearch(e.target.value);
  };

  const handleApply = (stallId: string) => {
    setSelectedStallId(stallId);
    setIsModalOpen(true);
  };

  const handleComplaintClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsComplaintModalOpen(true);
  };

  const validateComplaintForm = () => {
    const errors: { [key: string]: string } = {};
    if (!complaintFormData.type) errors.type = "Complaint type is required";
    if (!complaintFormData.description.trim() || complaintFormData.description.length < 10)
      errors.description = "Description must be at least 10 characters long";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitComplaint = async () => {
    if (!selectedEventId) {
      setError("No event selected");
      toast({ variant: "destructive", title: "Error", description: "No event selected" });
      return;
    }

    if (!validateComplaintForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill all required fields correctly",
      });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/submit-complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          type: complaintFormData.type,
          description: complaintFormData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit complaint");
      }

      const responseData = await response.json();
      setSuccess(responseData.message || "Complaint submitted successfully");
      toast({ title: "Success", description: responseData.message });
      setIsComplaintModalOpen(false);
      setComplaintFormData({ type: "", description: "" });
      setFormErrors({});
    } catch (err: any) {
      setError(err.message || "Failed to submit complaint");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedStallId) {
      setError("No stall selected");
      toast({ variant: "destructive", title: "Error", description: "No stall selected" });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("stallId", selectedStallId);
      formDataToSend.append("eventId", selectedEvent || "");
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("designation", formData.designation);
      formDataToSend.append("representativesName", formData.representativesName);
      formDataToSend.append("representativesDesignation", formData.representativesDesignation);
      formDataToSend.append("representativesEmail", formData.representativesEmail);
      formDataToSend.append("representativesMobile", formData.representativesMobile);
      if (file) {
        formDataToSend.append("representative-profile", file);
      }
      formDataToSend.append("orderId", "mock_order_id");
      formDataToSend.append("paymentId", "mock_payment_id");
      formDataToSend.append("signature", "mock_signature");

      const response = await fetch(`${BaseUrl}/user/apply-stall`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply for stall");
      }

      const responseData = await response.json();
      setSuccess(responseData.message || "Application submitted successfully");
      toast({ title: "Success", description: responseData.message });
      setIsModalOpen(false);
      setFormData({
        name: user?.name || "",
        designation: "",
        email: user?.email || "",
        mobile: user?.mobile || "",
        representativesName: "",
        representativesDesignation: "",
        representativesEmail: "",
        representativesMobile: "",
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchStalls();
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvent(selectedEvent === eventId ? null : eventId);
    setSelectedCategory("");
    setSearch("");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-800";
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
                Available Stalls
              </h1>
              <p className="text-gray-600 text-lg">
                Browse and apply for stalls,{" "}
                <span className="font-semibold text-blue-600">{user?.name}</span>.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link to="/user/booking-history">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                  View Booking History
                </Button>
              </Link>
              <Button
                onClick={() => setIsViewComplaintsModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
              >
                View Complaints
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
          <CardTitle className="text-xl font-bold flex items-center text-gray-800">
            <Store className="h-5 w-5 text-blue-500 mr-3" />
            Search & Filter Stalls
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-semibold text-gray-700">
                Search Stalls
              </Label>
              <Input
                id="search"
                placeholder="Search by stall number, location, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events and Stalls */}
      <div className="space-y-6">
        {loading && (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-500 font-medium">Loading...</p>
          </div>
        )}
        {!loading && events.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6 text-center text-gray-600">
              No events found.
            </CardContent>
          </Card>
        )}
        {events.map((event) => (
          <Card
            key={event._id}
            className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl"
            ref={(el) => (eventRefs.current[event._id] = el)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30"></div>
            <CardHeader className="relative border-b border-gray-100/50 bg-white/30">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold flex items-center text-gray-800">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  {event.name}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEvent(event._id)}
                    className="text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    {selectedEvent === event._id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleComplaintClick(event._id)}
                    className="text-gray-600 hover:bg-gray-100 rounded-full"
                    title="Submit Complaint"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <span className="px-3"><span className="font-bold">Date:</span> {new Date(event.date).toLocaleDateString()}</span>
                <span className="px-3"><span className="font-bold">Venue:</span> {event.venue?.name || "N/A"}, {event.venue?.address || "N/A"}</span>
              </div>
            </CardHeader>
            {selectedEvent === event._id && (
              <CardContent className="relative p-6">
                {stalls.length === 0 ? (
                  <div className="text-center text-gray-600">No stalls available for this event.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stalls.map((stall) => (
                      <Card
                        key={stall._id}
                        className="relative border-0 shadow-lg bg-white/90 rounded-xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
                        <CardHeader className="relative">
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <Store className="h-5 w-5 text-blue-500 mr-2" />
                            Stall {stall.stallNumber}
                          </CardTitle>
                          <Badge className={`absolute top-4 right-4 ${getStatusColor(stall.status)}`}>
                            {stall.status}
                          </Badge>
                        </CardHeader>
                        <CardContent className="relative space-y-2">
                          <p><span className="font-bold">Event:</span> {stall.eventId.name}</p>
                          <p><span className="font-bold">Location:</span> {stall.location || "N/A"}</p>
                          <p><span className="font-bold">Category:</span> {stall.category || "N/A"}</p>
                          <p><span className="font-bold">Price:</span> ${stall.price}</p>
                          <p><span className="font-bold">Description:</span> {stall.description || "N/A"}</p>
                          <div>
                            <span className="font-bold">Features:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {stall.features.map((feature) => (
                                <Badge key={feature} variant="secondary" className="bg-blue-100 text-blue-800">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleApply(stall._id)}
                            disabled={stall.status !== "pending" || stall.applications.some(app => app.exhibitorId === user?._id)}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 Gallext-white rounded-xl"
                          >
                            {stall.applications.some(app => app.exhibitorId === user?._id)
                              ? "Already Applied"
                              : "Apply for Stall"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Stall Application Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center text-gray-800">
              <Users className="h-6 w-6 text-blue-500 mr-3" />
              Apply for Stall
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation" className="text-sm font-semibold">Designation</Label>
                <Input
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Enter designation"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-semibold">Mobile</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Representative Details</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representativesName" className="text-sm font-semibold">Name</Label>
                  <Input
                    id="representativesName"
                    name="representativesName"
                    value={formData.representativesName}
                    onChange={handleInputChange}
                    placeholder="Enter representative's name"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="representativesDesignation" className="text-sm font-semibold">Designation</Label>
                  <Input
                    id="representativesDesignation"
                    name="representativesDesignation"
                    value={formData.representativesDesignation}
                    onChange={handleInputChange}
                    placeholder="Enter representative's designation"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="representativesEmail" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="representativesEmail"
                    name="representativesEmail"
                    type="email"
                    value={formData.representativesEmail}
                    onChange={handleInputChange}
                    placeholder="Enter representative's email"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="representativesMobile" className="text-sm font-semibold">Mobile</Label>
                  <Input
                    id="representativesMobile"
                    name="representativesMobile"
                    value={formData.representativesMobile}
                    onChange={handleInputChange}
                    placeholder="Enter representative's mobile"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="representative-profile" className="text-sm font-semibold">Profile Image</Label>
                  <Input
                    id="representative-profile"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting...
                </div>
              ) : (
                "Submit Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaint Modal */}
      <Dialog open={isComplaintModalOpen} onOpenChange={setIsComplaintModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center text-gray-800">
              <FileText className="h-6 w-6 text-blue-500 mr-3" />
              Submit Complaint
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {Object.keys(formErrors).length > 0 && (
              <Alert variant="destructive" className="bg-red-50/80">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  {Object.values(formErrors).map((err, index) => (
                    <div key={index} className="text-red-700">{err}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-semibold">Complaint Type *</Label>
              <Select
                value={complaintFormData.type}
                onValueChange={handleComplaintSelectChange}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select complaint type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stall">Stall</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description *</Label>
              <Input
                id="description"
                name="description"
                value={complaintFormData.description}
                onChange={handleComplaintInputChange}
                placeholder="Describe your complaint (minimum 10 characters)"
                className="h-24 rounded-xl"
                type="textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsComplaintModalOpen(false);
                setComplaintFormData({ type: "", description: "" });
                setFormErrors({});
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComplaint}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sub submitting...
                </div>
              ) : (
                "Submit Complaint"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* View Complaints Modal */}
<Dialog open={isViewComplaintsModalOpen} onOpenChange={setIsViewComplaintsModalOpen}>
  <DialogContent className="w-[95vw] max-w-[1000px] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-white rounded-3xl border shadow-2xl ring-1 ring-gray-200/50">
    <DialogHeader className="px-8 py-6 bg-gray-100 text-black rounded-t-3xl -mx-6 -mt-6">
      <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center">
        <div className="h-10 w-10 bg-black/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 ring-2 ring-white/30">
          <FileText className="h-5 w-5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium opacity-90">Complaint Management</div>
          <div className="text-lg sm:text-xl font-bold">Your Complaints</div>
        </div>
      </DialogTitle>
    </DialogHeader>
    
    <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6">
      <div className="space-y-6 py-6">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100/50 rounded-2xl p-6 border border-blue-200/50 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Search className="h-4 w-4 text-white" />
            </div>
            <Label htmlFor="complaintSearch" className="text-lg font-bold text-gray-800">Search Complaints</Label>
          </div>
          <Input
            id="complaintSearch"
            placeholder="Search by description, type, or event name..."
            value={complaintSearch}
            onChange={(e) => setComplaintSearch(e.target.value)}
            className="h-12 rounded-xl border-blue-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white/70 backdrop-blur-sm"
          />
        </div>

        {/* Content Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          {complaintLoading && (
            <div className="flex flex-col items-center space-y-6 py-20">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 animate-pulse"></div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold text-gray-700">Loading your complaints...</p>
                <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
              </div>
            </div>
          )}

          {!complaintLoading && complaints.length === 0 && (
            <div className="text-center py-20">
              <div className="flex flex-col items-center space-y-6">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center ring-8 ring-blue-50">
                  <FileText className="h-10 w-10 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-700">No complaints found</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">You haven't submitted any complaints yet, or none match your search criteria.</p>
                </div>
              </div>
            </div>
          )}

          {!complaintLoading && complaints.length > 0 && (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/80 hover:from-gray-100 hover:to-gray-100">
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Event</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Type</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Description</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Status</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Created</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Resolved</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-6 text-sm uppercase tracking-wide">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint._id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 border-b border-gray-100/50">
                        <TableCell className="py-4 px-6">
                          <div className="font-semibold text-gray-900 max-w-32 truncate">
                            {complaint.eventId.name}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            {complaint.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="max-w-xs">
                            <p className="text-gray-800 line-clamp-2 text-sm leading-relaxed truncate">
                              {complaint.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${getStatusColor(complaint.status)} rounded-full px-3 py-1 text-xs font-semibold`}>
                            {complaint.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm text-gray-700 font-medium">
                            {new Date(complaint.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm text-gray-700">
                            {complaint.resolvedAt
                              ? new Date(complaint.resolvedAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : <span className="text-gray-400 italic">N/A</span>}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="max-w-xs text-sm text-gray-700 truncate">
                            {complaint.resolutionNotes || <span className="text-gray-400 italic">N/A</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint._id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">{complaint.eventId.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              {complaint.type}
                            </span>
                            <Badge className={`${getStatusColor(complaint.status)} rounded-full px-3 py-1 text-xs font-semibold`}>
                              {complaint.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/50 rounded-xl p-4">
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</label>
                        <p className="text-gray-800 mt-1 leading-relaxed">{complaint.description}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Created At</label>
                          <p className="text-gray-800 font-medium mt-1">
                            {new Date(complaint.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Resolved At</label>
                          <p className="text-gray-800 font-medium mt-1">
                            {complaint.resolvedAt
                              ? new Date(complaint.resolvedAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : <span className="text-gray-400 italic">N/A</span>}
                          </p>
                        </div>
                      </div>

                      {complaint.resolutionNotes && (
                        <div className="pt-4 border-t border-gray-200/50">
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Resolution Notes</label>
                          <div className="bg-green-50/50 rounded-xl p-3 mt-2">
                            <p className="text-green-800 text-sm">{complaint.resolutionNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!complaintLoading && complaints.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                onClick={() => setComplaintPage((prev) => Math.max(prev - 1, 1))}
                disabled={complaintPage === 1}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <div className="flex items-center bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  Page {complaintPage} of {complaintTotalPages}
                </span>
              </div>
              
              <Button
                onClick={() => setComplaintPage((prev) => prev + 1)}
                disabled={complaintPage === complaintTotalPages}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>

    <DialogFooter className="px-6 py-4 bg-gray-50/50 rounded-b-3xl -mx-6 -mb-6 border-t border-gray-200/50">
      <Button
        variant="outline"
        onClick={() => {
          setIsViewComplaintsModalOpen(false);
          setComplaintSearch("");
          setComplaintPage(1);
          setComplaints([]);
        }}
        className="w-full sm:w-auto rounded-xl border-gray-300 hover:bg-gray-50 h-11 px-8 font-medium"
      >
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
};

export default UserStalls;
