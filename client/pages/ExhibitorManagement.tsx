import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Trash2,
  Download,
  Filter,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BaseUrl, AmazonAws } from "@/sevice/Url";

interface Exhibitor {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  mobile: string;
  status: "active" | "inActive";
  profileImage?: string;
  createdAt: string;
  isDeleted: boolean;
}

const ExhibitorManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const statuses = ["active", "inActive"];

  const fetchExhibitors = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/get-exhibitor-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          search: searchTerm,
          status: selectedStatus === "all" ? undefined : selectedStatus,
          page: pagination.page,
          limit: pagination.limit,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch exhibitors");
      }

      const data = await response.json();
      const mappedExhibitors: Exhibitor[] = data.data.docs
        .filter((exhibitor: any) => !exhibitor.isDeleted)
        .map((exhibitor: any) => ({
          _id: exhibitor._id,
          name: exhibitor.name || "Unnamed",
          email: exhibitor.email,
          companyName: exhibitor.companyName || "N/A",
          mobile: exhibitor.mobile || "N/A",
          status: exhibitor.status,
          profileImage: exhibitor.profileImage || undefined,
          createdAt: exhibitor.createdAt ? new Date(exhibitor.createdAt).toISOString() : "",
          isDeleted: exhibitor.isDeleted || false,
        }));

      setExhibitors(mappedExhibitors);
      setPagination({
        page: data.data.page,
        limit: data.data.limit,
        total: data.data.totalDocs,
        totalPages: data.data.totalPages,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch exhibitors");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "super-admin") {
      fetchExhibitors();
    }
  }, [searchTerm, selectedStatus, pagination.page, user]);

  const handleDeleteExhibitor = async (exhibitorId: string) => {
    if (!window.confirm("Are you sure you want to delete this exhibitor?")) return;

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/delete-exhibitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ id: exhibitorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete exhibitor");
      }

      const data = await response.json();
      toast({ title: "Success", description: data.message || "Exhibitor deleted successfully" });
      fetchExhibitors();
    } catch (err: any) {
      setError(err.message || "Failed to delete exhibitor");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (exhibitorId: string, status: "active" | "inActive") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/update-exhibitor-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ id: exhibitorId, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update status");
      }

      const data = await response.json();
      toast({ title: "Success", description: data.message || "Status updated successfully" });
      fetchExhibitors();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMedia = async (exhibitorId: string, exhibitorName: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/download-exhibitor-media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        body: JSON.stringify({ _id: exhibitorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to download media");
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || "application/pdf";
      const fileExtension = contentType === "application/pdf" ? "pdf" : "bin";
      const sanitizedName = exhibitorName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const fileName = `${sanitizedName}_resume.${fileExtension}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Media downloaded successfully" });
    } catch (err: any) {
      setError(err.message || "Failed to download media");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
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
                  Exhibitor Management
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage exhibitor accounts,{" "}
                  <span className="font-semibold text-blue-600">{user?.username || "User"}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Filter className="h-5 w-5 text-white" />
              </div>
              </CardTitle>
            </CardHeader>
          <CardContent className="relative p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <Input
                    placeholder="Search exhibitors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={loading}
              >
                <SelectTrigger className="w-full sm:w-[200px] h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-0 shadow-lg bg-red-50/80 backdrop-blur-sm rounded-xl">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Exhibitors Table */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-white" />
              </div>
              Exhibitors
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/50">
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                      Exhibitor
                    </TableHead>
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                      Company
                    </TableHead>
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Created At
                    </TableHead>
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exhibitors.map((exhibitor) => (
                    <TableRow key={exhibitor._id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors duration-200">
                      <TableCell className="py-4 px-6 lg:px-8">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-200 flex-shrink-0">
                            {exhibitor.profileImage ? (
                              <img
                                src={`${AmazonAws}/${exhibitor.profileImage}`}
                                alt={exhibitor.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-blue-700">
                                {exhibitor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-medium text-gray-900 truncate">
                              {exhibitor.name}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-4 w-4 mr-1 flex-shrink-0 text-blue-500" />
                              <span className="truncate">{exhibitor.email}</span>
                            </div>
                            {exhibitor.mobile && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="h-4 w-4 mr-1 flex-shrink-0 text-purple-500" />
                                <span className="truncate">{exhibitor.mobile}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 mt-1 sm:hidden">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                              >
                                {exhibitor.companyName}
                              </Badge>
                              <Badge
                                variant={exhibitor.status === "active" ? "default" : "secondary"}
                                className={`text-xs ${
                                  exhibitor.status === "active"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }`}
                              >
                                {exhibitor?.status?.charAt(0).toUpperCase() + exhibitor?.status?.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {exhibitor.companyName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          {exhibitor.status === "active" ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-600" />
                          )}
                          <Select
                            value={exhibitor.status}
                            onValueChange={(value: "active" | "inActive") =>
                              handleStatusUpdate(exhibitor._id, value)
                            }
                            disabled={loading}
                          >
                            <SelectTrigger
                              className={`w-[100px] h-10 rounded-xl ${
                                exhibitor.status === "active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 hidden lg:table-cell">
                        {new Date(exhibitor.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadMedia(exhibitor._id, exhibitor.name)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                            disabled={loading}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExhibitor(exhibitor._id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center p-6 lg:p-8 gap-4">
              <Button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1 || loading}
                className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Previous
              </Button>
              <span className="text-gray-600 font-medium">
                Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
              </span>
              <Button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages || loading}
                className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExhibitorManagement;