import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, MapPin, Store, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Booking {
  eventId: {
    _id: string;
    name: string;
    date: string;
    venue: { name: string; address: string } | null;
  };
  boothId: string;
  boothNumber: string;
  status: string;
  bookedAt: string;
}

interface BookingHistoryResponse {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const BookingHistory: React.FC = () => {
  const { user } = useUserAuth();
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBookingHistory = async () => {
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

      const response = await fetch(`${BaseUrl}/user/booking-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: search || undefined,
          page,
          limit,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch booking history");
      }

      const responseData: BookingHistoryResponse = await response.json();
      setBookingHistory(responseData.data || []);
      setTotalPages(responseData.totalPages || 1);
      setSuccess("Booking history loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch booking history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingHistory();
  }, [user, search, fromDate, toDate, page]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className=" bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-cyan-600/10 rounded-3xl"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>

          <div className="relative flex justify-between items-center bg-white/60 backdrop-blur-xl rounded-3xl sm:p-6 border border-white/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Booking History
                </h1>
                <p className="text-lg text-slate-600 mt-2">
                  View your past and current stall bookings
                </p>
              </div>
            </div>
            <Link to="/user/stalls">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-2">
                Back to Stalls
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 flex">
              <Input
                type="text"
                placeholder="Search by event name, venue, or booth number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 my-auto pr-4 py-4 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:shadow-lg transition-all duration-300"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <div className="p-1 bg-indigo-100 rounded-lg">
                  <Store className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <Label htmlFor="fromDate" className="text-sm font-medium text-slate-700">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className=" rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="toDate" className="text-sm font-medium text-slate-700">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className=" rounded-2xl border-0 bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking History Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="text-slate-600 font-medium">Loading booking history...</p>
            </div>
          </div>
        ) : bookingHistory.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bookingHistory.map((booking, index) => (
                <Card
                  key={booking.boothId}
                  className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-indigo-50/30"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  
                  <CardContent className="relative p-6">
                    {/* Booking Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-slate-900">{booking.eventId.name}</h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">Booth: {booking.boothNumber}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Store className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 mb-4">
                      <h5 className="font-semibold text-slate-900 mb-2">Event Information</h5>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p><span className="font-medium">Venue:</span> {booking.eventId.venue?.name || "Not specified"}</p>
                        <p><span className="font-medium">Date:</span> {booking.eventId.date ? new Date(booking.eventId.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : "Not specified"}</p>
                        <p><span className="font-medium">Booked At:</span> {booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-2 disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="text-slate-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-2 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-xl rounded-3xl">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-slate-100 rounded-3xl">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Booking History</h3>
                  <p className="text-slate-600">You have no bookings yet. Apply for stalls to see your history here!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;