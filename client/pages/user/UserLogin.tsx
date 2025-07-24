
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const UserLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"exhibitor" | "visitor">("exhibitor");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useUserAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await login(email, password, role);
      navigate("/user/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setIsLoading(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google.");
      }
      await googleLogin(credentialResponse.credential, role);
      navigate("/user/dashboard");
    } catch (err: any) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please check your Google account settings or try again.");
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <GoogleOAuthProvider clientId="752749992472-jsq9nio5gnr5luk9vhnrpgjckg39grd9.apps.googleusercontent.com">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-md w-full rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative border-b border-gray-100/50 bg-white/50">
            <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
              <div className="h-10

 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold">U</span>
              </div>
              User Login
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="border-0 bg-red-50/80 rounded-xl">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Role</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setRole("exhibitor")}
                    className={`w-full h-12 rounded-xl font-semibold transition-all duration-300 ${
                      role === "exhibitor"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Exhibitor
                  </Button>
                  <Button
                    onClick={() => setRole("visitor")}
                    className={`w-full h-12 rounded-xl font-semibold transition-all duration-300 ${
                      role === "visitor"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Visitor
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
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
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 rounded-xl pr-12"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 rounded-l-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute w-full border-t border-gray-300"></div>
                <span className="relative bg-white px-4 text-sm text-gray-600">or</span>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  width="352"
                  logo_alignment="center"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/user/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </GoogleOAuthProvider>
  );
};

export default UserLogin;
