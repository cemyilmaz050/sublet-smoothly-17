import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  MapPin, Heart,
  Search, X,
  Loader2, CalendarIcon, Bed, Bath,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import MakeOfferModal from "@/components/urgent/MakeOfferModal";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";

interface ListingItem {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  available_from: string | null;
  available_until: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  description: string | null;
  source: string;
  tenant_id: string;
  manager_id: string | null;
  management_group_id: string | null;
  property_type?: string | null;
  tenant_verified?: boolean;
  tenant_name?: string | null;
  is_urgent?: boolean;
  asking_price?: number | null;
  urgency_deadline?: string | null;
}

const ListingsPage = () => {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [bedroomFilter, setBedroomFilter] = useState("");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [dbListings, setDbListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [offerListing, setOfferListing] = useState<ListingItem | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id, management_group_id, property_type, knock_count, intro_video_url, is_urgent, asking_price, urgency_deadline")
        .eq("status", "active")
        .not("photos", "is", null)
        .neq("photos", "{}")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Filter out listings with empty photos arrays client-side as extra safety
        const withPhotos = data.filter((l: any) => l.photos && Array.isArray(l.photos) && l.photos.length > 0);
        
        const tenantIds = [...new Set(withPhotos.map((l: any) => l.tenant_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, id_verified, first_name, last_name").in("id", tenantIds) as any;
        const verifiedMap: Record<string, boolean> = {};
        const nameMap: Record<string, string> = {};
        (profiles || []).forEach((p: any) => {
          verifiedMap[p.id] = p.id_verified;
          nameMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Host";
        });

        const enriched = withPhotos.map((l: any) => ({
          ...l,
          tenant_verified: verifiedMap[l.tenant_id] || false,
          tenant_name: nameMap[l.tenant_id] || "Host",
        }));
        setDbListings(enriched as ListingItem[]);
      } else {
        setDbListings([]);
      }
      setLoading(false);
    };
    fetchListings();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_listings").select("listing_id").eq("user_id", user.id).then(({ data }) => {
      if (data) setSavedListings(new Set(data.map((d) => d.listing_id)));
    });
  }, [user]);

  const filtered = dbListings.filter((l) => {
    if (searchQuery && !l.address?.toLowerCase().includes(searchQuery.toLowerCase()) && !l.headline?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (priceFilter && priceFilter !== "all") {
      const rent = l.monthly_rent ?? 0;
      if (priceFilter === "0-1500" && rent > 1500) return false;
      if (priceFilter === "1500-2500" && (rent < 1500 || rent > 2500)) return false;
      if (priceFilter === "2500+" && rent < 2500) return false;
    }
    if (bedroomFilter && bedroomFilter !== "all") {
      const beds = l.bedrooms ?? 0;
      if (bedroomFilter === "studio" && beds !== 0) return false;
      if (bedroomFilter === "1" && beds !== 1) return false;
      if (bedroomFilter === "2" && beds !== 2) return false;
      if (bedroomFilter === "3+" && beds < 3) return false;
    }
    if (moveInDate) {
      const from = l.available_from ? new Date(l.available_from) : null;
      const until = l.available_until ? new Date(l.available_until) : null;
      if (from && from > moveInDate) return false;
      if (until && until < moveInDate) return false;
    }
    return true;
  });

  const urgentListings = filtered.filter((l) => l.is_urgent);
  const regularListings = filtered;

  const toggleSave = async (id: string) => {
    if (!user) { requireAuth(() => toggleSave(id)); return; }
    const isSaved = savedListings.has(id);
    setSavedListings((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    if (isSaved) await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", id);
    else await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: id });
  };

  // Render a listing card — used for both urgent and regular
  const renderCard = (listing: ListingItem, index: number) => {
    const isUrgent = listing.is_urgent;
    const marketRate = listing.monthly_rent ?? 0;
    const askingPrice = listing.asking_price ?? marketRate;
    const showDiscount = isUrgent && marketRate > 0 && askingPrice < marketRate;

    return (
      <motion.div
        key={listing.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5"
      >
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={listing.photos![0]}
            alt={listing.headline || ""}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <button
            onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Heart className={cn("h-4 w-4", savedListings.has(listing.id) ? "fill-red-500 text-red-500" : "text-foreground")} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-[15px] truncate">{listing.headline || "Untitled"}</h3>
              <p className="flex items-center gap-1 text-[13px] text-muted-foreground mt-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {listing.address || "Address not specified"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {showDiscount && (
                <span className="text-[13px] text-muted-foreground line-through block">${marketRate.toLocaleString()}</span>
              )}
              <p className="whitespace-nowrap text-[18px] font-bold text-primary">
                ${(showDiscount ? askingPrice : marketRate).toLocaleString()}<span className="text-[13px] font-normal text-muted-foreground">/mo</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[13px] text-muted-foreground">
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.bedrooms} bed</span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.bathrooms} bath</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Search Bar */}
      <div className="bg-card border-b sticky top-16 z-30">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border bg-background px-4 h-11">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Search by city or neighborhood..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[16px] h-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button onClick={() => setSearchQuery("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: "Any price", value: "all" },
              { label: "Under $1,500", value: "0-1500" },
              { label: "$1,500-$2,500", value: "1500-2500" },
              { label: "$2,500+", value: "2500+" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPriceFilter(priceFilter === p.value ? "" : p.value)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors",
                  priceFilter === p.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-accent"
                )}
              >
                {p.label}
              </button>
            ))}

            {[
              { label: "Studio", value: "studio" },
              { label: "1 bed", value: "1" },
              { label: "2 bed", value: "2" },
              { label: "3+ bed", value: "3+" },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => setBedroomFilter(bedroomFilter === b.value ? "" : b.value)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors",
                  bedroomFilter === b.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-accent"
                )}
              >
                {b.label}
              </button>
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors flex items-center gap-1.5",
                  moveInDate ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-accent"
                )}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {moveInDate ? format(moveInDate, "MMM d") : "Move-in date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={moveInDate} onSelect={setMoveInDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            {(priceFilter || bedroomFilter || moveInDate) && (
              <button
                onClick={() => { setPriceFilter(""); setBedroomFilter(""); setMoveInDate(undefined); }}
                className="shrink-0 text-[13px] text-primary hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[15px] text-muted-foreground">Loading apartments...</p>
          </div>
        ) : regularListings.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-[18px] font-semibold text-foreground">No listings available yet</p>
            <p className="mt-2 text-[15px] text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Urgent section — only if there are urgent listings with photos */}
            {urgentListings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[15px] font-semibold text-amber-600">Priced to fill fast</p>
                  <Link to="/urgent" className="text-[13px] text-primary hover:underline font-medium">View all</Link>
                </div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {urgentListings.slice(0, 3).map((listing, i) => renderCard(listing, i))}
                </div>
              </div>
            )}

            {/* All listings */}
            <div>
              {urgentListings.length > 0 && (
                <p className="text-[15px] font-semibold text-foreground mb-4">All listings</p>
              )}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {regularListings.map((listing, index) => renderCard(listing, index))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Offer Modal */}
      {offerListing && (
        <MakeOfferModal open={!!offerListing} onClose={() => setOfferListing(null)} listing={offerListing} />
      )}
    </div>
  );
};

export default ListingsPage;
