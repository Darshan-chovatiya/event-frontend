import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Upload, Trash2, FileText, Edit } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import Swal from "sweetalert2";

interface Service {
  _id: string;
  name: string;
  serviceImages: string[];
  description?: string;
  createdAt: string;
}

const Services: React.FC = () => {
  const { user } = useUserAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [expandedImages, setExpandedImages] = useState<{ [key: string]: boolean }>({});

  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    width: "320px",
  });

  const fetchServices = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!user) {
      toast.fire({
        icon: "error",
        title: "User not authenticated",
      });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/get-services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page: 1, limit: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch services");
      }

      const responseData = await response.json();
      const items = responseData.data.docs || [];
      setServices(
        items.map((item: any) => ({
          _id: item._id,
          name: item.name,
          serviceImages: Array.isArray(item.images) ? item.images : [],
          description: item.description,
          createdAt: item.createdAt,
        }))
      );
      toast.fire({
        icon: "success",
        title: "Services loaded successfully",
      });
    } catch (err: any) {
      toast.fire({
        icon: "error",
        title: err.message || "Failed to fetch services. Please try again.",
      });
      setError(err.message || "Failed to fetch services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
      const filePreviews = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
      setPreviewImages(filePreviews);
    }
  };

  const handleUpload = async () => {
    if (!name) {
      toast.fire({
        icon: "error",
        title: "Please provide a service name",
      });
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formData = new FormData();
      if (files && files.length > 0) {
        Array.from(files).forEach((file) => {
          formData.append("serviceImages", file);
        });
      } else if (editingServiceId) {
        // Include existing images if no new files are selected
        const service = services.find((s) => s._id === editingServiceId);
        if (service && service.serviceImages.length > 0) {
          service.serviceImages.forEach((imageUrl) => {
            formData.append("existingImages", imageUrl);
          });
        }
      }
      formData.append("name", name);
      if (description) formData.append("description", description);
      if (editingServiceId) formData.append("id", editingServiceId);

      const response = await fetch(`${BaseUrl}/user/update-services`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save service");
      }

      await response.json();
      toast.fire({
        icon: "success",
        title: editingServiceId ? "Service updated successfully" : "Service added successfully",
      });
      setFiles(null);
      setName("");
      setDescription("");
      setEditingServiceId(null);
      setPreviewImages([]);
      setExpandedImages({});
      fetchServices();
    } catch (err: any) {
      toast.fire({
        icon: "error",
        title: err.message || "Failed to save service. Please try again.",
      });
      setError(err.message || "Failed to save service. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This service will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          if (!token) {
            throw new Error("No authentication token found");
          }

          const response = await fetch(`${BaseUrl}/user/delete-services`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ serviceId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete service");
          }

          toast.fire({
            icon: "success",
            title: "Service deleted successfully",
          });
          fetchServices();
        } catch (err: any) {
          toast.fire({
            icon: "error",
            title: err.message || "Failed to delete service. Please try again.",
          });
          setError(err.message || "Failed to delete service. Please try again.");
        }
      }
    });
  };

  const handleEdit = (service: Service) => {
    setName(service.name);
    setDescription(service.description || "");
    setEditingServiceId(service._id);
    setFiles(null);
    setPreviewImages(service.serviceImages);
    setExpandedImages({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleImages = (serviceId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Services
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>! Manage your services.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Add/Update Service Form (Left Side) */}
          <div className="lg:w-1/3">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden sticky top-8">
              <CardHeader className="border-b border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-gray-100/30">
                <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  {editingServiceId ? "Update Service" : "Add New Service"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Name Section */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                      Service Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter service name..."
                      className="h-12 bg-white/70 border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-indigo-400/20 transition-all duration-200 placeholder:text-gray-400"
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <Label htmlFor="images" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Upload className="h-4 w-4 mr-2 text-indigo-500" />
                      Select Images (Optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="h-12 bg-white/70 border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-indigo-400/20 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Image Previews */}
                  {previewImages.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                        <Image className="h-4 w-4 mr-2 text-purple-500" />
                        Image Previews
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(expandedImages["edit"] ? previewImages : previewImages.slice(0, 3)).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/150";
                            }}
                          />
                        ))}
                        {previewImages.length > 3 && !expandedImages["edit"] && (
                          <div
                            className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 cursor-pointer"
                            onClick={() => toggleImages("edit")}
                          >
                            <span className="text-gray-600">+{previewImages.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description Section */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <FileText className="h-4 w-4 mr-2 text-purple-500" />
                      Description (Optional)
                    </Label>
                    <Input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description..."
                      className="h-12 bg-white/70 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Upload/Update Button Section */}
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !name}
                    className="w-full h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        {editingServiceId ? "Updating..." : "Uploading..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Upload className="h-4 w-4 mr-2" />
                        {editingServiceId ? "Update Service" : "Add Service"}
                      </div>
                    )}
                  </Button>

                  {/* Cancel Edit Button */}
                  {editingServiceId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setName("");
                        setDescription("");
                        setFiles(null);
                        setEditingServiceId(null);
                        setPreviewImages([]);
                        setExpandedImages({});
                      }}
                      className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Details Table (Right Side) */}
          <div className="lg:w-2/3">
            {loading ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">Loading services...</p>
                </CardContent>
              </Card>
            ) : services.length > 0 ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardHeader className="border-b border-gray-100/50 bg-gray-50/30">
                  <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Image className="h-5 w-5 text-white" />
                    </div>
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead className="bg-gray-100/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-800">Name</th>
                          <th className="px-4 py-3 font-semibold text-gray-800">Images</th>
                          <th className="px-4 py-3 font-semibold text-gray-800">Description</th>
                          <th className="px-4 py-3 font-semibold text-gray-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <tr key={service._id} className="border-b border-gray-100/50 hover:bg-gray-50/50">
                            <td className="px-4 py-3">{service.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {service.serviceImages.length > 0 ? (
                                  <>
                                    {(expandedImages[service._id] ? service.serviceImages : service.serviceImages.slice(0, 3)).map((image, index) => (
                                      <img
                                        key={index}
                                        src={image}
                                        alt={`${service.name} ${index + 1}`}
                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                          e.currentTarget.src = "https://via.placeholder.com/150";
                                        }}
                                      />
                                    ))}
                                    {service.serviceImages.length > 3 && !expandedImages[service._id] && (
                                      <span
                                        className="text-gray-600 cursor-pointer"
                                        onClick={() => toggleImages(service._id)}
                                      >
                                        +{service.serviceImages.length - 3} more
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-500">No Images</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{service.description || '-'}</td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                                  onClick={() => handleDelete(service._id)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">No services available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;