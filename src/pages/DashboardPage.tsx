import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const DashboardPage = () => {
  const { isReady, role, activeMode } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "manager") return <Navigate to="/dashboard/manager" replace />;

  // Use active_mode to decide which dashboard
  if (activeMode === "tenant") return <Navigate to="/dashboard/tenant" replace />;
  return <Navigate to="/dashboard/subtenant" replace />;
};

export default DashboardPage;
