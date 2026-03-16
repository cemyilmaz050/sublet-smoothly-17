import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, ShieldCheck, CreditCard, Users, Sparkles, MessageSquare, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";

const LS_KEY = "subin_welcome_choice";
const LS_FINDER_DONE = "subin_finder_completed";

type WelcomeChoice = "sublet" | "find" | "skip" | null;

function getStoredChoice(): WelcomeChoice {
  return (localStorage.getItem(LS_KEY) as WelcomeChoice) || null;
}

export function useWelcomePopup() {
  const { user, role, isReady } = useAuth();
  const [show, setShow] = useState(false);
  const [returningMode, setReturningMode] = useState<"finder" | "subletter" | null>(null);

  useEffect(() => {
    if (!isReady) return;

    // Logged-in users with a role → skip popup entirely
    if (user && role) return;

    const choice = getStoredChoice();

    // First-time visitor → show after 500ms
    if (!choice) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }

    // Returning user who previously chose "find" and completed questionnaire but didn't book
    if (choice === "find" && localStorage.getItem(LS_FINDER_DONE)) {
      const timer = setTimeout(() => setReturningMode("finder"), 500);
      return () => clearTimeout(timer);
    }

    // Returning subletter
    if (choice === "sublet") {
      const timer = setTimeout(() => setReturningMode("subletter"), 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, user, role]);

  const dismiss = (choice: WelcomeChoice) => {
    if (choice && choice !== "skip") localStorage.setItem(LS_KEY, choice);
    if (choice === "skip") localStorage.setItem(LS_KEY, "skip");
    setShow(false);
    setReturningMode(null);
  };

  return { show: show || returningMode !== null, returningMode, dismiss };
}

interface WelcomePopupProps {
  show: boolean;
  returningMode: "finder" | "subletter" | null;
  dismiss: (choice: WelcomeChoice) => void;
}

export default function WelcomePopup({ show, returningMode, dismiss }: WelcomePopupProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!show) return null;

  const handleSublet = () => {
    dismiss("sublet");
    navigate("/signup?role=tenant");
  };

  const handleFind = () => {
    dismiss("find");
    navigate("/find");
  };

  const handleSkip = () => {
    dismiss("skip");
  };

  const handleContinueSearch = () => {
    dismiss("find");
    navigate("/find");
  };

  const handleGoToDashboard = () => {
    dismiss("sublet");
    navigate("/tenant/dashboard");
  };

  // Returning user variants
  if (returningMode === "finder") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mx-4 w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-3xl">🏠</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
            <p className="mt-2 text-muted-foreground">
              Ready to find your Boston summer home? Your preferences are saved 🏠
            </p>
            <Button onClick={handleContinueSearch} className="mt-6 w-full rounded-xl py-6 text-base font-semibold">
              Continue my search
            </Button>
            <button onClick={handleSkip} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Skip for now — just browse
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (returningMode === "subletter") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mx-4 w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
              <span className="text-3xl">🗝️</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
            <p className="mt-2 text-muted-foreground">
              Manage your listing or check your messages 🗝️
            </p>
            <Button onClick={handleGoToDashboard} className="mt-6 w-full rounded-xl py-6 text-base font-semibold">
              Go to my dashboard
            </Button>
            <button onClick={handleSkip} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Skip for now — just browse
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // First-time popup — mobile bottom sheet vs desktop centered modal
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-card pb-8 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6 pt-2">
              {/* Logo + heading */}
              <div className="text-center mb-6">
                <img src="/favicon.png" alt="SubIn" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
                <h2 className="text-2xl font-bold text-foreground">Welcome to SubIn 🏠</h2>
                <p className="mt-1.5 text-muted-foreground">What brings you here today?</p>
              </div>

              {/* Find a place card — primary on mobile */}
              <OptionCard
                emoji="🏠"
                title="I need a place this summer"
                description="Answer 7 quick questions and our AI finds your perfect match"
                bullets={["Personalized matches", "Compare side by side", "Message hosts instantly"]}
                buttonText="Find my place"
                onClick={handleFind}
                highlighted
                aiPowered
              />

              <div className="mt-4">
                <OptionCard
                  emoji="🗝️"
                  title="I have a place to sublet"
                  description="List your apartment and find a verified subtenant fast"
                  bullets={["Verified renters only", "Managed by Boston Brokerage Group", "Get paid securely"]}
                  buttonText="Start listing"
                  onClick={handleSublet}
                />
              </div>

              <button onClick={handleSkip} className="mt-6 block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                Skip for now — just browse
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop centered modal
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-4 w-full max-w-2xl rounded-3xl bg-card p-10 shadow-2xl"
        >
          {/* Logo + heading */}
          <div className="text-center mb-8">
            <img src="/favicon.png" alt="SubIn" className="mx-auto mb-4 h-14 w-14 rounded-xl" />
            <h2 className="text-3xl font-bold text-foreground">Welcome to SubIn 🏠</h2>
            <p className="mt-2 text-lg text-muted-foreground">What brings you here today?</p>
          </div>

          {/* Two cards side by side */}
          <div className="grid grid-cols-2 gap-5">
            <OptionCard
              emoji="🗝️"
              title="I have a place to sublet"
              description="List your apartment and find a verified subtenant fast"
              bullets={["Verified renters only", "Managed by Boston Brokerage Group", "Get paid securely"]}
              buttonText="Start listing"
              onClick={handleSublet}
            />
            <OptionCard
              emoji="🏠"
              title="I need a place this summer"
              description="Answer 7 quick questions and our AI finds your perfect match"
              bullets={["Personalized matches", "Compare side by side", "Message hosts instantly"]}
              buttonText="Find my place"
              onClick={handleFind}
              highlighted
              aiPowered
            />
          </div>

          <button onClick={handleSkip} className="mt-6 block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip for now — just browse
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* Reusable option card */
function OptionCard({
  emoji,
  title,
  description,
  bullets,
  buttonText,
  onClick,
  highlighted = false,
  aiPowered = false,
}: {
  emoji: string;
  title: string;
  description: string;
  bullets: string[];
  buttonText: string;
  onClick: () => void;
  highlighted?: boolean;
  aiPowered?: boolean;
}) {
  return (
    <div
      className={`group relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
        highlighted
          ? "border-primary/30 bg-primary/[0.03] hover:border-primary"
          : "border-border bg-card hover:border-primary/40"
      }`}
      onClick={onClick}
    >
      {aiPowered && (
        <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600">
          <Sparkles className="h-3 w-3" /> AI Powered
        </span>
      )}

      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <span className="text-2xl">{emoji}</span>
      </div>

      <h3 className="text-center text-lg font-bold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">{description}</p>

      <ul className="mt-4 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            {b}
          </li>
        ))}
      </ul>

      <Button
        className="mt-5 w-full rounded-xl py-5 text-sm font-semibold"
        variant={highlighted ? "default" : "outline"}
      >
        {buttonText}
      </Button>
    </div>
  );
}
