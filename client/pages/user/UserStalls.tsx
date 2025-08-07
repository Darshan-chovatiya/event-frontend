import React, { useState, useEffect, useRef } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Store, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, MapPin, Users, Star, X } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

interface Event {
  _id: string;
  name: string;
  date: string;
  venue: { name: string; address: string } | null;
}

interface Stall {
  _id: string;
  stallNumber: string;
  boothId: {
    _id: string;
    name: string;
    hall: string;
    category: string;
    description: string;
    location: string;
  };
  eventId: {
    _id: string;
    name: string;
  };
  location: string;
  description: string;
  price: number;
  status: string;
  features: string[];
  applications: { exhibitorId: string; status: string }[];
}

interface Booth {
  _id: string;
  name: string;
  hall: string;
  category: string;
  description: string;
  location: string;
  stalls: Stall[];
}

const UserStalls: React.FC = () => {
  const { user } = useUserAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    email: "",
    mobile: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    } finally {
      setLoading(false);
    }
  };

  const fetchStalls = async (eventId: string) => {
    setError("");
    setSuccess("");
    setLoading(true);

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
          eventId,
          page: 1,
          limit: 10,
          category: selectedCategory || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch stalls");
      }

      const responseData = await response.json();
      setBooths(responseData.data.booths || []);
      setSuccess("Stalls loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch stalls. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (eventId: string) => {
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
      const uniqueCategories = [...new Set(
        responseData.data
          .map((booth: any) => booth.category)
          .filter((category: string) => category && category.trim() !== "")
      )];
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.message || "Failed to fetch categories. Please try again.");
    }
  };

  const handleApplyForStall = async () => {
    if (user?.role !== "exhibitor") {
      setError("Only exhibitors can apply for stalls");
      return;
    }

    if (!selectedStallId) {
      setError("No stall selected");
      return;
    }

    if (!formData.name || !formData.designation || !formData.email || !formData.mobile) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("stallId", selectedStallId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("designation", formData.designation);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile", formData.mobile);
      if (file) {
        formDataToSend.append("representatives", file);
      }

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

      setSuccess("Application submitted successfully");
      setIsModalOpen(false);
      setFormData({ name: "", designation: "", email: "", mobile: "" });
      setFile(null);
      if (selectedEvent) {
        fetchStalls(selectedEvent);
      }
    } catch (err: any) {
      setError(err.message || "Failed to apply for stall. Please try again.");
    }
  };

  const openModal = (stallId: string) => {
    setSelectedStallId(stallId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStallId(null);
    setFormData({ name: "", designation: "", email: "", mobile: "" });
    setFile(null);
    setError("");
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      fetchCategories(selectedEvent);
      fetchStalls(selectedEvent);
    }
  }, [selectedEvent, search, selectedCategory]);

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-slate-100 text-slate-700 border-slate-200";
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "reserved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleEventClick = (eventId: string) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
      setBooths([]);
      setCategories([]);
      setSearch("");
      setSelectedCategory("");
    } else {
      setSelectedEvent(eventId);
    }
    setTimeout(() => {
      if (eventId && eventRefs.current[eventId]) {
        eventRefs.current[eventId]?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
  };

  return (
    <div className=" bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-cyan-600/10 rounded-3xl"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative xl:flex justify-between bg-white/60 backdrop-blur-xl rounded-3xl sm:p-6 border border-white/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Event Stalls
                </h1>
                <p className="text-lg text-slate-600 mt-2">
                  {selectedEvent
                    ? `Discover ${user?.role === "exhibitor" ? "and apply for" : "and explore"} premium stalls`
                    : "Choose an event to explore available exhibition stalls"}
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 mt-6 xl:mt-0 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{events.length}</p>
                    <p className="text-sm text-slate-600">Active Events</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Store className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{booths.reduce((acc, booth) => acc + booth.stalls.length, 0)}</p>
                    <p className="text-sm text-slate-600">Available Stalls</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-xl">
                    <Users className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                    <p className="text-sm text-slate-600">Categories</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-0 bg-red-50/80 backdrop-blur-sm rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-0 bg-emerald-50/80 backdrop-blur-sm rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertDescription className="text-emerald-700 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        {/* Modal for Stall Application */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Apply for Stall</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="mt-1 rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="designation" className="text-sm font-medium text-slate-700">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Enter your designation"
                  className="mt-1 rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="mt-1 rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="mobile" className="text-sm font-medium text-slate-700">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter your mobile number"
                  className="mt-1 rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="image" className="text-sm font-medium text-slate-700">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1 rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={closeModal}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-2xl px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyForStall}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-2"
              >
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Events Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-slate-900 me-auto">Featured Events</h2>
            <Link to="/user/bookinghistory">
              <Button className=" bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-2">
                Booking History
              </Button>
            </Link>
          </div>

          {loading && !selectedEvent ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-600 font-medium">Loading events...</p>
              </div>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-6">
              {events.map((event, index) => (
                <div 
                  key={event._id} 
                  ref={(el) => (eventRefs.current[event._id] = el)}
                  className="animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="group">
                    {/* Event Card */}
                    <Card
                      className="relative border-0 shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm rounded-3xl cursor-pointer overflow-hidden"
                      onClick={() => handleEventClick(event._id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/50 to-purple-50/50"></div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
                      
                      <CardContent className="relative p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="h-8 w-8 text-indigo-600" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
                            </div>
                            
                            <div className="space-y-3">
                              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">
                                {event.name}
                              </h3>
                              <div className="flex items-center gap-6 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  <span className="font-medium">{event.venue?.name || "Venue TBA"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-slate-400" />
                                  <span className="font-medium">
                                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    }) : "Date TBA"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {selectedEvent === event._id && booths.length > 0 && (
                              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-4 py-2">
                                {booths.reduce((acc, booth) => acc + booth.stalls.length, 0)} Stalls Available
                              </Badge>
                            )}
                            <div className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 group-hover:scale-110 transition-transform duration-300">
                              {selectedEvent === event._id ? (
                                <ChevronUp className="h-6 w-6 text-indigo-600" />
                              ) : (
                                <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stalls Details - Collapsible Section */}
                    <div
                      className={`transition-all duration-700 ease-in-out overflow-hidden ${
                        selectedEvent === event._id 
                          ? "max-h-[5000px] opacity-100 translate-y-0" 
                          : "max-h-0 opacity-0 -translate-y-8"
                      }`}
                    >
                      {selectedEvent === event._id && (
                        <div className="mt-6 space-y-8 animate-in slide-in-from-top-8 duration-700">
                          {/* Search and Filter Controls */}
                          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-lg">
                            <div className="flex flex-col lg:flex-row gap-4">
                              <div className="relative flex-1">
                                <Input
                                  type="text"
                                  placeholder="Search stalls, halls, or descriptions..."
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                  className="pl-12 pr-4 py-4 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:shadow-lg transition-all duration-300"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                  <div className="p-1 bg-indigo-100 rounded-lg">
                                    <Store className="h-4 w-4 text-indigo-600" />
                                  </div>
                                </div>
                              </div>
                              <div className="lg:w-80">
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                  <SelectTrigger className="py-4 px-6 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500">
                                    <SelectValue placeholder="All Categories" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
                                    {categories.map((category) => (
                                      <SelectItem key={category} value={category} className="rounded-xl">
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Stalls Grid */}
                          {loading ? (
                            <div className="flex justify-center items-center h-64">
                              <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                <p className="text-slate-600 font-medium">Loading stalls...</p>
                              </div>
                            </div>
                          ) : booths.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {booths.map((booth, boothIndex) =>
                                booth.stalls.map((stall, stallIndex) => (
                                  <Card
                                    key={stall._id}
                                    className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${(boothIndex * booth.stalls.length + stallIndex) * 100}ms` }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-indigo-50/30"></div>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                    
                                    <CardContent className="relative p-6">
                                      {/* Stall Header */}
                                      <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-bold text-slate-900">{stall.stallNumber}</h4>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(stall.status)}`}>
                                              {stall.status}
                                            </span>
                                          </div>
                                          <p className="text-slate-600 font-medium">{booth.hall} • {booth.category}</p>
                                          <p className="text-sm text-slate-500">{stall.eventId.name}</p>
                                        </div>
                                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                          <Store className="h-6 w-6 text-indigo-600" />
                                        </div>
                                      </div>

                                      {/* Booth Details */}
                                      <div className="bg-slate-50/70 rounded-2xl p-4 mb-4 border border-slate-200">
                                        <h5 className="font-semibold text-slate-900 mb-2">Booth Information</h5>
                                        <div className="space-y-1 text-sm text-slate-600">
                                          <p><span className="font-medium">Name:</span> {booth.name}</p>
                                          <p><span className="font-medium">Category:</span> {booth.category}</p>
                                          <p><span className="font-medium">Location:</span> {booth.location || "Not specified"}</p>
                                        </div>
                                      </div>

                                      {/* Description */}
                                      <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                        {stall.description || "No description available"}
                                      </p>

                                      {/* Features */}
                                      {stall.features.length > 0 && (
                                        <div className="mb-6">
                                          <div className="flex flex-wrap gap-2">
                                            {stall.features.slice(0, 3).map((feature) => (
                                              <Badge key={feature} className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 transition-colors duration-200">
                                                {feature}
                                              </Badge>
                                            ))}
                                            {stall.features.length > 3 && (
                                              <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                                                +{stall.features.length - 3} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Price and Action */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Star className="h-4 w-4 text-amber-500" />
                                          <span className="text-2xl font-bold text-slate-900">${stall.price}</span>
                                        </div>
                                        
                                        {user?.role === "exhibitor" && stall.status === "pending" && (
                                          <Button
                                            onClick={() => openModal(stall._id)}
                                            disabled={stall.applications.some((app) => app.exhibitorId === user.id && app.status === "pending")}
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                          >
                                            {stall.applications.some((app) => app.exhibitorId === user.id && app.status === "pending")
                                              ? "Applied"
                                              : "Apply Now"}
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              )}
                            </div>
                          ) : (
                            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-xl rounded-3xl">
                              <CardContent className="p-12 text-center">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="p-6 bg-slate-100 rounded-3xl">
                                    <Store className="h-12 w-12 text-slate-400" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Stalls Available</h3>
                                    <p className="text-slate-600">There are currently no stalls available for this event. Check back later!</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-xl rounded-3xl">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-slate-100 rounded-3xl">
                    <Calendar className="h-12 w-12 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Events Available</h3>
                    <p className="text-slate-600">There are currently no events scheduled. New events will appear here when available.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStalls;