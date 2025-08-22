import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { BaseUrl } from "@/sevice/Url";
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  AlertCircle,
  User,
  BookOpen,
} from "lucide-react";
import { DialogTrigger } from "@radix-ui/react-dialog";

interface Speaker {
  _id: string;
  name: string;
}

interface Activity {
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  speakerId?: string;
}

interface ScheduleFormData {
  eventId: string;
  isCommon: boolean;
  date: string;
  activities: Activity[];
}

interface Event {
  _id: string;
  name: string;
  date: string;
}

interface SchedulesProps {
  event: Event;
  onSuccess: () => void;
}

const Schedules: React.FC<SchedulesProps> = ({ event, onSuccess }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    eventId: event._id,
    isCommon: true,
    date: "",
    activities: [{ startTime: "", endTime: "", title: "", description: "", speakerId: ""}],
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const response = await fetch(`${BaseUrl}/admin/get-speakers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ eventId: event._id }),
        });
        const data = await response.json();
        if (response.ok) {
          setSpeakers(data.data || []);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch speakers",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Error fetching speakers",
          variant: "destructive",
        });
      }
    };

    if (isDialogOpen) {
      fetchSpeakers();
    }
  }, [isDialogOpen, event._id]);

  const validateField = (index: number, field: string, value: string) => {
    const errors: { [key: string]: string } = { ...formErrors };
    const key = `${field}-${index}`;

    switch (field) {
      case "startTime":
        if (!value) {
          errors[key] = "Start time is required";
        } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          errors[key] = "Invalid time format (HH:MM)";
        } else {
          delete errors[key];
        }
        break;
      case "endTime":
        if (!value) {
          errors[key] = "End time is required";
        } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          errors[key] = "Invalid time format (HH:MM)";
        } else if (formData.activities[index].startTime && value <= formData.activities[index].startTime) {
          errors[key] = "End time must be after start time";
        } else {
          delete errors[key];
        }
        break;
      case "title":
        if (!value.trim()) {
          errors[key] = "Title is required";
        } else {
          delete errors[key];
        }
        break;
    }

    setFormErrors(errors);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.isCommon && !formData.date) {
      errors.date = "Date is required for date-specific schedules";
    } else if (formData.date) {
      const scheduleDate = new Date(formData.date);
      const eventDate = new Date(event.date);
      if (isNaN(scheduleDate.getTime()) || 
          scheduleDate < new Date(eventDate.setHours(0, 0, 0, 0)) || 
          scheduleDate > new Date(eventDate.setHours(23, 59, 59, 999))) {
        errors.date = "Schedule date must be within event date";
      }
    }

    formData.activities.forEach((activity, index) => {
      if (!activity.startTime) errors[`startTime-${index}`] = "Start time is required";
      else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(activity.startTime)) {
        errors[`startTime-${index}`] = "Invalid time format (HH:MM)";
      }

      if (!activity.endTime) errors[`endTime-${index}`] = "End time is required";
      else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(activity.endTime)) {
        errors[`endTime-${index}`] = "Invalid time format (HH:MM)";
      } else if (activity.startTime && activity.endTime <= activity.startTime) {
        errors[`endTime-${index}`] = "End time must be after start time";
      }

      if (!activity.title.trim()) errors[`title-${index}`] = "Title is required";
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const newActivities = [...formData.activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setFormData({ ...formData, activities: newActivities });
    validateField(index, field, value);
  };

  const addActivity = () => {
    setFormData({
      ...formData,
      activities: [...formData.activities, { startTime: "", endTime: "", title: "", description: "", speakerId: ""}],
    });
  };

  const removeActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
    const errors = { ...formErrors };
    Object.keys(errors).forEach((key) => {
      if (key.startsWith(`startTime-${index}`) || 
          key.startsWith(`endTime-${index}`) || 
          key.startsWith(`title-${index}`) ||
          key.startsWith(`speakerId-${index}`)
      ) {
        delete errors[key];
      }
    });
    setFormErrors(errors);
  };

  const handleSubmit = async () => {
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
      const response = await fetch(`${BaseUrl}/admin/add-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Schedule saved successfully",
          className: "bg-green-500 text-white",
        });
        setIsDialogOpen(false);
        setFormData({
          eventId: event._id,
          isCommon: true,
          date: "",
          activities: [{ startTime: "", endTime: "", title: "", description: "", speakerId: "" }],
        });
        setFormErrors({});
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save schedule",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error saving schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold flex items-center text-gray-900">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Manage Schedule for {event.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
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
              Schedule Details
            </h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="isCommon"
                checked={formData.isCommon}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isCommon: checked, date: checked ? "" : formData.date })
                }
              />
              <Label htmlFor="isCommon" className="text-gray-700 font-semibold">
                Common Schedule (applies to all days)
              </Label>
            </div>
            {!formData.isCommon && (
              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-700 font-semibold">
                  Schedule Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                    formErrors.date ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                  } focus:ring-4 focus:ring-blue-500/20`}
                />
              </div>
            )}
            {formData.activities.map((activity, index) => (
              <div key={index} className="bg-white rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-semibold text-gray-800">Activity {index + 1}</h4>
                  {formData.activities.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeActivity(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`startTime-${index}`} className="text-gray-700 font-semibold">
                      <Clock className="h-4 w-4 mr-1 inline" />
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`startTime-${index}`}
                      type="time"
                      value={activity.startTime}
                      onChange={(e) => handleInputChange(index, "startTime", e.target.value)}
                      className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                        formErrors[`startTime-${index}`]
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      } focus:ring-4 focus:ring-blue-500/20`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`endTime-${index}`} className="text-gray-700 font-semibold">
                      <Clock className="h-4 w-4 mr-1 inline" />
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`endTime-${index}`}
                      type="time"
                      value={activity.endTime}
                      onChange={(e) => handleInputChange(index, "endTime", e.target.value)}
                      className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                        formErrors[`endTime-${index}`]
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      } focus:ring-4 focus:ring-blue-500/20`}
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor={`title-${index}`} className="text-gray-700 font-semibold">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`title-${index}`}
                      value={activity.title}
                      onChange={(e) => handleInputChange(index, "title", e.target.value)}
                      placeholder="Enter activity title"
                      className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                        formErrors[`title-${index}`]
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      } focus:ring-4 focus:ring-blue-500/20`}
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor={`speakerId-${index}`} className="text-gray-700 font-semibold">
                      <User className="h-4 w-4 mr-1 inline" />
                      Speaker
                    </Label>
                    <Select
                      value={activity.speakerId}
                      onValueChange={(value) => handleInputChange(index, "speakerId", value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select a speaker " />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem> No speaker</SelectItem>
                        {speakers.map((speaker) => (
                          <SelectItem key={speaker._id} value={speaker._id}>
                            {speaker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label htmlFor={`description-${index}`} className="text-gray-700 font-semibold">
                      Description
                    </Label>
                    <Input
                      id={`description-${index}`}
                      value={activity.description}
                      onChange={(e) => handleInputChange(index, "description", e.target.value)}
                      placeholder="Enter activity description"
                      className="h-12 rounded-xl border-2 transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={addActivity}
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-blue-200 hover:bg-blue-50 text-blue-600 font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading || Object.keys(formErrors).length > 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Schedules;