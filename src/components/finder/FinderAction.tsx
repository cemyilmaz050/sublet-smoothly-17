import { motion } from "framer-motion";
import { MessageCircle, CalendarDays, Flame, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoredListing, FinderAnswers } from "./types";
import { useNavigate } from "react-router-dom";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  listing: ScoredListing;
  answers: FinderAnswers;
}

const FinderAction = ({ listing, answers }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const photo = listing.photos?.[0] || "/placeholder.svg";

  const handleMessage = () => {
    if (!user) {
      requireAuth(() => navigate("/messages"));
      return;
    }
    navigate("/messages");
  };

  const handleVisit = () => {
    if (!user) {
      requireAuth(() => navigate("/messages"));
      return;
    }
    navigate("/messages");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Listing preview */}
        <div className="rounded-2xl border bg-card shadow-elevated overflow-hidden">
          <div className="relative h-48">
            <img src={photo} alt={listing.headline || "Listing"} className="h-full w-full object-cover" />
            <div className="absolute top-3 right-3">
              <Badge className="bg-emerald text-emerald-foreground font-bold">
                {listing.matchScore}% match
              </Badge>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-foreground">
              {listing.headline || listing.address || "Your chosen apartment"}
            </h3>
            <p className="text-2xl font-bold text-primary mt-1">
              ${listing.monthly_rent?.toLocaleString()}<span className="text-sm text-muted-foreground font-normal">/mo</span>
            </p>
          </div>
        </div>

        {/* Action header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Great choice — here's how to make it yours</h1>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMessage}
            className="w-full rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-left hover:border-primary/40 hover:bg-primary/10 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Message the host</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Introduce yourself and ask any questions before committing
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVisit}
            className="w-full rounded-2xl border-2 border-amber/20 bg-amber/5 p-6 text-left hover:border-amber/40 hover:bg-amber/10 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber/15">
                <CalendarDays className="h-6 w-6 text-amber" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">📅 Schedule a visit</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  See the place in person before making a payment
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Urgency nudge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-coral/10 border border-coral/20 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
            <Flame className="h-4 w-4 text-coral" />
            Most sublets on SubIn get booked within 3 days of the first message — don't wait too long 🔥
          </div>
        </motion.div>

        {listing.knock_count > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {listing.knock_count} other {listing.knock_count === 1 ? "person is" : "people are"} interested in this place right now
          </div>
        )}

        {/* Browse all listings link */}
        <div className="text-center pt-4">
          <Button variant="ghost" onClick={() => navigate("/listings")} className="text-muted-foreground">
            Browse all listings instead
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default FinderAction;
