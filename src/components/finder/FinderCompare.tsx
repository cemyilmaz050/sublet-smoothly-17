import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Bed, Bath, CheckCircle2, XCircle, MessageCircle,
  CalendarDays, Heart, Navigation, ArrowRight, ArrowLeft,
  ChevronLeft, ChevronRight, Home, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScoredListing, FinderAnswers } from "./types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  listings: ScoredListing[];
  answers: FinderAnswers;
  onSelect: (listing: ScoredListing) => void;
  onBack?: () => void;
}

type SortMode = "match" | "price" | "closest";

/* ── All known preference labels ── */
const ALL_PREFERENCES = [
  "Within budget",
  "Available dates match",
  "Furnished",
  "In-unit laundry",
  "Pet friendly",
  "Parking included",
  "Gym access",
  "Air conditioning",
  "Dishwasher",
  "Near transit",
];

const matchColor = (score: number) => {
  if (score >= 80) return "bg-emerald text-emerald-foreground";
  if (score >= 50) return "bg-amber text-amber-foreground";
  return "bg-muted text-muted-foreground";
};

/* ── Card component ── */
const CompareCard = ({
  listing,
  isBestValue,
  isClosest,
  onMessage,
  onSchedule,
  onViewFull,
}: {
  listing: ScoredListing;
  isBestValue: boolean;
  isClosest: boolean;
  onMessage: () => void;
  onSchedule: () => void;
  onViewFull: () => void;
}) => {
  const weeklyRent = listing.monthly_rent ? Math.round(listing.monthly_rent / 4.33) : null;
  const photo = listing.photos?.[0];
  const matchedSet = new Set(listing.matchReasons);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -12px hsl(var(--primary) / 0.15)" }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col cursor-pointer group"
      onClick={onViewFull}
    >
      {/* Photo */}
      <div className="relative h-[220px] overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.headline || "Listing"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-muted/50 flex flex-col items-center justify-center gap-2">
            <Home className="h-10 w-10 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50">No photo available</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge className={cn("font-bold text-sm px-3 py-1", matchColor(listing.matchScore))}>
            {listing.matchScore}% match
          </Badge>
          {isBestValue && (
            <Badge className="bg-emerald/90 text-emerald-foreground font-semibold">
              <Heart className="mr-1 h-3 w-3" /> Best Value
            </Badge>
          )}
          {isClosest && (
            <Badge className="bg-primary text-primary-foreground font-semibold">
              <Navigation className="mr-1 h-3 w-3" /> Closest
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 space-y-3">
        {/* Title & address */}
        <div>
          <h3 className="font-semibold text-foreground text-[18px] leading-snug line-clamp-2">
            {listing.headline || listing.address || "Apartment"}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{listing.address || "Boston, MA"}</span>
          </div>
        </div>

        {/* Price */}
        <div>
          <span className="text-2xl font-bold text-primary">${listing.monthly_rent?.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm">/mo</span>
          {weeklyRent && <p className="text-xs text-muted-foreground mt-0.5">≈ ${weeklyRent}/wk</p>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {listing.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" /> {listing.bedrooms} bed
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" /> {listing.bathrooms} bath
            </span>
          )}
        </div>

        {listing.distanceLabel && (
          <p className="text-sm text-primary font-medium flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {listing.distanceLabel}
          </p>
        )}

        {/* Match indicators */}
        <div className="space-y-1.5">
          {ALL_PREFERENCES.map((pref) => {
            const matched = matchedSet.has(pref);
            return (
              <div key={pref} className={cn("flex items-center gap-2 text-sm", matched ? "text-foreground" : "text-muted-foreground/50")}>
                {matched ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
                )}
                <span>{pref}</span>
              </div>
            );
          })}
        </div>

        <Separator className="my-1" />

        {/* Actions */}
        <div className="mt-auto pt-2 space-y-2">
          <Button
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onMessage(); }}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Host
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={(e) => { e.stopPropagation(); onSchedule(); }}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Schedule a Visit
          </Button>
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={(e) => { e.stopPropagation(); onViewFull(); }}
          >
            View Full Listing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main comparison view ── */
const FinderCompare = ({ listings, answers, onSelect, onBack }: Props) => {
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortMode>("match");
  const [detailListing, setDetailListing] = useState<ScoredListing | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const sorted = [...listings].sort((a, b) => {
    if (sort === "match") return (b.matchScore || 0) - (a.matchScore || 0);
    if (sort === "price") return (a.monthly_rent || Infinity) - (b.monthly_rent || Infinity);
    return (b.matchScore || 0) - (a.matchScore || 0);
  });

  const cheapest = listings.reduce((a, b) =>
    (a.monthly_rent || Infinity) < (b.monthly_rent || Infinity) ? a : b
  );
  const closest = listings.reduce((a, b) =>
    (a.matchScore || 0) > (b.matchScore || 0) ? a : b
  );

  const openDetail = (listing: ScoredListing) => setDetailListing(listing);

  return (
    <div className="min-h-screen px-4 md:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to matches
          </Button>
        )}
        <h1 className="text-3xl font-bold text-foreground text-center">
          You saved {listings.length} places — compare them side by side
        </h1>
        <p className="mt-2 text-muted-foreground text-center">Pick your favorite or view full details</p>

        {/* Sort row */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {([
            ["match", "Best match"],
            ["price", "Lowest price"],
            ["closest", "Closest"],
          ] as [SortMode, string][]).map(([key, label]) => (
            <Button
              key={key}
              variant={sort === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSort(key)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Desktop grid */}
      {!isMobile && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <CompareCard
                listing={listing}
                isBestValue={listing.id === cheapest.id}
                isClosest={listing.id === closest.id && listing.id !== cheapest.id}
                onMessage={() => onSelect(listing)}
                onSchedule={() => onSelect(listing)}
                onViewFull={() => openDetail(listing)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Mobile carousel */}
      {isMobile && (
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={sorted[mobileIndex]?.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25 }}
            >
              {sorted[mobileIndex] && (
                <CompareCard
                  listing={sorted[mobileIndex]}
                  isBestValue={sorted[mobileIndex].id === cheapest.id}
                  isClosest={sorted[mobileIndex].id === closest.id && sorted[mobileIndex].id !== cheapest.id}
                  onMessage={() => onSelect(sorted[mobileIndex])}
                  onSchedule={() => onSelect(sorted[mobileIndex])}
                  onViewFull={() => openDetail(sorted[mobileIndex])}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="icon"
              disabled={mobileIndex === 0}
              onClick={() => setMobileIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {/* Dots */}
            <div className="flex gap-2">
              {sorted.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobileIndex(i)}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    i === mobileIndex ? "bg-primary" : "bg-muted-foreground/25"
                  )}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={mobileIndex === sorted.length - 1}
              onClick={() => setMobileIndex((i) => Math.min(sorted.length - 1, i + 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Full listing detail sheet */}
      <Sheet open={!!detailListing} onOpenChange={() => setDetailListing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {detailListing && (
            <div className="space-y-6 pb-8">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold">
                  {detailListing.headline || detailListing.address || "Listing Details"}
                </SheetTitle>
              </SheetHeader>

              {/* Photo gallery */}
              {detailListing.photos && detailListing.photos.length > 0 ? (
                <div className="space-y-2">
                  <img
                    src={detailListing.photos[0]}
                    alt="Main"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  {detailListing.photos.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {detailListing.photos.slice(1, 7).map((p, i) => (
                        <img key={i} src={p} alt={`Photo ${i + 2}`} className="h-24 w-full object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-muted/50 rounded-xl flex items-center justify-center">
                  <Home className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}

              {/* Price & location */}
              <div>
                <p className="text-3xl font-bold text-primary">
                  ${detailListing.monthly_rent?.toLocaleString()}<span className="text-base text-muted-foreground font-normal">/mo</span>
                </p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {detailListing.address || "Boston, MA"}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                {detailListing.bedrooms != null && (
                  <span className="flex items-center gap-1 text-foreground"><Bed className="h-4 w-4" /> {detailListing.bedrooms} Bedrooms</span>
                )}
                {detailListing.bathrooms != null && (
                  <span className="flex items-center gap-1 text-foreground"><Bath className="h-4 w-4" /> {detailListing.bathrooms} Bathrooms</span>
                )}
                {detailListing.sqft && (
                  <span className="text-foreground">{detailListing.sqft} sqft</span>
                )}
              </div>

              {/* Dates */}
              {(detailListing.available_from || detailListing.available_until) && (
                <div className="text-sm text-muted-foreground">
                  <CalendarDays className="inline h-4 w-4 mr-1" />
                  {detailListing.available_from && `From ${detailListing.available_from}`}
                  {detailListing.available_until && ` — Until ${detailListing.available_until}`}
                </div>
              )}

              {/* Description */}
              {detailListing.description && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">About this place</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{detailListing.description}</p>
                </div>
              )}

              {/* Amenities */}
              {detailListing.amenities && detailListing.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailListing.amenities.map((a) => (
                      <Badge key={a} variant="secondary">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {detailListing.aiSummary && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <h4 className="font-semibold text-foreground mb-1">AI Match Summary</h4>
                  <p className="text-sm text-muted-foreground">{detailListing.aiSummary}</p>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <Button className="w-full" onClick={() => { setDetailListing(null); onSelect(detailListing); }}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Message Host
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setDetailListing(null); onSelect(detailListing); }}>
                  <CalendarDays className="mr-2 h-4 w-4" /> Schedule a Visit
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate("/listings")}>
                  View on Listings Page <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FinderCompare;
