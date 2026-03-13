import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

interface StripeIdVerificationProps {
  idVerified: boolean;
  onVerified?: () => void;
}

const StripeIdVerification = ({ idVerified, onVerified }: StripeIdVerificationProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxAttempts, setMaxAttempts] = useState(false);

  if (idVerified) {
    return (
      <Card className="border-emerald/30 bg-emerald/5">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald" />
          <div>
            <p className="text-sm font-semibold text-foreground">Identity Verified</p>
            <p className="text-xs text-muted-foreground">
              Your identity has been verified. You are all set!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startVerification = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-verification-session"
      );

      if (fnError) throw fnError;

      if (data?.already_verified) {
        toast.success("Your identity is already verified!");
        onVerified?.();
        return;
      }

      if (data?.error === "max_attempts") {
        setMaxAttempts(true);
        return;
      }

      if (data?.error) throw new Error(data.error);

      const clientSecret = data?.client_secret;
      if (!clientSecret) throw new Error("No client secret returned");

      // Load Stripe and open Identity modal
      const stripe = await loadStripe(
        "pk_live_51TABODCpbA85hge15GgiO276acyyu7ttgB7zKw8Ygsb8KwU2QUagdYnjI5s3bkeLsoMFshURYYq5DLzAqbMU865d00W47B1eMN"
      );
      if (!stripe) throw new Error("Failed to load Stripe");

      const result = await stripe.verifyIdentity(clientSecret);

      if (result.error) {
        console.error("Verification error:", result.error);
        setError(
          "We could not verify your ID. Please make sure your document is clear and your face is fully visible, then try again."
        );
      } else {
        // Verification submitted — poll for result
        toast.success("Verification submitted! We'll update your status shortly.");
        // Give Stripe a moment to process, then check
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id_verified")
            .eq("id", user.id)
            .single();
          if (profile?.id_verified) {
            onVerified?.();
          }
        }, 3000);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (maxAttempts) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">Verification Failed</p>
              <p className="text-xs text-muted-foreground">
                Please contact support at{" "}
                <a href="mailto:hello@subinapp.com" className="font-medium text-primary underline">
                  hello@subinapp.com
                </a>{" "}
                for help with verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber/30 bg-amber/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <div>
            <p className="text-sm font-semibold text-foreground">Verify Your Identity</p>
            <p className="text-xs text-muted-foreground">
              Complete a quick ID verification to get a "Verified" badge. You'll need a
              government-issued ID and a quick selfie. Takes under 2 minutes.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <Button
          size="sm"
          onClick={startVerification}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Starting Verification...
            </>
          ) : error ? (
            <>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try Again
            </>
          ) : (
            <>
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verify with Government ID
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StripeIdVerification;
