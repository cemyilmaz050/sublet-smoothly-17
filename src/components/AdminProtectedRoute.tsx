import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Protects admin routes — only users with role "admin" can access.
 * Everyone else is silently redirected to /listings.
 */
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady, role } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "admin") {
    return <Navigate to="/listings" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
