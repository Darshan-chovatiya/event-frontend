import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, CheckCircle, AlertCircle } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";

const UserProfile: React.FC = () => {
  const { user, setUser } = useUserAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setMobile(user?.mobile || "");
    setCompanyName(user?.companyName || "");
  }, [user]);

  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!name || !email || !mobile || (user?.role === "exhibitor" && !companyName)) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/updateProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: user?.id, name, email, mobile, companyName: user?.role === "exhibitor" ? companyName : undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      setUser({ ...user!, name, email, mobile, companyName: user?.role === "exhibitor" ? companyName : undefined });
      localStorage.setItem("userData", JSON.stringify({ ...user!, name, email, mobile, companyName: user?.role === "exhibitor" ? companyName : undefined }));
      setSuccess("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Profile
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your profile, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>.
            </p>
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

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-lg rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-xl font-bold flex items-center text-gray-800">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-white" />
              </div>
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 lg:p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              {user?.role === "exhibitor" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700">Mobile</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;