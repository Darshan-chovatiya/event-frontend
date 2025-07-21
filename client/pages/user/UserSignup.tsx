import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Link } from "lucide-react";
import { BaseUrl } from "@/sevice/Url";

const UserSignup: React.FC = () => {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"exhibitor" | "visitor">("exhibitor");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!name || !email || !mobile || !password || (role === "exhibitor" && !companyName)) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BaseUrl}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, companyName: role === "exhibitor" ? companyName : undefined, email, mobile, password, userType: role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register");
      }

      setSuccess("Registration successful! Please login.");
      setTimeout(() => navigate("/user/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignup();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-md w-full rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
          <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">U</span>
            </div>
            User Signup
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-6 space-y-6">
          {error && (
            <Alert variant="destructive" className="border-0 bg-red-50/80 rounded-xl">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="border-0 bg-green-50/80 rounded-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-700 font-medium">{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                Role
              </Label>
              <Select value={role} onValueChange={(value: "exhibitor" | "visitor") => setRole(value)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exhibitor">Exhibitor</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 rounded-xl"
              />
            </div>
            {role === "exhibitor" && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 rounded-xl"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 rounded-xl"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 rounded-xl"
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/user/login" className="text-blue-600 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSignup;