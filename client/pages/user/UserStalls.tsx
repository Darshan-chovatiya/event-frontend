import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Store, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        //   status: user?.role === "exhibitor" ? "pending" : undefined,
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
      // Filter out invalid categories (null, undefined, or empty strings)
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

  const handleApplyForStall = async (stallId: string) => {
    if (user?.role !== "exhibitor") {
      setError("Only exhibitors can apply for stalls");
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/apply-stall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stallId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply for stall");
      }

      setSuccess("Application submitted successfully");
      if (selectedEvent) {
        fetchStalls(selectedEvent);
      }
    } catch (err: any) {
      setError(err.message || "Failed to apply for stall. Please try again.");
    }
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
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "reserved":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Stalls
            </h1>
            <p className="text-gray-600 text-lg">
              {selectedEvent
                ? `Browse ${user?.role === "exhibitor" ? "and apply for" : "and view"} stalls for the selected event`
                : "Select an event to view available stalls"}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-0 shadow-lg bg-red-50/80 backdrop-blur-sm rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="border-0 shadow-lg bg-green-50/80 backdrop-blur-sm rounded-xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        {!selectedEvent ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Events</h2>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {events.map((event) => (
                  <Card
                    key={event._id}
                    className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm rounded-2xl cursor-pointer"
                    onClick={() => setSelectedEvent(event._id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 opacity-30"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <CardContent className="relative p-6 lg:p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-gray-900">{event.name}</p>
                          <p className="text-sm text-gray-600">{event.venue?.name || "Venue not specified"}</p>
                          <p className="text-sm text-gray-500">{event.date ? new Date(event.date).toLocaleDateString() : "Date not specified"}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">No events available</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Stalls for {events.find((e) => e._id === selectedEvent)?.name || "Selected Event"}</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedEvent(null);
                  setSearch("");
                  setSelectedCategory("");
                }}
                className="bg-white/80 hover:bg-white text-gray-900 rounded-xl"
              >
                Back to Events
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Search stalls or halls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 sm:w-1/2 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="p-3 rounded-lg sm:w-1/2 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="All Categories" />
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
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : booths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {booths.map((booth) =>
                  booth.stalls.map((stall) => (
                    <Card
                      key={stall._id}
                      className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm rounded-2xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 opacity-30"></div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                      <CardContent className="relative p-6 lg:p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-gray-900">{stall.stallNumber}</p>
                            <p className="text-sm text-gray-600">{booth.hall} - {booth.category}</p>
                            <p className="text-sm text-gray-500">{stall.eventId.name}</p>
                          </div>
                          <div className="h-12 w-12 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110">
                            <Store className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{stall.description || "No description available"}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {stall.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="bg-blue-100 text-blue-800">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-4">Price: ${stall.price}</p>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(stall.status)}`}>
                            {stall.status}
                          </span>
                          {user?.role === "exhibitor" && stall.status === "pending" && (
                            <Button
                              onClick={() => handleApplyForStall(stall._id)}
                              disabled={stall.applications.some((app) => app.exhibitorId === user.id && app.status === "pending")}
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                            >
                              {stall.applications.some((app) => app.exhibitorId === user.id && app.status === "pending")
                                ? "Applied"
                                : "Apply"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">No stalls available for this event</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStalls;