import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, AlertCircle, CheckCircle, Upload, Trash2, FileText } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";
import Swal from "sweetalert2";

interface GalleryImage {
  _id: string;
  fileUrl: string;
  description?: string;
  uploadDate: string;
}

const Gallery: React.FC = () => {
  const { user } = useUserAuth();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    width: "320px",
  });

  const fetchGalleryImages = async () => {
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

      const response = await fetch(`${BaseUrl}/user/get-gallery-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page: 1, limit: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch gallery images");
      }

      const responseData = await response.json();
      const images = responseData.data.docs || [];
      setGalleryImages(
        images.map((img: any) => ({
          _id: img._id,
          fileUrl: img.fileUrl,
          description: img.description,
          uploadDate: img.uploadDate,
        }))
      );
      toast.fire({
        icon: "success",
        title: "Gallery images loaded successfully",
      });
    } catch (err: any) {
      toast.fire({
        icon: "error",
        title: err.message || "Failed to fetch gallery images. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.fire({
        icon: "error",
        title: "Please select an image to upload",
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
      formData.append("galleryImage", file);
      if (description) formData.append("description", description);

      const response = await fetch(`${BaseUrl}/user/upload-gallery-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      await response.json();
      toast.fire({
        icon: "success",
        title: "Image uploaded successfully",
      });
      setFile(null);
      setDescription("");
      fetchGalleryImages(); // Refresh gallery
    } catch (err: any) {
      toast.fire({
        icon: "error",
        title: err.message || "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This image will be deleted from your gallery!",
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

          const response = await fetch(`${BaseUrl}/user/delete-gallery-image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete image");
          }

          toast.fire({
            icon: "success",
            title: "Image deleted successfully",
          });
          fetchGalleryImages(); // Refresh gallery
        } catch (err: any) {
          toast.fire({
            icon: "error",
            title: err.message || "Failed to delete image. Please try again.",
          });
        }
      }
    });
  };

  useEffect(() => {
    fetchGalleryImages();
  }, [user]);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Gallery
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>! Manage your event gallery.
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-gray-100/30">
            <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Upload className="h-5 w-5 text-white" />
              </div>
              Upload New Image
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-end">
              {/* File Upload Section */}
              <div className="flex-1 min-w-0">
                <Label htmlFor="image" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                  <Upload className="h-4 w-4 mr-2 text-indigo-500" />
                  Select Image
                </Label>
                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-12 bg-white/70 border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-indigo-400/20 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              {/* Description Section */}
              <div className="flex-1 min-w-0">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-purple-500" />
                  Description (Optional)
                </Label>
                <Input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter image description..."
                  className="h-12 bg-white/70 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>

              {/* Upload Button Section */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed min-w-[140px]"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Loading gallery images...</p>
            </CardContent>
          </Card>
        ) : galleryImages.length > 0 ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100/50 bg-gray-50/30">
              <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Image className="h-5 w-5 text-white" />
                </div>
                Event Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {galleryImages.map((image) => (
                  <div
                    key={image._id}
                    className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <img
                      src={image.fileUrl}
                      alt={image.description || "Gallery Image"}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {image.description && (
                        <p className="text-sm text-gray-200">{image.description}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">
                        Uploaded: {new Date(image.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                      onClick={() => handleDelete(image._id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No images available in the gallery.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Gallery;