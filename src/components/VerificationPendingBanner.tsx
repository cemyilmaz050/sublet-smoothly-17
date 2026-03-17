import { useVerificationPolling } from "@/hooks/useVerificationPolling";
import { ShieldCheck, X, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TEN_MINUTES = 10 * 60 * 1000;

const VerificationPendingBanner = () => {
  const { isPending, isVerified, checkNow, pendingSince } = useVerificationPolling();
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!isPending || isVerified || dismissed) return null;

  const showManualFallback = pendingSince && Date.now() - pendingSince > TEN_MINUTES;

  const handleCheck = async () => {
    setChecking(true);
    await checkNow();
    setChecking(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className="sticky top-16 z-40 border-b bg-primary/10 backdrop-blur-sm px-4 py-2"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-5 w-5 items-center justify-center">
              <div className="absolute h-5 w-5 rounded-full border-2 border-transparent border-t-primary animate-spin" />
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-foreground font-medium">
              Verification in progress. We'll notify you the moment it's confirmed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCheck} disabled={checking} className="text-xs h-7">
              {checking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Check Status
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {showManualFallback && (
          <div className="mx-auto max-w-5xl mt-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>
              Taking longer than expected? You can verify manually by emailing your ID to{" "}
              <a href="mailto:verify@subinapp.com" className="font-semibold underline">verify@subinapp.com</a>
              {" "}and our team will verify you within 1 hour.
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default VerificationPendingBanner;
