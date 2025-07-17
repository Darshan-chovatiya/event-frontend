import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ChangePassword from "./pages/ChangePassword";
import Settings from "./pages/Settings";
import Events from "./pages/Events";
import Stalls from "./pages/Stalls"; // Add this import
import NotFound from "./pages/NotFound";
import ExhibitorManagement from "./pages/ExhibitorManagement";
import VisitorManagement from "./pages/VisitorManagement";
import FaqManagement from "./pages/FaqManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={
                <ProtectedRoute requireRole="super-admin">
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route
            path="/exhibitors"
            element={
              <ProtectedRoute requireRole="super-admin">
                <ExhibitorManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitors"
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
              <Route path="stalls" element={<Stalls />} /> {/* Add this route */}
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);