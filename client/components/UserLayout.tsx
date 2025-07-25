import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useUserAuth } from "../contexts/UserAuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, User, KeyRound, LogOut, Menu, X, Store, Building2, Users } from "lucide-react";
import Swal from "sweetalert2";

const UserLayout: React.FC = () => {
  const { user, logout } = useUserAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/user/stalls", icon: Store },
    { name: "Exhibitors", href: "/user/exhibitors", icon: Building2 }, // Add this
    { name: "Visitors", href: "/user/visitors", icon: Users }, // Add this
    { name: "Leads", href: "/user/leads", icon: Users },
    { name: "Profile", href: "/user/profile", icon: User },
  ];

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        Swal.fire({
          title: "Logged Out!",
          text: "You have been successfully logged out.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const userType = user?.role || "user";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar for large and larger screens */}
      <div className="hidden lg:flex bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl z-50 sticky top-0">
        <div className="flex h-16  items-center justify-between px-6 py-10 w-full border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-slate-600">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </p>
              </div>
          </div>
          <nav className="flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`mr-2 h-5 w-5 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
            <div className="flex items-center space-x-3 ml-4">
              
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Sidebar for smaller than large screens */}
      <div
        className={`lg:hidden fixed inset-y-0 z-50 w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{userType.charAt(0).toUpperCase()}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{userType.charAt(0).toUpperCase() + userType.slice(1)} Panel</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-slate-600">
              <span className="text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {userType.charAt(0).toUpperCase() + userType.slice(1)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col w-full">
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-slate-100 rounded-xl"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {userType.charAt(0).toUpperCase() + userType.slice(1)} Panel
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-100">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;