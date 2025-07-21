import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BaseUrl } from "@/sevice/Url";

interface User {
  id: string;
  email: string;
  name: string;
  mobile: string;
  companyName?: string;
  role: "exhibitor" | "visitor";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: "exhibitor" | "visitor") => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

const UserAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useUserAuth = (): AuthContextType => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
};

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "exhibitor" || parsedUser.role === "visitor") {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("userToken");
          localStorage.removeItem("userData");
        }
      } catch (error) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, userType: "exhibitor" | "visitor"): Promise<boolean> => {
    try {
      const response = await fetch(`${BaseUrl}/${userType}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, userType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid credentials");
      }

      const data = await response.json();
      const userData: User = {
        id: data.admin._id,
        email: data.admin.email,
        name: data.admin.name,
        mobile: data.admin.mobile,
        companyName: data.admin.companyName || undefined,
        role: userType,
        avatar: data.admin.profileImage || undefined,
      };

      localStorage.setItem("userToken", data.accessToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error(`${userType} login error:`, error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    setUser,
  };

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};








// import "./global.css";

// import { Toaster } from "@/components/ui/toaster";
// import { createRoot } from "react-dom/client";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./contexts/AuthContext";
// import { UserAuthProvider } from "./contexts/UserAuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import UserProtectedRoute from "./components/UserProtectedRoute";
// import Layout from "./components/Layout";
// import UserLayout from "./components/UserLayout";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import UserManagement from "./pages/UserManagement";
// import ChangePassword from "./pages/ChangePassword";
// import Settings from "./pages/Settings";
// import Events from "./pages/Events";
// import Stalls from "./pages/Stalls"; // Add this import
// import NotFound from "./pages/NotFound";
// import ExhibitorManagement from "./pages/ExhibitorManagement";
// import VisitorManagement from "./pages/VisitorManagement";
// import FaqManagement from "./pages/FaqManagement";
// import UserLogin from "./pages/user/UserLogin";
// import UserSignup from "./pages/user/UserSignup";
// import UserDashboard from "./pages/user/UserDashboard";
// import UserProfile from "./pages/user/UserProfile";
// import UserChangePassword from "./pages/user/UserChangePassword";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <BrowserRouter>
//         <Routes>
//           {/* Admin Routes */}
//           <Route
//             path="/admin"
//             element={
//               <AuthProvider>
//                 <Toaster />
//                 <Sonner />
//                 <Routes>
//                   <Route path="login" element={<Login />} />
//                   <Route
//                     path="/"
//                     element={
//                       <ProtectedRoute>
//                         <Layout />
//                       </ProtectedRoute>
//                     }
//                   >
//                     <Route index element={<Navigate to="dashboard" replace />} />
//                     <Route path="dashboard" element={<Dashboard />} />
//                     <Route
//                       path="users"
//                       element={
//                         <ProtectedRoute requireRole="super-admin">
//                           <UserManagement />
//                         </ProtectedRoute>
//                       }
//                     />
//                     <Route
//                       path="exhibitors"
//                       element={
//                         <ProtectedRoute requireRole="super-admin">
//                           <ExhibitorManagement />
//                         </ProtectedRoute>
//                       }
//                     />
//                     <Route
//                       path="visitors"
//                       element={
//                         <ProtectedRoute requireRole="super-admin">
//                           <VisitorManagement />
//                         </ProtectedRoute>
//                       }
//                     />
//                     <Route
//                       path="faqs"
//                       element={
//                         <ProtectedRoute requireRole="super-admin">
//                           <FaqManagement />
//                         </ProtectedRoute>
//                       }
//                     />
//                     <Route path="events" element={<Events />} />
//                     <Route path="stalls" element={<Stalls />} />
//                     <Route path="change-password" element={<ChangePassword />} />
//                     <Route path="settings" element={<Settings />} />
//                   </Route>
//                   <Route path="*" element={<NotFound />} />
//                 </Routes>
//               </AuthProvider>
//             }
//           />

//           {/* User Routes (Exhibitor and Visitor) */}
//           <Route
//             path="/user"
//             element={
//               <UserAuthProvider>
//                 <Toaster />
//                 <Sonner />
//                 <Routes>
//                   <Route path="login" element={<UserLogin />} />
//                   <Route path="signup" element={<UserSignup />} />
//                   <Route
//                     path="/"
//                     element={
//                       <UserProtectedRoute>
//                         <UserLayout />
//                       </UserProtectedRoute>
//                     }
//                   >
//                     <Route index element={<Navigate to="dashboard" replace />} />
//                     <Route path="dashboard" element={<UserDashboard />} />
//                     <Route path="profile" element={<UserProfile />} />
//                     <Route path="change-password" element={<UserChangePassword />} />
//                   </Route>
//                   <Route path="*" element={<NotFound />} />
//                 </Routes>
//               </UserAuthProvider>
//             }
//           />

//           {/* Root Redirect */}
//           <Route path="/" element={<Navigate to="/admin/login" replace />} />
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// createRoot(document.getElementById("root")!).render(<App />);