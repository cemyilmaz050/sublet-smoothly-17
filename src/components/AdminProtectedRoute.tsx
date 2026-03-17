import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const FOUNDER_IDS = [
  "370d6445-15bc-4802-8626-1507c38fbdd4",
];

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !FOUNDER_IDS.includes(user.id)) {
    return <Navigate to="/listings" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
