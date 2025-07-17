import { BaseUrl } from "@/sevice/Url";
import React, {
  createContext,
  useContext, 
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  username: string;
  email: string;
  role: "super-admin" | "sub-admin";
  avatar?: string; // Added avatar field for profile updates
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void; // Added setUser to context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app startup
    const token = localStorage.getItem("adminToken");
    const userData = localStorage.getItem("adminUser");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "super-admin" || parsedUser.role === "sub-admin") {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
        }
      } catch (error) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${BaseUrl}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid credentials");
      }

      const data = await response.json();
      const userData: User = {
        id: data.data.admin._id,
        username: data.data.admin.email, // Using email as username for frontend consistency
        email: data.data.admin.email,
        role: data.data.admin.role === "superadmin" ? "super-admin" : "sub-admin",
        mobile: data.data.admin.mobile,
        avatar: data.data.admin.avatar || undefined, // Include avatar from login response
      };

      // Validate role
      if (userData.role !== "super-admin" && userData.role !== "sub-admin") {
        throw new Error("Invalid user role");
      }

      // Store token and user data
      localStorage.setItem("adminToken", data.data.accessToken);
      localStorage.setItem("adminUser", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error("Login error:", error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    setUser, // Expose setUser in context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};