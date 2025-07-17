import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { AmazonAws, BaseUrl } from "@/sevice/Url";

const Settings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Prefill mobile and avatar preview if user data is available
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setMobile(user.mobile || ""); // Prefill mobile if available
      // setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("id", user.id);
      formData.append("email", email);
      formData.append("mobile", mobile);
      if (avatar) {
        formData.append("avatar", avatar);
      }
      formData.append("role", user.role === "super-admin" ? "superadmin" : "subadmin");

      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/admin/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      const updatedUser: User = {
        id: data.data._id,
        username: data.data.email, // Using email as username for consistency
        email: data.data.email,
        role: data.data.role === "superadmin" ? "super-admin" : "sub-admin",
        avatar: data.data.avatar || undefined,
        mobile: data.data.mobile || undefined, // Include mobile in user object
      };

      // Update localStorage and AuthContext
      localStorage.setItem("adminUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess("Profile updated successfully");
      setAvatar(null); // Reset file input
      setAvatarPreview( null);
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">
          Update your profile information and preferences
        </p>
      </div>

      {/* Form Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Update Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
  <Label htmlFor="avatar" className="text-sm font-medium text-gray-700">
    Profile Picture
  </Label>
  <div className="flex items-center space-x-4">
    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
      {avatarPreview || user?.avatar ? (
        <img
          src={
            avatarPreview
              ? avatarPreview
              : `${AmazonAws}/${user?.avatar}`
          }
          alt="Profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-gray-500 text-lg font-semibold">
          {user?.email?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
    <div>
      <Input
        id="avatar"
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="h-11"
      />
      <p className="text-xs text-gray-500 mt-1">
        Upload a new profile picture (optional)
      </p>
    </div>
  </div>
</div>


            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-11"
                required
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                Mobile Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your mobile number"
                className="h-11"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;