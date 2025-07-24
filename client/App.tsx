
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserAuthProvider } from "./contexts/UserAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import Layout from "./components/Layout";
import UserLayout from "./components/UserLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ChangePassword from "./pages/ChangePassword";
import Settings from "./pages/Settings";
import Events from "./pages/Events";
import Stalls from "./pages/Stalls";
import NotFound from "./pages/NotFound";
import ExhibitorManagement from "./pages/ExhibitorManagement";
import VisitorManagement from "./pages/VisitorManagement";
import FaqManagement from "./pages/FaqManagement";
import UserLogin from "./pages/user/UserLogin";
import UserSignup from "./pages/user/UserSignup";
import UserDashboard from "./pages/user/UserDashboard";
import UserProfile from "./pages/user/UserProfile";
import UserChangePassword from "./pages/user/UserChangePassword";
import UserStalls from "./pages/user/UserStalls";
import BookingHistory from "./pages/user/BookingHistory";
import ExhibitorPage from "./pages/user/ExhibitorPage";
import VisitorPage from "./pages/user/VisitorPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Root path redirects to user login */}
          <Route path="/" element={<Navigate to="/user/login" replace />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AuthProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute requireRole="super-admin">
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="exhibitors"
                      element={
                        <ProtectedRoute requireRole="super-admin">
                          <ExhibitorManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="visitors"
                      element={
                        <ProtectedRoute requireRole="super-admin">
                          <VisitorManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="faqs"
                      element={
                        <ProtectedRoute requireRole="super-admin">
                          <FaqManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="events" element={<Events />} />
                    <Route path="stalls" element={<Stalls />} />
                    <Route path="change-password" element={<ChangePassword />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            }
          />

          {/* User Routes (Exhibitor and Visitor) */}
          <Route
            path="/user/*"
            element={
              <UserAuthProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="login" element={<UserLogin />} />
                  <Route path="signup" element={<UserSignup />} />
                  <Route
                    path="/"
                    element={
                      <UserProtectedRoute>
                        <UserLayout />
                      </UserProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="stalls" element={<UserStalls />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="exhibitors" element={<ExhibitorPage />} /> {/* Add this route */}
                    <Route path="visitors" element={<VisitorPage />} /> {/* Add this route */}
                    {/* <Route path="change-password" element={<UserChangePassword />} /> */}
                    <Route path="bookinghistory" element={<BookingHistory />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </UserAuthProvider>
            }
          />

          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);