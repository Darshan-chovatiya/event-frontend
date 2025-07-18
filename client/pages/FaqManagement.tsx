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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  FileText,
  Trash2,
  Filter,
  Edit,
  Plus,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BaseUrl } from "@/sevice/Url";

interface Faq {
  _id?: string;
  question: string;
  answer: string;
  type: "event" | "general";
  eventId?: string;
  createdAt?: string;
  isDeleted?: boolean;
}

interface Event {
  _id: string;
  name: string;
}

const FaqManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingFaqs, setPendingFaqs] = useState<Faq[]>([]);
  const [newFaq, setNewFaq] = useState<Faq>({ question: "", answer: "", type: "general", eventId: "" });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const types = ["general", "event"];

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BaseUrl}/admin/get-event-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          page: 1,
          limit: 100, // Fetch a reasonable number of events
          search: null,
          fromDate: null,
          toDate: null,
          status: null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(data.data.docs.map((event: any) => ({
          _id: event._id,
          name: event.name,
        })));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to fetch events",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error fetching events",
      });
    }
  };

  const fetchFaqs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/get-faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          page: pagination.page,
          limit: pagination.limit,
          type: selectedType === "all" ? undefined : selectedType,
          eventId: eventId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch FAQs");
      }

      const data = await response.json();
      const mappedFaqs: Faq[] = data.data.docs
        .filter((faq: any) => !faq.isDeleted)
        .map((faq: any) => ({
          _id: faq._id,
          question: faq.question,
          answer: faq.answer,
          type: faq.type,
          eventId: faq.eventId || undefined,
          createdAt: faq.createdAt ? new Date(faq.createdAt).toISOString() : "",
          isDeleted: faq.isDeleted || false,
        }));

      setFaqs(mappedFaqs);
      setPagination({
        page: data.data.page,
        limit: data.data.limit,
        total: data.data.totalDocs,
        totalPages: data.data.totalPages,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch FAQs");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "super-admin") {
      fetchFaqs();
      fetchEvents();
    }
  }, [searchTerm, selectedType, eventId, pagination.page, user]);

  const handleDeleteFaq = async (faqId: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/delete-faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ id: faqId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete FAQ");
      }

      const data = await response.json();
      toast({ title: "Success", description: data.message || "FAQ deleted successfully" });
      fetchFaqs();
    } catch (err: any) {
      setError(err.message || "Failed to delete FAQ");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdatePendingFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Question and answer are required" });
      return;
    }
    if (newFaq.type === "event" && !newFaq.eventId) {
      toast({ variant: "destructive", title: "Error", description: "Event ID is required for event FAQs" });
      return;
    }

    setPendingFaqs((prev) => {
      if (editingIndex !== null) {
        const updatedFaqs = [...prev];
        updatedFaqs[editingIndex] = { ...newFaq };
        return updatedFaqs;
      }
      return [...prev, { ...newFaq }];
    });

    setNewFaq({ question: "", answer: "", type: "general", eventId: "" });
    setEditingIndex(null);
  };

  const handleEditPendingFaq = (index: number) => {
    setEditingIndex(index);
    setNewFaq({ ...pendingFaqs[index] });
  };

  const handleRemovePendingFaq = (index: number) => {
    setPendingFaqs((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewFaq({ question: "", answer: "", type: "general", eventId: "" });
    }
  };

  const handleSubmitFaqs = async () => {
    if (pendingFaqs.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No FAQs to submit" });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const payload = { faqs: pendingFaqs.map(faq => ({
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        eventId: faq.type === "event" ? faq.eventId : undefined,
      })) };

      const response = await fetch(`${BaseUrl}/admin/update-faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to process FAQs");
      }

      const data = await response.json();
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err: any) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: `FAQ "${err.faqItem.question}": ${err.error}`,
          });
        });
      }
      if (data.results && data.results.length > 0) {
        data.results.forEach((faq: any) => {
          toast({
            title: "Success",
            description: faq._id ? `FAQ "${faq.question}" updated successfully` : `FAQ "${faq.question}" created successfully`,
          });
        });
      }

      setIsDialogOpen(false);
      setPendingFaqs([]);
      setNewFaq({ question: "", answer: "", type: "general", eventId: "" });
      setEditingIndex(null);
      fetchFaqs();
    } catch (err: any) {
      setError(err.message || "Failed to process FAQs");
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (faq: Faq) => {
    setPendingFaqs([{ ...faq }]);
    setEditingIndex(0);
    setNewFaq({ ...faq });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setPendingFaqs([]);
    setEditingIndex(null);
    setNewFaq({ question: "", answer: "", type: "general", eventId: "" });
    setIsDialogOpen(true);
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
                  FAQ Management
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage FAQs,{" "}
                  <span className="font-semibold text-blue-600">{user?.username || "User"}</span>.
                </p>
              </div>
              <Button
                onClick={openCreateDialog}
                className="w-full lg:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New FAQ
              </Button>
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
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  disabled={loading}
                />
              </div>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
                disabled={loading}
              >
                <SelectTrigger className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={eventId}
                onValueChange={(value) => setEventId(value === "all" ? "" : value)}
                disabled={loading || selectedType === "general"}
              >
                <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl">
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      {event.name} ({event._id})
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
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced FAQs Table */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-white" />
              </div>
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/50">
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                      Question
                    </TableHead>
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                      Type
                    </TableHead>
                    <TableHead className="py-4 px-6 lg:px-8 text-sm font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                      Event ID
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
                  {faqs.map((faq) => (
                    <TableRow key={faq._id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors duration-200">
                      <TableCell className="py-4 px-6 lg:px-8">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-200 flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-medium text-gray-900 truncate">
                              {faq.question}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{faq.answer}</p>
                            <div className="flex items-center space-x-2 mt-1 sm:hidden">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                                faq.type === "general"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                              }`}>
                                {faq.type.charAt(0).toUpperCase() + faq.type.slice(1)}
                              </span>
                              {faq.eventId && (
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg border bg-purple-100 text-purple-800 border-purple-200">
                                  Event: {faq.eventId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`text-sm font-semibold px-2 py-1 rounded-lg border ${
                          faq.type === "general"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}>
                          {faq.type.charAt(0).toUpperCase() + faq.type.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {faq.eventId ? (
                          <span className="text-sm font-semibold px-2 py-1 rounded-lg border bg-purple-100 text-purple-800 border-purple-200">
                            {faq.eventId}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 hidden lg:table-cell">
                        {new Date(faq.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(faq)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFaq(faq._id!)}
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

        {/* Create/Update FAQ Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {editingIndex !== null ? "Edit FAQ" : "Add FAQs"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              {/* FAQ Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-sm font-semibold text-gray-700">
                    Question
                  </Label>
                  <Input
                    id="question"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="Enter FAQ question"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-sm font-semibold text-gray-700">
                    Answer
                  </Label>
                  <Input
                    id="answer"
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    placeholder="Enter FAQ answer"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    disabled={loading}
                  />
                </div>
                {editingIndex !== null ? "" : 
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                    Type
                  </Label>
                  <Select
                    value={newFaq.type}
                    onValueChange={(value: "general" | "event") => setNewFaq({ ...newFaq, type: value, eventId: value === "general" ? "" : newFaq.eventId })}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
}
                {newFaq.type === "event" && (
                  <div className="space-y-2">
                    <Label htmlFor="eventId" className="text-sm font-semibold text-gray-700">
                      Event
                    </Label>
                    <Select
                      value={newFaq.eventId}
                      onValueChange={(value) => setNewFaq({ ...newFaq, eventId: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl">
                        <SelectValue placeholder="Select Event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event._id} value={event._id}>
                            {event.name} ({event._id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={handleAddOrUpdatePendingFaq}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {editingIndex !== null ? "Update FAQ in List" : "Add FAQ to List"}
                </Button>
              </div>

              {/* Pending FAQs List */}
              {pendingFaqs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Pending FAQs</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingFaqs.map((faq, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-200"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{faq.question}</p>
                          <p className="text-xs text-gray-500 truncate">{faq.answer}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                              faq.type === "general"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}>
                              {faq.type.charAt(0).toUpperCase() + faq.type.slice(1)}
                            </span>
                            {faq.eventId && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-lg border bg-purple-100 text-purple-800 border-purple-200">
                                Event: {faq.eventId}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPendingFaq(index)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePendingFaq(index)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitFaqs}
                disabled={loading || pendingFaqs.length === 0}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Submitting...
                  </div>
                ) : (
                  `Submit ${pendingFaqs.length} FAQ${pendingFaqs.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FaqManagement;