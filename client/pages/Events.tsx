import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Plus,
  MapPin,
  FileImage,
  Globe,
  AlertCircle,
  Eye,
  ChevronRight,
  ChevronLeft,
  Users,
  DollarSign,
  Mic,
  FileText,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AmazonAws, BaseUrl } from "@/sevice/Url";
import Schedules from "./Schedules";

interface Event {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
  venue: { name: string; address: string };
  description: string;
  socialMedia: { facebook?: string; twitter?: string; linkdin?: string };
  status: string;
  createdAt: string;
  schedules: { date: string | null; activities: { startTime: string; endTime: string; title: string; description: string }[] }[];
  mapUrl?: string;
  floorPlanUrl?: string;
}

interface Sponsor {
  _id?: string;
  name: string;
  description: string;
  logoUrl?: string;
  logoFile?: File | null;
}

interface Speaker {
  _id?: string;
  name: string;
  bio: string;
  designation: string;
  profilePicture?: string;
  profileFile?: File | null;
}

interface Complaint {
  _id: string;
  eventId: { _id: string; name: string };
  userId: { _id: string; name: string };
  type: string;
  description: string;
  status: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isComplaintsOpen, setIsComplaintsOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentViewEvent, setCurrentViewEvent] = useState<Event | null>(null);
  const [currentComplaintEvent, setCurrentComplaintEvent] = useState<Event | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintPage, setComplaintPage] = useState(1);
  const [complaintTotalPages, setComplaintTotalPages] = useState(1);
  const [resolvingComplaintId, setResolvingComplaintId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    date: "",
    venueName: "",
    address: "",
    description: "",
    facebook: "",
    twitter: "",
    linkdin: "",
    map: null as File | null,
    floor: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [deletedSponsors, setDeletedSponsors] = useState<string[]>([]);
  const [deletedSpeakers, setDeletedSpeakers] = useState<string[]>([]);
  const [viewSponsors, setViewSponsors] = useState<Sponsor[]>([]);
  const [viewSpeakers, setViewSpeakers] = useState<Speaker[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BaseUrl}/admin/get-event-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          page,
          limit: 10,
          search: search || null,
          fromDate: null,
          toDate: null,
          status: null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(data.data.docs);
        setTotalPages(data.data.totalPages);
      } else {
        setError(data.message || "Failed to fetch events");
        toast({
          title: "Error",
          description: data.message || "Failed to fetch events",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Error fetching events");
      toast({
        title: "Error",
        description: "Error fetching events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async (eventId: string, page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${BaseUrl}/admin/get-complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          page,
          limit: 10,
          search: "",
          eventId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setComplaints(data.data.docs);
        setComplaintTotalPages(data.data.totalPages);
      } else {
        setError(data.message || "Failed to fetch complaints");
        toast({
          title: "Error",
          description: data.message || "Failed to fetch complaints",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Error fetching complaints");
      toast({
        title: "Error",
        description: "Error fetching complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    if (!resolutionNotes.trim()) {
      toast({
        title: "Error",
        description: "Resolution notes are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BaseUrl}/admin/resolve-complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          id: complaintId,
          resolutionNotes,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Complaint resolved successfully",
          className: "bg-green-500 text-white",
        });
        setResolutionNotes("");
        setResolvingComplaintId(null);
        if (currentComplaintEvent) {
          fetchComplaints(currentComplaintEvent._id, complaintPage);
        }
      } else {
        setError(data.message || "Failed to resolve complaint");
        toast({
          title: "Error",
          description: data.message || "Failed to resolve complaint",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Error resolving complaint");
      toast({
        title: "Error",
        description: "Error resolving complaint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search]);

  useEffect(() => {
    if (currentEvent) {
      fetchSponsors(currentEvent._id);
      fetchSpeakers(currentEvent._id);
    } else {
      setSponsors([]);
      setSpeakers([]);
    }
    setDeletedSponsors([]);
    setDeletedSpeakers([]);
  }, [currentEvent]);

  useEffect(() => {
    if (currentViewEvent) {
      fetchSponsors(currentViewEvent._id, true);
      fetchSpeakers(currentViewEvent._id, true);
    }
  }, [currentViewEvent]);

  useEffect(() => {
    if (currentComplaintEvent) {
      fetchComplaints(currentComplaintEvent._id, complaintPage);
    }
  }, [currentComplaintEvent, complaintPage]);

  const fetchSponsors = async (eventId: string, forView = false) => {
    try {
      const response = await fetch(`${BaseUrl}/admin/get-sponsors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();
      if (response.ok) {
        if (forView) {
          setViewSponsors(data.data);
        } else {
          setSponsors(data.data.map((s: Sponsor) => ({ ...s, logoFile: null })));
        }
      }
    } catch {}
  };

  const fetchSpeakers = async (eventId: string, forView = false) => {
    try {
      const response = await fetch(`${BaseUrl}/admin/get-speakers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();
      if (response.ok) {
        if (forView) {
          setViewSpeakers(data.data);
        } else {
          setSpeakers(data.data.map((s: Speaker) => ({ ...s, profileFile: null })));
        }
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${BaseUrl}/admin/delete-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ title: "Event deleted successfully", className: "bg-green-500 text-white" });
        fetchEvents();
      } else {
        setError(data.message || "Failed to delete event");
        toast({
          title: "Error",
          description: data.message || "Failed to delete event",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Error deleting event");
      toast({
        title: "Error",
        description: "Error deleting event",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    const statusOrder = ["pending", "completed", "cancelled"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    try {
      const response = await fetch(`${BaseUrl}/admin/update-event-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ title: `Event status updated to ${nextStatus}`, className: "bg-green-500 text-white" });
        fetchEvents();
      } else {
        setError(data.message || "Failed to update event status");
        toast({
          title: "Error",
          description: data.message || "Failed to update event status",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Error updating event status");
      toast({
        title: "Error",
        description: "Error updating event status",
        variant: "destructive",
      });
    }
  };

  const validateField = (name: string, value: any) => {
    const errors: { [key: string]: string } = { ...formErrors };

    switch (name) {
      case "name":
        if (!value.trim()) {
          errors.name = "Event name is required";
        } else {
          delete errors.name;
        }
        break;
      case "date":
        if (!value) {
          errors.date = "Date is required";
        } else {
          delete errors.date;
        }
        break;
      case "startTime":
        if (!value) {
          errors.startTime = "Start time is required";
        } else {
          delete errors.startTime;
        }
        if (value && formData.endTime && value >= formData.endTime) {
          errors.endTime = "End time must be after start time";
        } else if (formData.endTime) {
          delete errors.endTime;
        }
        break;
      case "endTime":
        if (!value) {
          errors.endTime = "End time is required";
        } else if (formData.startTime && value <= formData.startTime) {
          errors.endTime = "End time must be after start time";
        } else {
          delete errors.endTime;
        }
        break;
      case "venueName":
        if (!value.trim()) {
          errors.venueName = "Venue name is required";
        } else {
          delete errors.venueName;
        }
        break;
      case "address":
        if (!value.trim()) {
          errors.address = "Address is required";
        } else {
          delete errors.address;
        }
        break;
      case "description":
        if (!value.trim()) {
          errors.description = "Description is required";
        } else {
          delete errors.description;
        }
        break;
      case "facebook":
        if (!value.trim()) {
          errors.facebook = "Facebook URL is required";
        } else if (!isValidUrl(value)) {
          errors.facebook = "Invalid Facebook URL";
        } else {
          delete errors.facebook;
        }
        break;
      case "twitter":
        if (!value.trim()) {
          errors.twitter = "Twitter URL is required";
        } else if (!isValidUrl(value)) {
          errors.twitter = "Invalid Twitter URL";
        } else {
          delete errors.twitter;
        }
        break;
      case "linkdin":
        if (!value.trim()) {
          errors.linkdin = "LinkedIn URL is required";
        } else if (!isValidUrl(value)) {
          errors.linkdin = "Invalid LinkedIn URL";
        } else {
          delete errors.linkdin;
        }
        break;
      case "map":
        if (!currentEvent && !value) {
          errors.map = "Map image is required";
        } else if (value && !value.type.startsWith('image/')) {
          errors.map = "Map must be an image file";
        } else {
          delete errors.map;
        }
        break;
      case "floor":
        if (!currentEvent && !value) {
          errors.floor = "Floor plan image is required";
        } else if (value && !value.type.startsWith('image/')) {
          errors.floor = "Floor plan must be an image file";
        } else {
          delete errors.floor;
        }
        break;
    }

    setFormErrors(errors);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) errors.name = "Event name is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.startTime) errors.startTime = "Start time is required";
    if (!formData.endTime) errors.endTime = "End time is required";
    if (!formData.venueName.trim()) errors.venueName = "Venue name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    
    if (!formData.facebook.trim()) errors.facebook = "Facebook URL is required";
    else if (!isValidUrl(formData.facebook)) errors.facebook = "Invalid Facebook URL";
    
    if (!formData.twitter.trim()) errors.twitter = "Twitter URL is required";
    else if (!isValidUrl(formData.twitter)) errors.twitter = "Invalid Twitter URL";
    
    if (!formData.linkdin.trim()) errors.linkdin = "LinkedIn URL is required";
    else if (!isValidUrl(formData.linkdin)) errors.linkdin = "Invalid LinkedIn URL";

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.endTime = "End time must be after start time";
    }

    if (!currentEvent) {
      if (!formData.map) errors.map = "Map image is required";
      if (!formData.floor) errors.floor = "Floor plan image is required";
    }

    if (formData.map && !formData.map.type.startsWith('image/')) {
      errors.map = "Map must be an image file";
    }
    if (formData.floor && !formData.floor.type.startsWith('image/')) {
      errors.floor = "Floor plan must be an image file";
    }

    sponsors.forEach((sponsor, index) => {
      if (!sponsor.name.trim()) errors[`sponsorName-${index}`] = "Sponsor name is required";
      if (sponsor.logoFile && !sponsor.logoFile.type.startsWith('image/')) errors[`sponsorLogo-${index}`] = "Logo must be an image";
    });

    speakers.forEach((speaker, index) => {
      if (!speaker.name.trim()) errors[`speakerName-${index}`] = "Speaker name is required";
      if (speaker.profileFile && !speaker.profileFile.type.startsWith('image/')) errors[`speakerProfile-${index}`] = "Profile picture must be an image";
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const formatTimeForAPI = (time: string, date: string) => {
    if (!time || !date) return "";
    const [hour, minute] = time.split(":");
    const fullDate = new Date(date);
    fullDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
    return fullDate.toISOString();
  };

  const formatDateForAPI = (date: string) => {
    if (!date) return "";
    return new Date(date).toISOString();
  };

  const formatTimeForInput = (dateTime: string) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeForDisplay = (dateTime: string) => {
    if (!dateTime) return "Not set";
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    }
  };

  const getComplaintStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: files ? files[0] : value,
    }));
    validateField(id, files ? files[0] : value);
  };

  const addSponsor = () => {
    setSponsors([...sponsors, { name: '', description: '', logoFile: null }]);
  };

  const removeSponsor = (index: number) => {
    const sponsor = sponsors[index];
    if (sponsor._id) {
      setDeletedSponsors([...deletedSponsors, sponsor._id]);
    }
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const handleSponsorChange = (index: number, field: string, value: string | File) => {
    const newSponsors = [...sponsors];
    newSponsors[index][field === 'logo' ? 'logoFile' : field] = value;
    setSponsors(newSponsors);
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: '', bio: '', designation: '', profileFile: null }]);
  };

  const removeSpeaker = (index: number) => {
    const speaker = speakers[index];
    if (speaker._id) {
      setDeletedSpeakers([...deletedSpeakers, speaker._id]);
    }
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleSpeakerChange = (index: number, field: string, value: string | File) => {
    const newSpeakers = [...speakers];
    newSpeakers[index][field === 'profile' ? 'profileFile' : field] = value;
    setSpeakers(newSpeakers);
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let eventId = currentEvent?._id;

      const eventForm = new FormData();
      eventForm.append("name", formData.name);
      eventForm.append("startTime", formatTimeForAPI(formData.startTime, formData.date));
      eventForm.append("endTime", formatTimeForAPI(formData.endTime, formData.date));
      eventForm.append("date", formatDateForAPI(formData.date));
      eventForm.append("venueName", formData.venueName);
      eventForm.append("address", formData.address);
      eventForm.append("description", formData.description);
      eventForm.append("facebook", formData.facebook);
      eventForm.append("twitter", formData.twitter);
      eventForm.append("linkdin", formData.linkdin);
      if (formData.map) eventForm.append("map", formData.map);
      if (formData.floor) eventForm.append("floor", formData.floor);

      let res;
      if (currentEvent) {
        eventForm.append("id", currentEvent._id);
        res = await fetch(`${BaseUrl}/admin/update-event-details`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: eventForm,
        });
      } else {
        res = await fetch(`${BaseUrl}/admin/update-event-details`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: eventForm,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to save event",
          variant: "destructive",
        });
        return;
      }

      eventId = data.data._id || currentEvent?._id;

      for (const id of deletedSponsors) {
        await fetch(`${BaseUrl}/admin/delete-sponsor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ id }),
        });
      }

      for (const sponsor of sponsors) {
        const sponsorForm = new FormData();
        sponsorForm.append("name", sponsor.name);
        sponsorForm.append("description", sponsor.description || "");
        if (sponsor.logoFile) sponsorForm.append("logo", sponsor.logoFile);

        if (sponsor._id) {
          sponsorForm.append("id", sponsor._id);
          await fetch(`${BaseUrl}/admin/update-sponsor`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: sponsorForm,
          });
        } else {
          sponsorForm.append("eventId", eventId);
          await fetch(`${BaseUrl}/admin/add-sponsor`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: sponsorForm,
          });
        }
      }

      for (const id of deletedSpeakers) {
        await fetch(`${BaseUrl}/admin/delete-speaker`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ id }),
        });
      }

      for (const speaker of speakers) {
        const speakerForm = new FormData();
        speakerForm.append("name", speaker.name);
        speakerForm.append("bio", speaker.bio || "");
        speakerForm.append("designation", speaker.designation || "");
        if (speaker.profileFile) speakerForm.append("profilePicture", speaker.profileFile);

        if (speaker._id) {
          speakerForm.append("id", speaker._id);
          await fetch(`${BaseUrl}/admin/update-speaker`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: speakerForm,
          });
        } else {
          speakerForm.append("eventId", eventId);
          await fetch(`${BaseUrl}/admin/add-speaker`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: speakerForm,
          });
        }
      }

      toast({
        title: currentEvent ? "Event updated successfully" : "Event created successfully",
        className: "bg-green-500 text-white",
      });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        startTime: "",
        endTime: "",
        date: "",
        venueName: "",
        address: "",
        description: "",
        facebook: "",
        twitter: "",
        linkdin: "",
        map: null,
        floor: null,
      });
      setFormErrors({});
      setCurrentEvent(null);
      setSponsors([]);
      setSpeakers([]);
      setDeletedSponsors([]);
      setDeletedSpeakers([]);
      fetchEvents();
    } catch (err) {
      toast({
        title: "Error",
        description: "Error saving event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (event?: Event) => {
    if (event) {
      setCurrentEvent(event);
      const date = event.date ? new Date(event.date).toISOString().split("T")[0] : "";
      const startTime = formatTimeForInput(event.startTime);
      const endTime = formatTimeForInput(event.endTime);
      setFormData({
        name: event.name || "",
        startTime,
        endTime,
        date,
        venueName: event.venue.name || "",
        address: event.venue.address || "",
        description: event.description || "",
        facebook: event.socialMedia.facebook || "",
        twitter: event.socialMedia.twitter || "",
        linkdin: event.socialMedia.linkdin || "",
        map: null,
        floor: null,
      });
      setFormErrors({});
    } else {
      setCurrentEvent(null);
      setFormData({
        name: "",
        startTime: "",
        endTime: "",
        date: "",
        venueName: "",
        address: "",
        description: "",
        facebook: "",
        twitter: "",
        linkdin: "",
        map: null,
        floor: null,
      });
      setFormErrors({});
    }
    setIsDialogOpen(true);
  };

  const openComplaintsDialog = (event: Event) => {
    setCurrentComplaintEvent(event);
    setComplaints([]);
    setComplaintPage(1);
    setIsComplaintsOpen(true);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Event Management
                </h1>
                <p className="text-gray-600 text-lg">
                  Create, manage, and track all your events in one place
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{events.length} Events</span>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      onClick={() => openDialog()}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="pb-4 border-b border-gray-100">
                      <DialogTitle className="text-2xl font-bold flex items-center text-gray-900">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        {currentEvent ? "Edit Event" : "Create New Event"}
                      </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="details" className="space-y-6 p-6">
                      <TabsList>
                        <TabsTrigger value="details">Event Details</TabsTrigger>
                        <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
                        <TabsTrigger value="speakers">Speakers</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details">
                        {Object.keys(formErrors).length > 0 && (
                          <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm border-red-200 rounded-xl">
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription>
                              {Object.values(formErrors).map((err, index) => (
                                <div key={index} className="text-red-700 font-medium">{err}</div>
                              ))}
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="bg-blue-50/50 rounded-xl p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                            Basic Information
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-gray-700 font-semibold flex items-center">
                                Event Name <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter event name"
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.name ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"} focus:ring-4 focus:ring-blue-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="date" className="text-gray-700 font-semibold flex items-center">
                                Event Date <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.date ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"} focus:ring-4 focus:ring-blue-500/20`}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="startTime" className="text-gray-700 font-semibold flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Start Time <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.startTime ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"} focus:ring-4 focus:ring-blue-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="endTime" className="text-gray-700 font-semibold flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                End Time <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={handleInputChange}
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.endTime ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"} focus:ring-4 focus:ring-blue-500/20`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-emerald-50/50 rounded-xl p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                            Venue Information
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="venueName" className="text-gray-700 font-semibold">
                                Venue Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="venueName"
                                value={formData.venueName}
                                onChange={handleInputChange}
                                placeholder="Enter venue name"
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.venueName ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-emerald-500"} focus:ring-4 focus:ring-emerald-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address" className="text-gray-700 font-semibold">
                                Address <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Enter full address"
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.address ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-emerald-500"} focus:ring-4 focus:ring-emerald-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description" className="text-gray-700 font-semibold">
                                Description <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter event description"
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.description ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-emerald-500"} focus:ring-4 focus:ring-emerald-500/20`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50/50 rounded-xl p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Globe className="h-5 w-5 mr-2 text-purple-600" />
                            Social Media Links
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="facebook" className="text-gray-700 font-semibold">
                                Facebook URL <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="facebook"
                                value={formData.facebook}
                                onChange={handleInputChange}
                                placeholder="https://facebook.com/..."
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.facebook ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-purple-500"} focus:ring-4 focus:ring-purple-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="twitter" className="text-gray-700 font-semibold">
                                Twitter URL <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="twitter"
                                value={formData.twitter}
                                onChange={handleInputChange}
                                placeholder="https://twitter.com/..."
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.twitter ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-purple-500"} focus:ring-4 focus:ring-purple-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="linkdin" className="text-gray-700 font-semibold">
                                LinkedIn URL <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="linkdin"
                                value={formData.linkdin}
                                onChange={handleInputChange}
                                placeholder="https://linkedin.com/..."
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.linkdin ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-purple-500"} focus:ring-4 focus:ring-purple-500/20`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-orange-50/50 rounded-xl p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FileImage className="h-5 w-5 mr-2 text-orange-600" />
                            Event Images
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="map" className="text-gray-700 font-semibold">
                                Map Image {currentEvent ? "" : <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                id="map"
                                type="file"
                                accept="image/*"
                                onChange={handleInputChange}
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.map ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-orange-500"} focus:ring-4 focus:ring-orange-500/20`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="floor" className="text-gray-700 font-semibold">
                                Floor Plan {currentEvent ? "" : <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                id="floor"
                                type="file"
                                accept="image/*"
                                onChange={handleInputChange}
                                className={`h-12 rounded-xl border-2 transition-all duration-200 ${formErrors.floor ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-orange-500"} focus:ring-4 focus:ring-orange-500/20`}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="sponsors">
                        <div className="space-y-4">
                          {sponsors.map((sponsor, index) => (
                            <div key={index} className="bg-white rounded-xl p-4 space-y-4 border border-gray-100">
                              <div className="flex justify-between items-center">
                                <h4 className="text-md font-semibold text-gray-800">Sponsor {index + 1}</h4>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSponsor(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`sponsor-name-${index}`}>Name *</Label>
                                <Input
                                  id={`sponsor-name-${index}`}
                                  value={sponsor.name}
                                  onChange={(e) => handleSponsorChange(index, 'name', e.target.value)}
                                  className={formErrors[`sponsorName-${index}`] ? "border-red-300" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`sponsor-description-${index}`}>Description</Label>
                                <Input
                                  id={`sponsor-description-${index}`}
                                  value={sponsor.description}
                                  onChange={(e) => handleSponsorChange(index, 'description', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Logo</Label>
                                {sponsor.logoUrl && <img src={`${AmazonAws}/${sponsor.logoUrl}`} alt="Sponsor logo" className="w-20 h-20 object-cover" />}
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSponsorChange(index, 'logo', e.target.files?.[0] || null)}
                                  className={formErrors[`sponsorLogo-${index}`] ? "border-red-300" : ""}
                                />
                              </div>
                            </div>
                          ))}
                          <Button onClick={addSponsor} variant="outline" className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Sponsor
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="speakers">
                        <div className="space-y-4">
                          {speakers.map((speaker, index) => (
                            <div key={index} className="bg-white rounded-xl p-4 space-y-4 border border-gray-100">
                              <div className="flex justify-between items-center">
                                <h4 className="text-md font-semibold text-gray-800">Speaker {index + 1}</h4>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSpeaker(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`speaker-name-${index}`}>Name *</Label>
                                <Input
                                  id={`speaker-name-${index}`}
                                  value={speaker.name}
                                  onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                                  className={formErrors[`speakerName-${index}`] ? "border-red-300" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`speaker-bio-${index}`}>Bio</Label>
                                <Input
                                  id={`speaker-bio-${index}`}
                                  value={speaker.bio}
                                  onChange={(e) => handleSpeakerChange(index, 'bio', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`speaker-designation-${index}`}>Designation</Label>
                                <Input
                                  id={`speaker-designation-${index}`}
                                  value={speaker.designation}
                                  onChange={(e) => handleSpeakerChange(index, 'designation', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Profile Picture</Label>
                                {speaker.profilePicture && <img src={`${AmazonAws}/${speaker.profilePicture}`} alt="Speaker profile" className="w-24 h-24 object-cover" />}
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSpeakerChange(index, 'profile', e.target.files?.[0] || null)}
                                  className={formErrors[`speakerProfile-${index}`] ? "border-red-300" : ""}
                                />
                              </div>
                            </div>
                          ))}
                          <Button onClick={addSpeaker} variant="outline" className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Speaker
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleCreateOrUpdate}
                        disabled={loading || Object.keys(formErrors).length > 0}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        {loading ? "Saving..." : currentEvent ? "Update Event" : "Create Event"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-100/50 bg-white/30 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                Events Overview
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="border-gray-200 hover:bg-gray-50 rounded-xl h-12 px-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-xl px-4 py-2">
                    <span className="text-sm font-medium text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="border-gray-200 hover:bg-gray-50 rounded-xl h-12 px-4"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-6">
                <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                </Alert>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/70">
                    <TableHead className="font-bold text-gray-700 py-6 px-6">Event Name</TableHead>
                    <TableHead className="font-bold text-gray-700 py-6 px-6">Date / Time</TableHead>
                    <TableHead className="font-bold text-gray-700 py-6 px-6">Venue</TableHead>
                    <TableHead className="font-bold text-gray-700 py-6 px-6">Description</TableHead>
                    <TableHead className="font-bold text-gray-700 py-6 px-6">Status</TableHead>
                    <TableHead className="font-bold text-gray-700 py-6 px-6">Schedules</TableHead>
                    <TableHead className="text-right font-bold text-gray-700 py-6 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                          <p className="text-gray-500 font-medium">Loading events...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-600">No events found</p>
                            <p className="text-sm text-gray-500">Create your first event to get started</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow 
                        key={event._id} 
                        className="hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-50 group"
                      >
                        <TableCell className="py-6 px-6">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {event.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">{formatDate(event.date)}</span>
                          </div>
                          <span>{formatTimeForDisplay(event.startTime)} / {formatTimeForDisplay(event.endTime)}</span>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {event.venue.name || "Not set"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 max-w-xs truncate">
                              {event.venue.address || "Address not set"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <p className="text-sm text-gray-700 max-w-xs truncate">
                            {event.description || "No description"}
                          </p>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(event._id, event.status)}
                            className={`rounded-xl border-2 font-semibold transition-all duration-200 hover:scale-105 ${getStatusColor(event.status)}`}
                          >
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(event.status)}
                              <span className="capitalize">{event.status}</span>
                            </div>
                          </Button>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <Schedules event={event} onSuccess={fetchEvents} />Schedule
                        </TableCell>
                        <TableCell className="text-right py-6 px-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setCurrentViewEvent(event); setIsViewOpen(true); }}
                              className="h-10 w-10 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDialog(event)}
                              className="h-10 w-10 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(event._id)}
                              className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openComplaintsDialog(event)}
                              className="h-10 w-10 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-xl transition-all duration-200"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-2xl font-bold flex items-center text-gray-900">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                View Event: {currentViewEvent?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              <div className="bg-blue-50/50 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <p><strong>Name:</strong> {currentViewEvent?.name}</p>
                <p><strong>Date:</strong> {formatDate(currentViewEvent?.date || '')}</p>
                <p><strong>Start Time:</strong> {formatTimeForDisplay(currentViewEvent?.startTime || '')}</p>
                <p><strong>End Time:</strong> {formatTimeForDisplay(currentViewEvent?.endTime || '')}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-semibold">Venue Information</h3>
                <p><strong>Venue Name:</strong> {currentViewEvent?.venue.name}</p>
                <p><strong>Address:</strong> {currentViewEvent?.venue.address}</p>
                <p><strong>Description:</strong> {currentViewEvent?.description}</p>
              </div>
              <div className="bg-purple-50/50 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-semibold">Social Media</h3>
                <p><strong>Facebook:</strong> {currentViewEvent?.socialMedia.facebook}</p>
                <p><strong>Twitter:</strong> {currentViewEvent?.socialMedia.twitter}</p>
                <p><strong>LinkedIn:</strong> {currentViewEvent?.socialMedia.linkdin}</p>
              </div>
              <div className="bg-orange-50/50 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-semibold">Images</h3>
                {currentViewEvent?.mapUrl && <img src={`${AmazonAws}/${currentViewEvent?.mapUrl}`} alt="Map" className="w-48" />}
                {currentViewEvent?.floorPlanUrl && <img src={`${AmazonAws}/${currentViewEvent?.floorPlanUrl}`} alt="Floor Plan" className="w-48" />}
              </div>
              <div className="bg-yellow-50/50 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" /> Sponsors
                </h3>
                {viewSponsors.map((sponsor, index) => (
                  <div key={index} className="bg-white p-2 rounded-md">
                    <p><strong>Name:</strong> {sponsor.name}</p>
                    <p><strong>Description:</strong> {sponsor.description}</p>
                    {sponsor.logoUrl && <img src={`${AmazonAws}/${sponsor.logoUrl}`} alt="Logo" className="w-20 h-20" />}
                  </div>
                ))}
                {viewSponsors.length === 0 && <p>No sponsors</p>}
              </div>
              <div className="bg-pink-50/50 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <Mic className="h-5 w-5 mr-2" /> Speakers
                </h3>
                {viewSpeakers.map((speaker, index) => (
                  <div key={index} className="bg-white p-2 rounded-md">
                    <p><strong>Name:</strong> {speaker.name}</p>
                    <p><strong>Bio:</strong> {speaker.bio}</p>
                    <p><strong>Designation:</strong> {speaker.designation}</p>
                    {speaker.profilePicture && <img src={`${AmazonAws}/${speaker.profilePicture}`} alt="Profile" className="w-24" />}
                  </div>
                ))}
                {viewSpeakers.length === 0 && <p>No speakers</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isComplaintsOpen} onOpenChange={setIsComplaintsOpen}>
          <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-2xl font-bold flex items-center text-gray-900">
                <div className="h-8 w-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Complaints for {currentComplaintEvent?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50/80 backdrop-blur-sm border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                </Alert>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/70">
                      <TableHead className="font-bold text-gray-700 py-4 px-4">User</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4 px-4">Type</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4 px-4">Description</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4 px-4">Status</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4 px-4">Created At</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4 px-4">Resolved At</TableHead>
                      <TableHead className="text-right font-bold text-gray-700 py-4 px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-gray-500 font-medium">Loading complaints...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : complaints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-medium text-gray-600">No complaints found</p>
                              <p className="text-sm text-gray-500">No complaints have been submitted for this event</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      complaints.map((complaint) => (
                        <TableRow key={complaint._id} className="hover:bg-yellow-50/30 transition-all duration-200 border-b border-gray-50">
                          <TableCell className="py-4 px-4">{complaint.userId.name}</TableCell>
                          <TableCell className="py-4 px-4">{complaint.type}</TableCell>
                          <TableCell className="py-4 px-4 max-w-xs truncate">{complaint.description}</TableCell>
                          <TableCell className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getComplaintStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {formatDate(complaint.createdAt)}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {complaint.resolvedAt ? formatDate(complaint.resolvedAt) : "Not resolved"}
                          </TableCell>
                          <TableCell className="text-right py-4 px-4">
                            {complaint.status === "Pending" ? (
                              resolvingComplaintId === complaint._id ? (
                                <div className="flex flex-col items-end gap-2">
                                  <Input
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Enter resolution notes"
                                    className="h-10 rounded-xl"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setResolvingComplaintId(null)}
                                      className="rounded-xl"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleResolveComplaint(complaint._id)}
                                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl"
                                      disabled={loading}
                                    >
                                      {loading ? "Resolving..." : "Resolve"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setResolvingComplaintId(complaint._id)}
                                  className="h-10 w-10 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )
                            ) : (
                              <div className="text-sm text-gray-600">
                                {complaint.resolutionNotes || "Resolved"}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {complaints.length > 0 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={complaintPage === 1}
                    onClick={() => setComplaintPage(complaintPage - 1)}
                    className="border-gray-200 hover:bg-gray-50 rounded-xl h-10 px-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-xl px-4 py-2">
                    <span className="text-sm font-medium text-gray-600">
                      Page {complaintPage} of {complaintTotalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={complaintPage === complaintTotalPages}
                    onClick={() => setComplaintPage(complaintPage + 1)}
                    className="border-gray-200 hover:bg-gray-50 rounded-xl h-10 px-4"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Events;