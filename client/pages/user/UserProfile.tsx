import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Mail, Building2, Phone, Globe, Target, FileText, Tag, Lightbulb, Facebook, Twitter, Linkedin, Camera } from "lucide-react";
import { AmazonAws, BaseUrl } from "@/sevice/Url";
import { dataURLtoFile, generateQRCodeDataURL } from "./qrGenerator";

const UserProfile: React.FC = () => {
  const { user, setUser } = useUserAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    companyName: "",
    designation: "",
    companyWebsite: "",
    bio: "",
    keywords: "",
    insights: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    focusSector: ""
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        companyName: user.companyName || "",
        designation: user.designation || "",
        companyWebsite: user.companyWebsite || "",
        bio: user.bio || "",
        keywords: user.keywords?.join(", ") || "",
        insights: user.insights || "",
        facebook: user.socialMedia?.facebook || "",
        twitter: user.socialMedia?.twitter || "",
        linkedin: user.socialMedia?.linkedin || "",
        focusSector: user.focusSector || ""
      });

      // Set image previews from existing user data
      if (user.profileImage) {
        setProfileImagePreview(`${AmazonAws}/${user.profileImage}`);
      }
      if (user.coverImage) {
        setCoverImagePreview(`${AmazonAws}/${user.coverImage}`);
      }
      if (user.companyLogo) {
        setCompanyLogoPreview(`${AmazonAws}/${user.companyLogo}`);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    switch (type) {
      case 'profile':
        setProfileImage(file);
        setProfileImagePreview(previewUrl);
        break;
      case 'cover':
        setCoverImage(file);
        setCoverImagePreview(previewUrl);
        break;
      case 'logo':
        setCompanyLogo(file);
        setCompanyLogoPreview(previewUrl);
        break;
    }
  };

  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate required fields
    const requiredFields = [
      'name', 'email', 'mobile', 'designation', 
      'companyWebsite', 'bio', 'keywords', 'insights',
      'facebook', 'twitter', 'linkedin', 'focusSector'
    ];
    
    if (user?.role === "exhibitor") {
      requiredFields.push('companyName');
      if (!profileImage && !user?.profileImage) {
      setError("Pofile Image is required for exhibitors");
      setIsLoading(false);
      return;
    }
    if (!coverImage && !user?.coverImage) {
      setError("Cover Image is required for exhibitors");
      setIsLoading(false);
      return;
    }
      if (!companyLogo && !user?.companyLogo) {
      setError("Company logo is required for exhibitors");
      setIsLoading(false);
      return;
    }
    }

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("id", user?.id || "");
      
      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value);
        }
      });

      // Append images only if they were changed
      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      } else if (user?.profileImage) {
        formDataToSend.append("existingProfileImage", user.profileImage);
      }
      
      if (coverImage) {
        formDataToSend.append("coverImage", coverImage);
      } else if (user?.coverImage) {
        formDataToSend.append("existingCoverImage", user.coverImage);
      }
      
      if (companyLogo) {
        formDataToSend.append("companyLogo", companyLogo);
      } else if (user?.companyLogo) {
        formDataToSend.append("existingCompanyLogo", user.companyLogo);
      }

      const response = await fetch(`${BaseUrl}/user/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
        
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();
      const qrDataUrl = await generateQRCodeDataURL(updatedUser.data._id);
      
    const qrCodeFile = dataURLtoFile(qrDataUrl, `qr-${updatedUser.data._id}.png`);

     // 3. Upload QR code to backend
    const qrFormData = new FormData();
    qrFormData.append('qrCode', qrCodeFile);

    const qrResponse = await fetch(`${BaseUrl}/user/update-qr`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: qrFormData,
    });

    if (!qrResponse.ok) {
      throw new Error("Failed to update QR code");
    }

    const qrData = await qrResponse.json();
      
      // Update user context with new data
      const updatedUserData = {
        ...user!,
        ...formData,
        keywords: formData.keywords.split(", ").map(k => k.trim()),
        socialMedia: { 
          facebook: formData.facebook, 
          twitter: formData.twitter, 
          linkedin: formData.linkedin 
        },
        profileImage: updatedUser.data.profileImage || user?.profileImage,
        coverImage: updatedUser.data.coverImage || user?.coverImage,
        companyLogo: updatedUser.data.companyLogo || user?.companyLogo,
        qrCode: qrData.data.qrCode || user?.qrCode,
      };

      setUser(updatedUserData);
      localStorage.setItem("userData", JSON.stringify(updatedUserData));
      
      setSuccess("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BaseUrl}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleChangePassword();
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Profile Information Card */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
                <CardHeader className="relative bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-gray-100/50">
                  <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-4 shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-500" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-purple-500" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-green-500" />
                          Mobile Number
                        </Label>
                        <Input
                          id="mobile"
                          name="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="designation" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
                          Designation
                        </Label>
                        <Input
                          id="designation"
                          name="designation"
                          type="text"
                          value={formData.designation}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Company & Professional Information */}
                    <div className="space-y-6">
                      {user?.role === "exhibitor" && (
                        <div className="space-y-3">
                          <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700 flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                            Company Name
                          </Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            type="text"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label htmlFor="companyWebsite" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-purple-500" />
                          Company Website
                        </Label>
                        <Input
                          id="companyWebsite"
                          name="companyWebsite"
                          type="url"
                          value={formData.companyWebsite}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="focusSector" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Target className="h-4 w-4 mr-2 text-orange-500" />
                          Focus Sector
                        </Label>
                        <Input
                          id="focusSector"
                          name="focusSector"
                          type="text"
                          value={formData.focusSector}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="bio" className="text-sm font-semibold text-gray-700 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-green-500" />
                          Bio
                        </Label>
                        <Input
                          id="bio"
                          name="bio"
                          type="text"
                          value={formData.bio}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full-width fields */}
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="keywords" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-blue-500" />
                          Keywords (comma-separated)
                        </Label>
                        <Input
                          id="keywords"
                          name="keywords"
                          type="text"
                          value={formData.keywords}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="insights" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                          Insights
                        </Label>
                        <Input
                          id="insights"
                          name="insights"
                          type="text"
                          value={formData.insights}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl p-6 border border-blue-100/50">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
                          <Globe className="h-4 w-4 text-white" />
                        </div>
                        Social Media Links
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="facebook" className="text-sm font-semibold text-gray-700 flex items-center">
                            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                            Facebook
                          </Label>
                          <Input
                            id="facebook"
                            name="facebook"
                            type="url"
                            value={formData.facebook}
                            onChange={handleInputChange}
                            className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter" className="text-sm font-semibold text-gray-700 flex items-center">
                            <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                            Twitter
                          </Label>
                          <Input
                            id="twitter"
                            name="twitter"
                            type="url"
                            value={formData.twitter}
                            onChange={handleInputChange}
                            className="h-12 rounded-xl border-gray-200 focus:border-sky-400 focus:ring-sky-400/20 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin" className="text-sm font-semibold text-gray-700 flex items-center">
                            <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                            LinkedIn
                          </Label>
                          <Input
                            id="linkedin"
                            name="linkedin"
                            type="url"
                            value={formData.linkedin}
                            onChange={handleInputChange}
                            className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-2xl p-6 border border-purple-100/50">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg mr-3">
                          <Camera className="h-4 w-4 text-white" />
                        </div>
                        Image Uploads
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Image with Preview */}
                        <div className="space-y-3">
                          <Label htmlFor="profileImage" className="text-sm font-semibold text-gray-700 flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-500" />
                            Profile Image
                          </Label>
                          {profileImagePreview && (
                            <div className="mb-2">
                              <img 
                                src={profileImagePreview} 
                                alt="Profile Preview" 
                                className="h-24 w-24 rounded-full object-cover border-2 border-white shadow-lg mx-auto"
                              />
                            </div>
                          )}
                          <Input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'profile')}
                            className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                          />
                        </div>
                        
                        {/* Cover Image with Preview */}
                        <div className="space-y-3">
                          <Label htmlFor="coverImage" className="text-sm font-semibold text-gray-700 flex items-center">
                            <Camera className="h-4 w-4 mr-2 text-purple-500" />
                            Cover Image
                          </Label>
                          {coverImagePreview && (
                            <div className="mb-2">
                              <img 
                                src={coverImagePreview} 
                                alt="Cover Preview" 
                                className="h-20 w-full rounded-lg object-cover border-2 border-white shadow-lg"
                              />
                            </div>
                          )}
                          <Input
                            id="coverImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'cover')}
                            className="h-12 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                          />
                        </div>
                        
                        {/* Company Logo with Preview (for exhibitors) */}
                        {user?.role === "exhibitor" && (
                          <div className="space-y-3">
                            <Label htmlFor="companyLogo" className="text-sm font-semibold text-gray-700 flex items-center">
                              <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
                              Company Logo
                            </Label>
                            {companyLogoPreview && (
                              <div className="mb-2">
                                <img 
                                  src={companyLogoPreview} 
                                  alt="Company Logo Preview" 
                                  className="h-24 w-24 rounded-lg object-contain border-2 border-white shadow-lg mx-auto bg-white p-1"
                                />
                              </div>
                            )}
                            <Input
                              id="companyLogo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'logo')}
                              className="h-12 rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 transition-all duration-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                    className="w-full mt-8 h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Updating Profile...
                      </div>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </CardContent>
              </Card>
        </div>
        {/* Password Change Card (same as before) */}
        <div className="space-y-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-lg rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
              <CardTitle className="text-xl font-bold flex items-center text-gray-800">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                Password Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-semibold text-gray-700 flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-blue-500" />
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-12 rounded-xl pr-12"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 rounded-l-none"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700 flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-purple-500" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-12 rounded-xl pr-12"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 rounded-l-none"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700 flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-blue-500" />
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-12 rounded-xl pr-12"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 rounded-l-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                >
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;