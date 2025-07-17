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
      setMobile(user.mobile || "");
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
      setAvatarPreview(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 mx-auto">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-gray-600 text-lg">
                Update your profile information, <span className="font-semibold text-blue-600">{user?.username || "User"}</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Alerts */}
        <div className="space-y-4 ">
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
        </div>

        {/* Enhanced Form Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl max-w-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-white" />
              </div>
              Update Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 lg:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-sm font-semibold text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  Profile Picture
                </Label>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-200">
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
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a new profile picture (optional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2 text-purple-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
                  required
                />
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Save Changes
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;