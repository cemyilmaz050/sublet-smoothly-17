import { useState } from "react";
import { Home, KeyRound, Copy, Check, Users, Share2, DollarSign, HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

type ReferralType = "tenant" | "renter" | null;

const ReferPage = () => {
  const [selected, setSelected] = useState<ReferralType>(null);
  const [copied, setCopied] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const referralLink = `https://subletsafe.com/r/${crypto.randomUUID().slice(0, 8)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        {/* Top right view referrals */}
        <div className="mb-8 flex justify-end">
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            View your referrals <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Heading */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Refer a friend, earn a cash reward
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Who are you referring?</p>
        </div>

        {/* Option cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OptionCard
            selected={selected === "tenant"}
            onClick={() => setSelected("tenant")}
            icon={<Home className="h-6 w-6" />}
            title="Tenant"
            description="Refer a friend who wants to sublet their apartment. You could earn $50."
          />
          <OptionCard
            selected={selected === "renter"}
            onClick={() => setSelected("renter")}
            icon={<KeyRound className="h-6 w-6" />}
            title="Renter"
            description="Refer a friend looking for a sublet. You could earn $25."
          />
        </div>

        {/* Copy link button */}
        <Button
          size="lg"
          className="w-full text-base"
          disabled={!selected}
          onClick={handleCopy}
        >
          {copied ? (
            <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Link Copied!</span>
          ) : (
            <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy Referral Link</span>
          )}
        </Button>

        {/* How it works */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setHowItWorksOpen(true)}
            className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            How referrals work
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-16 text-center text-xs text-muted-foreground/70">
          Rewards may vary. Terms apply.
        </p>
      </div>

      {/* How it works modal */}
      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">How referrals work</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <Step
              icon={<Users className="h-5 w-5 text-primary" />}
              step={1}
              title="Tell us who you're referring"
              description="Choose whether you're referring a tenant or a renter."
            />
            <Step
              icon={<Share2 className="h-5 w-5 text-primary" />}
              step={2}
              title="Send them your referral link"
              description="Share your unique link with your friend via text, email, or social media."
            />
            <Step
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              step={3}
              title="Get rewarded"
              description="Once your referred friend completes their first sublet within 180 days, your reward is sent within 14 days."
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Have questions?</span>
            <a href="/help" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
              Visit our Help Center
            </a>
          </div>

          <Button className="mt-4 w-full" size="lg" onClick={() => setHowItWorksOpen(false)}>
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OptionCard = ({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
      selected
        ? "border-primary bg-primary/5 shadow-md"
        : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
    }`}
  >
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {icon}
    </div>
    <div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </motion.button>
);

const Step = ({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: number;
  title: string;
  description: string;
}) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">
        Step {step}: {title}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default ReferPage;
