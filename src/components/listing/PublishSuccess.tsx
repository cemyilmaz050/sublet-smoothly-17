import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Copy, Mail, Share2, Clock } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Props {
  listingId: string;
  headline: string;
  onDashboard: () => void;
  isPending?: boolean;
}

const PublishSuccess = ({ listingId, headline, onDashboard, isPending = false }: Props) => {
  useEffect(() => {
    if (isPending) return;
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#7c3aed", "#a78bfa", "#c4b5fd"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#7c3aed", "#a78bfa", "#c4b5fd"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [isPending]);

  const shareUrl = `${window.location.origin}/listings?id=${listingId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my sublet listing: ${headline} — ${shareUrl}`)}`, "_blank");
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(`Check out my sublet: ${headline}`)}&body=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  if (isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="mx-4 w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber/10"
          >
            <Clock className="h-14 w-14 text-amber" />
          </motion.div>

          <h1 className="text-3xl font-bold text-foreground">Submitted for review! 📋</h1>
          <p className="mt-3 text-muted-foreground">
            Your listing has been sent to Boston Brokerage Group for approval.
          </p>

          <div className="mt-6 rounded-xl border border-amber/30 bg-amber/5 p-4">
            <p className="text-sm text-foreground font-medium">Under review by Boston Brokerage Group</p>
            <p className="mt-1 text-xs text-muted-foreground">Usually approved within 24 hours ⏱️</p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            We'll send you a notification as soon as your listing is approved and live on SubIn.
          </p>

          <div className="mt-8">
            <Button className="w-full" size="lg" onClick={onDashboard}>
              Go to My Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mx-4 w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
        >
          <CheckCircle className="h-14 w-14 text-primary" />
        </motion.div>

        <h1 className="text-3xl font-bold text-foreground">Your place is live on SubIn 🚪</h1>
        <p className="mt-3 text-muted-foreground">
          People can start finding it right now!
        </p>

        <div className="mt-8 space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => window.open(`/listings?id=${listingId}`, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View My Listing
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={onDashboard}
          >
            Go to My Dashboard
          </Button>
        </div>

        <div className="mt-8 rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Share your listing</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="text-emerald">
              <Share2 className="mr-1 h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareEmail}>
              <Mail className="mr-1 h-3.5 w-3.5" />
              Email
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PublishSuccess;
