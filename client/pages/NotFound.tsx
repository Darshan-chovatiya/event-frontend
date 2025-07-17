import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="border-0 shadow-md max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-yellow-600" />
          </div>
          <p className="text-gray-600">
            Sorry, the page you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;