import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserCheck,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle,
  Filter,
  TrendingUp,
  Eye,
  Clock,
} from "lucide-react";
import { BaseUrl } from "@/sevice/Url";

interface Stat {
  title: string;
  value: string | number;
  subValues?: { label: string; value: number }[];
  icon: React.ComponentType<{ className?: string }>;
  visibleTo: string[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);
  const [latestStalls, setLatestStalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStatistics = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/statistics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromDate, toDate }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(
          responseData.message ||
          `Failed to fetch statistics (Status: ${response.status})`
        );
      }

      const { data } = responseData;
      const newStats: Stat[] = [
        {
          title: "Stalls",
          value: data.stall.total,
          subValues: [
            { label: "Pending", value: data.stall.pending },
            { label: "Approved", value: data.stall.approved },
            { label: "Rejected", value: data.stall.rejected },
          ],
          icon: Users,
          visibleTo: ["super-admin", "sub-admin"],
        },
        {
          title: "Exhibitors",
          value: data.exhibitor.total,
          subValues: [
            { label: "Active", value: data.exhibitor.active },
            { label: "Inactive", value: data.exhibitor.inActive },
          ],
          icon: UserCheck,
          visibleTo: ["super-admin", "sub-admin"],
        },
        {
          title: "Visitors",
          value: data.visitor.total,
          subValues: [
            { label: "Active", value: data.visitor.active },
            { label: "Inactive", value: data.visitor.inActive },
          ],
          icon: Activity,
          visibleTo: ["super-admin", "sub-admin"],
        },
        {
          title: "Events",
          value: data.event.total,
          icon: Calendar,
          visibleTo: ["super-admin"],
        },
      ];

      setStats(newStats);
      setLatestStalls(data.latestStall || []);
      setSuccess(responseData.message || "Statistics loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch statistics. Please try again.");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleFilterSubmit = () => {
    fetchStatistics();
  };

  const getStatColor = (index: number) => {
    const colors = [
      { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600", accent: "bg-blue-500" },
      { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-600", accent: "bg-emerald-500" },
      { bg: "bg-purple-50", border: "border-purple-100", icon: "text-purple-600", accent: "bg-purple-500" },
      { bg: "bg-orange-50", border: "border-orange-100", icon: "text-orange-600", accent: "bg-orange-500" },
    ];
    return colors[index % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Welcome back, <span className="font-semibold text-blue-600">{user?.username || "User"}</span>! Here's your comprehensive overview.
                </p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Date Filters */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Filter className="h-5 w-5 text-white" />
              </div>
              Analytics Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="fromDate" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  From Date
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                  To Date
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                <Button
                  onClick={handleFilterSubmit}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Analyzing Data...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Apply Filters
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Alerts */}
        {/* <div className="space-y-4">
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
        </div> */}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats
            .filter((stat) => stat.visibleTo.includes(user?.role || ""))
            .map((stat, index) => {
              const Icon = stat.icon;
              const colors = getStatColor(index);
              return (
                <Card 
                  key={stat.title} 
                  className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-30`}></div>
                  <div className={`absolute top-0 left-0 w-full h-1 ${colors.accent}`}></div>
                  <CardContent className="relative p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {stat.title}
                        </p>
                        <p className="text-3xl lg:text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`h-14 w-14 ${colors.bg} ${colors.border} border-2 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                        <Icon className={`h-7 w-7 ${colors.icon}`} />
                      </div>
                    </div>
                    {stat.subValues && (
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        {stat.subValues.map((sub) => (
                          <div key={sub.label} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 font-medium">{sub.label}</span>
                            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${getStatusColor(sub.label)}`}>
                              {sub.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Enhanced Latest Stalls */}
        {latestStalls.length > 0 && user?.role && ["super-admin", "sub-admin"].includes(user.role) && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30"></div>
            <CardHeader className="relative border-b border-gray-100/50 bg-white/30 p-6 lg:p-8">
              <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                Latest Stalls Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Stall ID
                      </th>
                      <th className="text-left py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Stall Name
                      </th>
                      <th className="text-left py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {latestStalls.map((stall, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-blue-50/30 transition-colors duration-200 group"
                      >
                        <td className="py-4 px-6 lg:px-8">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center mr-3 group-hover:from-blue-200 group-hover:to-indigo-300 transition-all duration-200">
                              <span className="text-xs font-bold text-blue-700">
                                {(stall.id || `${index + 1}`).toString().slice(-2)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">
                              {stall.id || `Stall ${index + 1}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 lg:px-8">
                          <span className="font-medium text-gray-800">
                            {stall.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6 lg:px-8">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(stall.status)}`}>
                            <div className={`h-2 w-2 rounded-full mr-2 ${
                              stall.status?.toLowerCase() === 'approved' ? 'bg-green-500' :
                              stall.status?.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                              stall.status?.toLowerCase() === 'rejected' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}></div>
                            {stall.status || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;