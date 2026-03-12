import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady, role, onboardingComplete } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect tenants who haven't completed onboarding
  const isOnboardingRoute = location.pathname === "/tenant/onboarding";
  if (role === "tenant" && onboardingComplete === false && !isOnboardingRoute) {
    return <Navigate to="/tenant/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
