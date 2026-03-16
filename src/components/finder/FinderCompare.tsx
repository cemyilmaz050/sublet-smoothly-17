import { motion } from "framer-motion";
import { MapPin, Bed, Bath, CheckCircle2, MessageCircle, CalendarDays, Heart, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoredListing, FinderAnswers } from "./types";
import { useNavigate } from "react-router-dom";

interface Props {
  listings: ScoredListing[];
  answers: FinderAnswers;
  onSelect: (listing: ScoredListing) => void;
}

const FinderCompare = ({ listings, answers, onSelect }: Props) => {
  const navigate = useNavigate();

  // Determine badges
  const cheapest = listings.reduce((a, b) => ((a.monthly_rent || Infinity) < (b.monthly_rent || Infinity) ? a : b));
  const closest = listings.reduce((a, b) => ((a.matchScore || 0) > (b.matchScore || 0) ? a : b));

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">
            You saved {listings.length} places — compare them side by side
          </h1>
          <p className="mt-2 text-muted-foreground">Scroll to compare and pick your favorite</p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {listings.map((listing, index) => {
            const isBestValue = listing.id === cheapest.id;
            const isClosest = listing.id === closest.id && listing.id !== cheapest.id;
            const weeklyRent = listing.monthly_rent ? Math.round(listing.monthly_rent / 4.33) : null;
            const photo = listing.photos?.[0] || "/placeholder.svg";

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="min-w-[300px] max-w-[340px] flex-shrink-0 snap-center rounded-2xl border bg-card shadow-elevated overflow-hidden flex flex-col"
              >
                {/* Badges */}
                <div className="relative">
                  <img src={photo} alt={listing.headline || "Listing"} className="h-48 w-full object-cover" />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Badge className="bg-emerald text-emerald-foreground font-bold">
                      {listing.matchScore}% match
                    </Badge>
                    {isBestValue && (
                      <Badge className="bg-emerald/90 text-emerald-foreground font-semibold">
                        <Heart className="mr-1 h-3 w-3" /> Best Value
                      </Badge>
                    )}
                    {isClosest && (
                      <Badge className="bg-primary text-primary-foreground font-semibold">
                        <Navigation className="mr-1 h-3 w-3" /> Closest to You
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-foreground text-lg truncate">
                      {listing.headline || listing.address || "Apartment"}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{listing.address || "Boston, MA"}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-2xl font-bold text-foreground">${listing.monthly_rent?.toLocaleString()}</span>
                    <span className="text-muted-foreground">/mo</span>
                    {weeklyRent && <p className="text-xs text-muted-foreground">≈ ${weeklyRent}/wk</p>}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {listing.bedrooms && <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.bedrooms} bed</span>}
                    {listing.bathrooms && <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {listing.bathrooms} bath</span>}
                  </div>

                  {listing.distanceLabel && (
                    <p className="text-sm text-primary font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {listing.distanceLabel}</p>
                  )}

                  {/* Amenities checklist */}
                  <div className="space-y-1.5">
                    {listing.matchReasons.slice(0, 5).map((reason) => (
                      <div key={reason} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0" />
                        <span className="text-foreground">{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 space-y-2">
                    <Button className="w-full" onClick={() => onSelect(listing)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message Host
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => onSelect(listing)}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Schedule a Visit
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinderCompare;
