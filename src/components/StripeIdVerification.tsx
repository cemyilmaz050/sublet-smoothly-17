import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVerificationPolling } from "@/hooks/useVerificationPolling";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Mail, Sparkles, Camera, Sun, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface StripeIdVerificationProps {
  idVerified: boolean;
  onVerified?: () => void;
}

type VerificationState = "idle" | "loading" | "prep" | "pending" | "verified" | "failed" | "max_attempts";

const POLL_INTERVAL = 5000; // 5 seconds as requested
const TWO_MINUTES = 2 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const STATUS_MESSAGES = [
  "Checking your document...",
  "Verifying your identity...",
  "Matching your photo...",
  "Almost done...",
  "Finalizing your verification...",
];

const StripeIdVerification = ({ idVerified, onVerified }: StripeIdVerificationProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startPolling: startBgPolling } = useVerificationPolling();
  const [state, setState] = useState<VerificationState>(idVerified ? "verified" : "idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Update state if idVerified prop changes
  useEffect(() => {
    if (idVerified && state !== "verified") {
      setState("verified");
      stopPolling();
    }
  }, [idVerified]);

  // Rotate status messages every 3 seconds while pending
  useEffect(() => {
    if (state !== "pending") return;
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [state]);

  // Show slow message after 2 minutes
  useEffect(() => {
    if (state !== "pending" || !pendingStart) return;
    const timeout = setTimeout(() => {
      setShowSlowMessage(true);
    }, TWO_MINUTES);
    return () => clearTimeout(timeout);
  }, [state, pendingStart]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
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
    setStatusMessageIndex(0);
    setPendingStart(Date.now());
    pollRef.current = setInterval(async () => {
      await checkStatus();
    }, POLL_INTERVAL);
  }, [checkStatus]);

  const handleContinueBrowsing = () => {
    startBgPolling();
    navigate("/listings");
  };

  const handleStartFlow = () => {
    setState("prep");
  };

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
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);

        if (newCount >= MAX_ATTEMPTS) {
          setState("max_attempts");
          return;
        }

        if (msg.includes("blurry") || msg.includes("blur")) {
          setError("Your ID image was too blurry. Try again in better lighting with your ID held flat.");
        } else if (msg.includes("expired")) {
          setError("Your document appears to be expired. Please use a valid, non-expired government ID.");
        } else if (msg.includes("face") || msg.includes("match") || msg.includes("selfie")) {
          setError("Your selfie didn't match your ID photo. Make sure your face is clearly visible and well-lit.");
        } else if (msg.includes("document") || msg.includes("read")) {
          setError("We couldn't read your document. Make sure all four corners of your ID are visible with no glare.");
        } else {
          setError("We couldn't verify your ID. Please make sure your document is clear and your face is fully visible, then try again.");
        }
        setState("failed");
      } else {
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
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald/20"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10"
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Identity verified, you're all set</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now schedule viewings and make payments on SubIn.
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
      <Card className="border-amber/30 bg-amber/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
            <div>
              <p className="text-sm font-semibold text-foreground">Having trouble?</p>
              <p className="text-sm text-muted-foreground mt-1">
                No worries! Email us at{" "}
                <a href="mailto:hello@subinapp.com" className="font-semibold text-primary underline">
                  hello@subinapp.com
                </a>{" "}
                with a photo of your ID and we'll verify you manually within 1 hour.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAttemptCount(0); setState("idle"); }}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try Again Anyway
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Pending state ──
  if (state === "pending") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Animated progress ring */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="absolute inset-0 h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="176"
                  animate={{ strokeDashoffset: [176, 44, 176] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                Your ID is being reviewed
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually takes under 60 seconds
              </p>
            </div>

            {/* Rotating status messages */}
            <AnimatePresence mode="wait">
              <motion.p
                key={statusMessageIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-primary font-medium"
              >
                {STATUS_MESSAGES[statusMessageIndex]}
              </motion.p>
            </AnimatePresence>

            {/* Animated dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </div>

          {/* 2-minute fallback */}
          <AnimatePresence>
            {showSlowMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-muted p-4 text-center space-y-3"
              >
                <p className="text-sm text-foreground font-medium">
                  This is taking a little longer than usual
                </p>
                <p className="text-xs text-muted-foreground">
                  You can continue browsing while we finish verifying you. We'll notify you the moment it's done.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleContinueBrowsing}
                >
                  Continue Browsing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Always show continue browsing option */}
          {!showSlowMessage && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleContinueBrowsing}
                className="text-xs text-muted-foreground"
              >
                Continue Browsing <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
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
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">Verification didn't go through</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error || "Something went wrong. Please try again."}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Attempt {attemptCount} of {MAX_ATTEMPTS}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={startVerification}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Prep tips screen ──
  if (state === "prep") {
    return (
      <Card className="border-primary/20 bg-card">
        <CardContent className="space-y-5 p-5">
          <div className="text-center">
            <p className="text-base font-bold text-foreground">Quick tips for fast verification</p>
            <p className="text-xs text-muted-foreground mt-1">Follow these tips so your ID passes on the first try</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Use a valid, non-expired ID</p>
                <p className="text-xs text-muted-foreground">Driver's license, passport, or state ID</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sun className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Good lighting, no glare</p>
                <p className="text-xs text-muted-foreground">Natural light works best. Avoid flash</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">All four corners visible</p>
                <p className="text-xs text-muted-foreground">Hold your ID flat with nothing covering it</p>
              </div>
            </div>
          </div>

          <Button
            onClick={startVerification}
            className="w-full h-12"
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Start Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Idle / default state ──
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Verify Your Identity</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quick ID scan and selfie. Takes under 60 seconds. You'll need a government-issued ID.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-accent/50 p-3">
          <p className="text-xs text-muted-foreground text-center">
            💡 Get verified now so you're ready to book instantly when you find your perfect place
          </p>
        </div>

        <Button
          onClick={handleStartFlow}
          disabled={state === "loading"}
          className="w-full h-11"
        >
          {state === "loading" ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Starting...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Verify with Government ID
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StripeIdVerification;
