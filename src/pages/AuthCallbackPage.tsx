import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check for error in URL hash (e.g. expired link)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const errorDescription = params.get("error_description");
    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    // Set a timeout for safety
    const timeout = setTimeout(() => {
      if (mounted && !error) {
        setError("Verification failed or link has expired.");
      }
    }, 8000);

    const tryRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        clearTimeout(timeout);
        await redirectUser(session.user.id);
        return;
      }

      // Listen for auth state change if session not ready yet
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!mounted || !newSession) return;
          clearTimeout(timeout);
          subscription.unsubscribe();
          await redirectUser(newSession.user.id);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };

    const redirectUser = async (userId: string) => {
      if (!mounted) return;
      // Fetch profile with retry for trigger-created profiles
      let profile = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await supabase
          .from("profiles")
          .select("role, onboarding_complete")
          .eq("id", userId)
          .single();
        if (data) {
          profile = data;
          break;
        }
        await new Promise((r) => setTimeout(r, 800));
      }
      if (mounted) {
        // Route BBG staff emails to the manager portal
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email?.toLowerCase() || "";
        if (userEmail.endsWith("@realestateboston.com") && profile?.role === "manager") {
          navigate("/portal-mgmt-bbg", { replace: true });
        } else {
          navigate("/listings", { replace: true });
        }
      }
    };

    tryRedirect();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [navigate]);

  const handleResend = async () => {
    setResending(true);
    const email = prompt("Enter your email address to resend the verification link:");
    if (!email) {
      setResending(false);
      return;
    }
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    if (resendError) {
      toast.error(resendError.message);
    } else {
      setResent(true);
      toast.success("Verification email resent! Check your inbox.");
    }
    setResending(false);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md text-center space-y-6 px-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
          <p className="text-muted-foreground">
            Your verification link may have expired. Please request a new one.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleResend} disabled={resending || resent}>
              {resending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {resent ? "Email Sent!" : "Resend Verification Email"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/signup")}>
              Back to Sign Up
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
