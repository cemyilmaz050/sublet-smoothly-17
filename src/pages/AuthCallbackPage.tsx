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
    const handleCallback = async () => {
      // Check for error in URL hash (e.g. expired link)
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const errorDescription = params.get("error_description");
      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      // Wait for session to be established
      const timeout = setTimeout(() => {
        setError("Verification failed or link has expired.");
      }, 5000);

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        clearTimeout(timeout);
        // Check profile and redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_complete")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          // Profile will be created by the trigger, wait a moment
          await new Promise((r) => setTimeout(r, 1000));
          const { data: retryProfile } = await supabase
            .from("profiles")
            .select("role, onboarding_complete")
            .eq("id", session.user.id)
            .single();
          redirectByRole(retryProfile);
        } else {
          redirectByRole(profile);
        }
        return;
      }

      // Listen for auth state change if session not ready yet
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, onboarding_complete")
              .eq("id", session.user.id)
              .single();
            redirectByRole(profile);
          }
        }
      );

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    };

    handleCallback();
  }, []);

  const redirectByRole = (_profile: any) => {
    navigate("/listings", { replace: true });
  };

  const handleResend = async () => {
    setResending(true);
    // Try to get email from URL or prompt
    const email = prompt("Enter your email address to resend the verification link:");
    if (!email) {
      setResending(false);
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error(error.message);
    } else {
      setResent(true);
      toast.success("Verification email resent! Check your inbox.");
    }
    setResending(false);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md text-center space-y-6">
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
