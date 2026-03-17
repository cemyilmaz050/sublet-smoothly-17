import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Layer 1: Only this email can ever access admin
const FOUNDER_EMAIL = "cemyilmaz050@gmail.com";

// Session key for PIN verification (memory only, cleared on tab close)
const ADMIN_SESSION_KEY = "__adm_v";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady } = useAuth();
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [authSettled, setAuthSettled] = useState(false);

  // Wait for auth to fully settle before making redirect decisions
  // This prevents premature redirects on direct URL navigation
  useEffect(() => {
    if (isReady) {
      // Give an extra moment for session restoration on direct navigation
      const timer = setTimeout(() => setAuthSettled(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  // Check if already PIN-verified this session
  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Expires after 1 hour
      if (parsed.exp > Date.now()) {
        setPinVerified(true);
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    setCheckingSession(false);
  }, []);

  const handlePinSubmit = useCallback(async () => {
    if (!pin.trim()) return;
    setVerifying(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "verify-admin-pin",
        { body: { pin: pin.trim() } }
      );

      if (fnError || data?.error) {
        setError(data?.error || "Verification failed");
        setPin("");
        return;
      }

      if (data?.verified) {
        const exp = Date.now() + (data.expiresIn || 3600) * 1000;
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ exp }));
        setPinVerified(true);
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  }, [pin]);

  if (!isReady || checkingSession || !authSettled) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Layer 1: Must be logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Layer 2: Email whitelist — silent redirect, no indication admin exists
  if (user.email?.trim().toLowerCase() !== FOUNDER_EMAIL.toLowerCase()) {
    return <Navigate to="/listings" replace />;
  }

  // Layer 3: PIN gate
  if (!pinVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Enter admin PIN</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePinSubmit();
            }}
            className="space-y-3"
          >
            <Input
              type="password"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              className="text-center tracking-widest"
            />
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={verifying || !pin.trim()}
            >
              {verifying ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
