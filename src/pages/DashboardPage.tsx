import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const DashboardPage = () => {
  const { isReady, role } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Default to listings, but also support direct role dashboards
  if (role === "subtenant") return <Navigate to="/dashboard/subtenant" replace />;
  if (role === "manager") return <Navigate to="/dashboard/manager" replace />;
  return <Navigate to="/dashboard/tenant" replace />;
};

export default DashboardPage;
