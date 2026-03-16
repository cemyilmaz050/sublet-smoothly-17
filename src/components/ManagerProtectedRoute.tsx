import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

/** Only @bostonbrokerage.com emails can access the manager portal */
const BBG_EMAIL_DOMAIN = "@bostonbrokerage.com";

const ManagerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady, role } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  const isBbgEmail = user?.email?.toLowerCase().endsWith(BBG_EMAIL_DOMAIN) ?? false;
  const hasAccess = !!user && role === "manager" && isBbgEmail;

  useEffect(() => {
    if (!isReady) return;
    if (!user) return; // will Navigate below
    if (hasAccess) return;

    // Non-BBG user or wrong role — show message then redirect
    setRedirecting(true);
    const timer = setTimeout(() => {
      window.location.href = "/listings";
    }, 3000);
    return () => clearTimeout(timer);
  }, [isReady, user, hasAccess]);

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

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Staff Area</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This area is for Boston Brokerage Group staff only. If you are a tenant looking to sublet your apartment,{" "}
            <Link to="/listings" className="font-medium text-primary hover:underline">
              click here
            </Link>{" "}
            to browse listings.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting you automatically…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ManagerProtectedRoute;
