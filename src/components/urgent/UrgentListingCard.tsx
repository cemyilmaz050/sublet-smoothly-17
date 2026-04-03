import { useState, useEffect } from "react";
import { Zap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UrgentListing {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  asking_price: number | null;
  photos: string[] | null;
  urgency_deadline: string | null;
  available_from: string | null;
  available_until: string | null;
}

interface Props {
  listing: UrgentListing;
  onMakeOffer: (listing: UrgentListing) => void;
}

const UrgentListingCard = ({ listing, onMakeOffer }: Props) => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!listing.urgency_deadline) return;
    const update = () => {
      const now = new Date().getTime();
      const deadline = new Date(listing.urgency_deadline!).getTime();
      const diff = deadline - now;
      if (diff <= 0) { setCountdown("Expired"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setCountdown(`${days}d ${hours}h`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [listing.urgency_deadline]);

  const marketRate = listing.monthly_rent || 0;
  const askingPrice = listing.asking_price || marketRate;
  const savings = marketRate > askingPrice ? Math.round(((marketRate - askingPrice) / marketRate) * 100) : 0;

  return (
    <div className="min-w-[280px] max-w-[300px] shrink-0 rounded-2xl overflow-hidden border-2 border-amber-400/60 bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 shadow-lg transition-transform hover:scale-[1.02]">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {listing.photos && listing.photos[0] ? (
          <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
            <Home className="h-10 w-10 text-amber-300" />
          </div>
        )}
        {/* Urgent badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-md animate-pulse">
            <Zap className="h-3 w-3" /> Urgent
          </span>
        </div>
        {/* Countdown */}
        {countdown && countdown !== "Expired" && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
              Fills in {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-sm truncate">{listing.headline || "Untitled"}</h3>
        <p className="text-xs text-muted-foreground truncate">{listing.address || "Address not specified"}</p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          {marketRate > askingPrice && (
            <span className="text-sm text-muted-foreground line-through">${marketRate.toLocaleString()}</span>
          )}
          <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
            ${askingPrice.toLocaleString()}<span className="text-xs font-normal">/mo</span>
          </span>
          {savings > 0 && (
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Save {savings}%
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          onClick={() => onMakeOffer(listing)}
        >
          <Zap className="mr-1 h-3.5 w-3.5" /> Make an Offer
        </Button>
      </div>
    </div>
  );
};

export default UrgentListingCard;
