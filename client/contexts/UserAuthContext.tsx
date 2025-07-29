import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BaseUrl } from "@/sevice/Url";

interface SocialMedia {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  mobile: string;
  companyName?: string;
  role: "exhibitor" | "visitor";
  avatar?: string;
  designation?: string;
  companyWebsite?: string;
  bio?: string;
  keywords?: string[];
  insights?: string;
  socialMedia?: SocialMedia;
  focusSector?: string;
  profileImage?: string;
  coverImage?: string;
  companyLogo?: string;
  qrCode?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: "exhibitor" | "visitor") => Promise<boolean>;
  googleLogin: (credential: string, userType: "exhibitor" | "visitor") => Promise<boolean>;
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
      const response = await fetch(`${BaseUrl}/user/login`, {
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
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.name,
        mobile: data.data.user.mobile,
        companyName: data.data.user.companyName || undefined,
        role: userType,
        avatar: data.data.user.profileImage || undefined,
        designation: data.data.user.designation || undefined,
        companyWebsite: data.data.user.companyWebsite || undefined,
        bio: data.data.user.bio || undefined,
        keywords: data.data.user.keywords || undefined,
        insights: data.data.user.insights || undefined,
        socialMedia: {
          facebook: data.data.user.socialMedia?.facebook || undefined,
          twitter: data.data.user.socialMedia?.twitter || undefined,
          linkedin: data.data.user.socialMedia?.linkedin || undefined,
        },
        focusSector: data.data.user.focusSector || undefined,
        profileImage: data.data.user.profileImage || undefined,
        coverImage: data.data.user.coverImage || undefined,
        companyLogo: data.data.user.companyLogo || undefined,
        qrCode: data.data.user.qrCode || undefined,
      };

      localStorage.setItem("userToken", data.data.accessToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error(`${userType} login error:`, error.message);
      throw error;
    }
  };

  const googleLogin = async (credential: string, userType: "exhibitor" | "visitor"): Promise<boolean> => {
    try {
      // Decode the Google JWT to extract email
      const payload = JSON.parse(atob(credential.split(".")[1]));
      const email = payload.email;

      const response = await fetch(`${BaseUrl}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          socialMediaId: credential,
          userType,
          signupType: "Google",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Google login failed");
      }

      const data = await response.json();
      
      const userData: User = {
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.name,
        mobile: data.data.user.mobile,
        companyName: data.data.user.companyName || undefined,
        role: userType,
        avatar: data.data.user.profileImage || undefined,
        designation: data.data.user.designation || undefined,
        companyWebsite: data.data.user.companyWebsite || undefined,
        bio: data.data.user.bio || undefined,
        keywords: data.data.user.keywords || undefined,
        insights: data.data.user.insights || undefined,
        socialMedia: {
          facebook: data.data.user.socialMedia?.facebook || undefined,
          twitter: data.data.user.socialMedia?.twitter || undefined,
          linkedin: data.data.user.socialMedia?.linkedin || undefined,
        },
        focusSector: data.data.user.focusSector || undefined,
        profileImage: data.data.user.profileImage || undefined,
        coverImage: data.data.user.coverImage || undefined,
        companyLogo: data.data.user.companyLogo || undefined,
        qrCode: data.data.user.qrCode || undefined,
      };

      localStorage.setItem("userToken", data.data.accessToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error(`${userType} Google login error:`, error.message);
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
    googleLogin,
    logout,
    isLoading,
    setUser,
  };

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};