import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users, Building2, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";

interface Lead {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  mobile?: string;
  status: string;
  leadModel: "Exhibitor" | "Visitor";
  capturedAt: string;
  message?: string | null;
}

interface Stat {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

const LeadsPage: React.FC = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stat[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeads = async () => {
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

      const response = await fetch(`${BaseUrl}/user/get-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          page,
          limit: 10,
          search: search || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch leads");
      }

      const responseData = await response.json();
      const leadData = responseData.data.docs || [];

      const newStats: Stat[] = [
        {
          title: "Total Leads",
          value: responseData.data.totalDocs || 0,
          icon: Users,
        },
        {
          title: "Exhibitor Leads",
          value: leadData.filter((l: Lead) => l.leadModel === "Exhibitor").length,
          icon: Building2,
        },
      ];

      setStats(newStats);
      setLeads(leadData);
      setTotalPages(responseData.data.totalPages || 1);
      setSuccess("Leads loaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to fetch leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user, search, page]);

  const getStatColor = (index: number) => {
    const colors = [
      { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600", accent: "bg-blue-500" },
      { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-600", accent: "bg-emerald-500" },
    ];
    return colors[index % colors.length];
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Leads
                </h1>
                <p className="text-gray-600 text-lg">
                  Browse all leads, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>!
                </p>
              </div>
              <Button
                onClick={() => navigate("/user/exhibitors")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Add Lead
              </Button>
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search leads by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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

        {loading && (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-500 font-medium">Loading leads...</p>
          </div>
        )}
        {leads.length === 0 && !loading && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6 text-center text-gray-600">
              No leads found.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = getStatColor(index);
            return (
              <Card
                key={stat.title}
                className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm rounded-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-30`}></div>
                <div className={`absolute top-0 left-0 w-full h-1 ${colors.accent}`}></div>
                <CardContent className="relative p-6 lg:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-3xl lg:text-4xl font-bold text-gray-900 group-hover:text-blue-600">{stat.value}</p>
                    </div>
                    <div
                      className={`h-14 w-14 ${colors.bg} ${colors.border} border-2 rounded-2xl flex items-center justify-center group-hover:scale-110`}
                    >
                      <Icon className={`h-7 w-7 ${colors.icon}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {leads.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100/50 bg-white/30">
              <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                Lead List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Company</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Type</th>
                      {/* <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th> */}
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Captured At</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-blue-50/30">
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{lead.name || "N/A"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-800">{lead.email || "N/A"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-800">{lead.companyName || "N/A"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-800">{lead.leadModel || "N/A"}</span>
                        </td>
                        {/* <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                            {lead.status || "N/A"}
                          </span>
                        </td> */}
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-800">
                            {new Date(lead.capturedAt).toLocaleDateString() || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-800">{lead.message || "No message"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {leads.length > 0 && (
          <div className="flex justify-between mt-4">
            <Button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;