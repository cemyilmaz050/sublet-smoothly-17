import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVerificationPolling } from "@/hooks/useVerificationPolling";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface StripeIdVerificationProps {
  idVerified: boolean;
  onVerified?: () => void;
}

type VerificationState = "idle" | "loading" | "pending" | "verified" | "failed" | "max_attempts";

const POLL_INTERVAL = 2000;
const POLL_TIMEOUT = 30000;
const TEN_MINUTES = 10 * 60 * 1000;

const StripeIdVerification = ({ idVerified, onVerified }: StripeIdVerificationProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startPolling: startBgPolling } = useVerificationPolling();
  const [state, setState] = useState<VerificationState>(idVerified ? "verified" : "idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [pendingStart, setPendingStart] = useState<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Update state if idVerified prop changes
  useEffect(() => {
    if (idVerified && state !== "verified") {
      setState("verified");
      stopPolling();
    }
  }, [idVerified]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id_verified")
      .eq("id", user.id)
      .single();
    if (profile?.id_verified) {
      stopPolling();
      setState("verified");
      onVerified?.();
      return true;
    }
    return false;
  }, [user, onVerified, stopPolling]);

  const startPolling = useCallback(() => {
    setShowSlowMessage(false);
    setPendingStart(Date.now());
    pollRef.current = setInterval(async () => {
      await checkStatus();
    }, POLL_INTERVAL);

    timeoutRef.current = setTimeout(() => {
      setShowSlowMessage(true);
    }, POLL_TIMEOUT);
  }, [checkStatus]);

  const handleManualCheck = async () => {
    setState("loading");
    const verified = await checkStatus();
    if (!verified) {
      setState("pending");
      toast.info("Still processing — we'll update automatically when it's ready.");
    }
  };

  const handleContinueBrowsing = () => {
    // Start background polling via context, then navigate away
    startBgPolling();
    navigate("/");
  };

  const showManualFallback = pendingStart && Date.now() - pendingStart > TEN_MINUTES;

  const startVerification = async () => {
    if (!user) return;
    setState("loading");
    setError(null);
    setShowSlowMessage(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-verification-session"
      );

      if (fnError) throw fnError;

      if (data?.already_verified) {
        setState("verified");
        onVerified?.();
        return;
      }

      if (data?.error === "max_attempts") {
        setState("max_attempts");
        return;
      }

      if (data?.error) throw new Error(data.error);

      const clientSecret = data?.client_secret;
      if (!clientSecret) throw new Error("No client secret returned");

      const stripe = await loadStripe(
        "pk_live_51TABODCpbA85hge15GgiO276acyyu7ttgB7zKw8Ygsb8KwU2QUagdYnjI5s3bkeLsoMFshURYYq5DLzAqbMU865d00W47B1eMN"
      );
      if (!stripe) throw new Error("Failed to load Stripe");

      const result = await stripe.verifyIdentity(clientSecret);

      if (result.error) {
        console.error("Verification error:", result.error);
        const msg = result.error.message || "";
        if (msg.includes("blurry") || msg.includes("blur")) {
          setError("Your ID image was too blurry — please try again with better lighting.");
        } else if (msg.includes("document") || msg.includes("read")) {
          setError("We could not read your document — please make sure the full ID is visible.");
        } else {
          setError("We could not verify your ID. Please make sure your document is clear and your face is fully visible, then try again.");
        }
        setState("failed");
      } else {
        // Submitted — start polling
        setState("pending");
        startPolling();
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setState("failed");
    }
  };

  // ── Verified state ──
  if (state === "verified") {
    return (
      <Card className="border-emerald/30 bg-emerald/5 overflow-hidden">
        <CardContent className="p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald/20"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </motion.div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">Identity Verified ✓</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your identity has been verified. You are all set!
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // ── Max attempts state ──
  if (state === "max_attempts") {
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

  // ── Pending state (waiting for webhook) ──
  if (state === "pending") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Verification submitted — we're confirming your identity
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually takes a few minutes. You can continue browsing listings while you wait.
              </p>
            </div>

            {/* Subtle progress dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>

            {/* Continue Browsing button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleContinueBrowsing}
              className="mt-2"
            >
              Continue Browsing <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showSlowMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg bg-muted p-3 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  This is taking longer than usual —{" "}
                  <button
                    onClick={handleManualCheck}
                    className="font-semibold underline hover:no-underline text-foreground"
                  >
                    click here to check your verification status
                  </button>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleManualCheck}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Check Status
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual fallback after 10 minutes */}
          {showManualFallback && (
            <div className="rounded-lg bg-muted p-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>
                Taking longer than expected? Email your ID to{" "}
                <a href="mailto:verify@subinapp.com" className="font-semibold underline text-foreground">verify@subinapp.com</a>
                {" "}and our team will verify you within 1 hour.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Failed / Error state ──
  if (state === "failed") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">Verification Failed</p>
              <p className="text-xs text-muted-foreground">
                {error || "Something went wrong. Please try again."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={startVerification}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Idle / default state ──
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

        <Button
          size="sm"
          onClick={startVerification}
          disabled={state === "loading"}
          className="w-full sm:w-auto"
        >
          {state === "loading" ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Starting Verification...
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
