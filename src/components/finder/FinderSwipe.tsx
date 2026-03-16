import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, X, MapPin, Bed, Bath, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoredListing, FinderAnswers } from "./types";

interface Props {
  listings: ScoredListing[];
  onComplete: (saved: ScoredListing[]) => void;
  answers: FinderAnswers;
}

const SWIPE_THRESHOLD = 100;

const FinderSwipe = ({ listings, onComplete, answers }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedListings, setSavedListings] = useState<ScoredListing[]>([]);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const currentListing = listings[currentIndex];
  const isLastCard = currentIndex >= listings.length - 1;

  const handleSwipe = useCallback((liked: boolean) => {
    if (liked && currentListing) {
      setSavedListings((prev) => [...prev, currentListing]);
    }
    setDirection(liked ? "right" : "left");
    
    setTimeout(() => {
      setDirection(null);
      if (isLastCard) {
        const finalSaved = liked ? [...savedListings, currentListing] : savedListings;
        onComplete(finalSaved);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 300);
  }, [currentListing, currentIndex, isLastCard, savedListings, onComplete]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) handleSwipe(true);
    else if (info.offset.x < -SWIPE_THRESHOLD) handleSwipe(false);
  };

  if (!currentListing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">No matches found 😔</h2>
        <p className="mt-2 text-muted-foreground">Try adjusting your preferences</p>
      </div>
    );
  }

  const photoUrl = currentListing.photos?.[0] || "/placeholder.svg";
  const weeklyRent = currentListing.monthly_rent ? Math.round(currentListing.monthly_rent / 4.33) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      {/* Counter */}
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Listing {currentIndex + 1} of {listings.length} matches
        </p>
        {savedListings.length > 0 && (
          <p className="mt-1 text-xs text-primary font-medium">
            {savedListings.length} saved
          </p>
        )}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentListing.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={
              direction === "left"
                ? { x: -400, opacity: 0, rotate: -15 }
                : direction === "right"
                ? { x: 400, opacity: 0, rotate: 15 }
                : { x: 0, opacity: 1, rotate: 0 }
            }
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="cursor-grab active:cursor-grabbing rounded-2xl border bg-card shadow-elevated overflow-hidden"
          >
            {/* Photo */}
            <div className="relative h-72 sm:h-80">
              <img
                src={photoUrl}
                alt={currentListing.headline || "Listing"}
                className="h-full w-full object-cover"
              />
              {/* Match score */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-emerald text-emerald-foreground px-3 py-1 text-sm font-bold shadow-lg">
                  {currentListing.matchScore}% match
                </Badge>
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-lg font-bold text-white truncate">
                  {currentListing.headline || currentListing.address || "Beautiful Apartment"}
                </h3>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{currentListing.address || "Boston, MA"}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  ${currentListing.monthly_rent?.toLocaleString() || "—"}
                </span>
                <span className="text-muted-foreground">/mo</span>
                {weeklyRent && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    ≈ ${weeklyRent}/wk
                  </span>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {currentListing.bedrooms && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" /> {currentListing.bedrooms} bed
                  </span>
                )}
                {currentListing.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" /> {currentListing.bathrooms} bath
                  </span>
                )}
                {currentListing.distanceLabel && (
                  <span className="flex items-center gap-1">
                    📍 {currentListing.distanceLabel}
                  </span>
                )}
              </div>

              {/* Match amenities pills */}
              {currentListing.matchReasons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentListing.matchReasons.slice(0, 4).map((reason) => (
                    <Badge key={reason} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              )}

              {/* AI summary */}
              <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  {currentListing.aiSummary}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center gap-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe(false)}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-card text-destructive shadow-lg hover:bg-destructive/10 transition-colors"
        >
          <X className="h-7 w-7" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-primary shadow-lg hover:bg-primary/10 transition-colors"
        >
          <Heart className="h-7 w-7" />
        </motion.button>
      </div>

      {/* Prompt to compare */}
      {savedListings.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Button
            variant="hero"
            size="lg"
            onClick={() => onComplete(savedListings)}
          >
            Compare {savedListings.length} saved places ✨
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default FinderSwipe;
