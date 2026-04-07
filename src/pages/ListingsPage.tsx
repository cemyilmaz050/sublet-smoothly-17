import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  MapPin, Calendar, ShieldCheck, Heart, Building2,
  Search, X, Map,
  MessageSquare, Loader2, CalendarIcon, Home, Zap, Bed, Bath,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import SecureThisPlace from "@/components/listing/SecureThisPlace";
import ReviewSection from "@/components/ReviewSection";
import KnockButton from "@/components/KnockButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import ShareListing from "@/components/ShareListing";
import ListingsMap from "@/components/discover/ListingsMap";
import VideoPlayer from "@/components/video/VideoPlayer";
import MakeOfferModal from "@/components/urgent/MakeOfferModal";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { toast } from "sonner";

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
  avg_rating?: number;
  review_count?: number;
  intro_video_url?: string | null;
  tenant_name?: string | null;
  is_urgent?: boolean;
  asking_price?: number | null;
  urgency_deadline?: string | null;
}

const ListingsPage = () => {
  const { user, role } = useAuth();
  const { requireAuth } = useAuthModal();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [bedroomFilter, setBedroomFilter] = useState("");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [dbListings, setDbListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [offerListing, setOfferListing] = useState<ListingItem | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id, management_group_id, property_type, knock_count, latitude, longitude, intro_video_url, is_urgent, asking_price, urgency_deadline")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const tenantIds = [...new Set(data.map((l: any) => l.tenant_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, id_verified, first_name, last_name").in("id", tenantIds) as any;
        const verifiedMap: Record<string, boolean> = {};
        const nameMap: Record<string, string> = {};
        (profiles || []).forEach((p: any) => {
          verifiedMap[p.id] = p.id_verified;
          nameMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Host";
        });

        const enriched = data.map((l: any) => ({
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
    if (!selectedListing || !user) return;
    supabase.from("listing_views").insert({ listing_id: selectedListing.id, viewer_id: user.id }).then();
  }, [selectedListing?.id]);

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

  const urgentListings = dbListings.filter((l) => l.is_urgent);

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${f} - ${u}`;
  };

  const isOwnListing = (listing: ListingItem) => user && listing.tenant_id === user.id;

  const toggleSave = async (id: string) => {
    if (!user) { requireAuth(() => toggleSave(id)); return; }
    const isSaved = savedListings.has(id);
    setSavedListings((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    if (isSaved) await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", id);
    else await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: id });
  };

  const handleContact = async (listing: ListingItem) => {
    if (!user) { requireAuth(() => handleContact(listing)); return; }
    setContactingId(listing.id);
    const { data: existing } = await supabase.from("conversations").select("id").eq("listing_id", listing.id).or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).maybeSingle();
    if (existing) { setContactingId(null); navigate(`/messages?conversation=${existing.id}`); return; }
    const { data: convo, error } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: listing.tenant_id, listing_id: listing.id }).select("id").single();
    setContactingId(null);
    if (error || !convo) { toast.error("Failed to start conversation."); return; }
    await supabase.from("messages").insert({ conversation_id: convo.id, sender_id: user.id, content: `Hi! I'm interested in your listing "${listing.headline || "your apartment"}". Is it still available?` });
    await supabase.from("notifications").insert({ user_id: listing.tenant_id, title: "New Message", message: `Someone messaged you about "${listing.headline || "Untitled"}"`, type: "message", link: "/messages" });
    toast.success("Message sent!");
    navigate(`/messages?conversation=${convo.id}`);
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
            <div className="hidden sm:flex items-center gap-1 rounded-full border p-0.5">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-3 text-[13px]" onClick={() => setViewMode("grid")}>
                Grid
              </Button>
              <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-3 text-[13px]" onClick={() => setViewMode("map")}>
                <Map className="mr-1 h-3.5 w-3.5" /> Map
              </Button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {/* Price filter */}
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

            {/* Bedroom filter */}
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

            {/* Dates */}
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
        {/* Urgent section */}
        {urgentListings.length > 0 && viewMode === "grid" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-foreground">Urgent - priced to fill fast</h2>
              <Link to="/urgent" className="text-[13px] text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              {urgentListings.slice(0, 6).map((listing) => {
                const marketRate = listing.monthly_rent ?? 0;
                const askingPrice = listing.asking_price ?? marketRate;
                const savings = marketRate > askingPrice ? Math.round(((marketRate - askingPrice) / marketRate) * 100) : 0;
                return (
                  <div key={listing.id} className="shrink-0 w-[260px] rounded-2xl border bg-card overflow-hidden shadow-card">
                    <div className="relative h-[140px]">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center"><Home className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-baseline gap-2">
                        {savings > 0 && <span className="text-[13px] text-muted-foreground line-through">${marketRate.toLocaleString()}</span>}
                        <span className="text-[18px] font-bold text-foreground">${askingPrice.toLocaleString()}<span className="text-[13px] font-normal text-muted-foreground">/mo</span></span>
                        {savings > 0 && <span className="text-[13px] font-semibold text-emerald-600">Save {savings}%</span>}
                      </div>
                      <p className="text-[13px] text-muted-foreground mt-1 truncate">{listing.address || "Address not specified"}</p>
                      <Button
                        size="sm"
                        className="w-full mt-3 rounded-full text-[13px] h-9"
                        onClick={(e) => { e.stopPropagation(); setOfferListing(listing); }}
                      >
                        Make an offer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "map" ? (
          <div className="rounded-2xl overflow-hidden border shadow-card" style={{ height: "calc(100vh - 220px)" }}>
            <ListingsMap listings={filtered} hoveredId={hoveredId} selectedId={selectedListing?.id || null} onSelect={(l) => setSelectedListing(l as any)} />
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[15px] text-muted-foreground">Loading apartments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
              <Building2 className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="text-[18px] font-bold text-foreground">No apartments listed yet in Boston</p>
            <p className="mt-2 text-[15px] text-muted-foreground max-w-xs">Be the first to list yours, or check back soon.</p>
            <Button className="mt-6 rounded-full" onClick={() => navigate("/listings/create")}>
              List my apartment
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onMouseEnter={() => setHoveredId(listing.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedListing(listing)}
                className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {listing.photos && listing.photos.length > 0 ? (
                    <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Home className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
                    </div>
                  )}
                  {/* Save button */}
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
                    {listing.monthly_rent && (
                      <p className="whitespace-nowrap text-[18px] font-bold text-primary shrink-0">
                        ${listing.monthly_rent.toLocaleString()}<span className="text-[13px] font-normal text-muted-foreground">/mo</span>
                      </p>
                    )}
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
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Sheet */}
      <Sheet open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg safe-bottom p-0">
          {selectedListing && (
            <div>
              {/* Photo gallery at top */}
              {selectedListing.photos && selectedListing.photos[0] && (
                <div className="relative">
                  <img src={selectedListing.photos[0]} alt={selectedListing.headline || ""} className="h-64 w-full object-cover" />
                  {selectedListing.photos.length > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[13px] text-white font-medium">
                      1 / {selectedListing.photos.length}
                    </span>
                  )}
                </div>
              )}

              <div className="p-6 space-y-5">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-[18px]">{selectedListing.headline || "Untitled"}</SheetTitle>
                  <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />{selectedListing.address || "Unknown"}
                  </p>
                </SheetHeader>

                <div className="flex items-center gap-2">
                  <ShareListing listingId={selectedListing.id} headline={selectedListing.headline} address={selectedListing.address} />
                  {selectedListing.tenant_verified && <VerifiedBadge verified />}
                </div>

                {/* Video */}
                {selectedListing.intro_video_url && (
                  <VideoPlayer videoUrl={selectedListing.intro_video_url} tenantName={selectedListing.tenant_name || "Host"} verified={selectedListing.tenant_verified} />
                )}

                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Monthly rent", value: selectedListing.monthly_rent ? `$${selectedListing.monthly_rent.toLocaleString()}` : "-", primary: true },
                    { label: "Bedrooms", value: selectedListing.bedrooms ?? "-" },
                    { label: "Bathrooms", value: selectedListing.bathrooms ?? "-" },
                    { label: "Size", value: selectedListing.sqft ? `${selectedListing.sqft} sq ft` : "-" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border p-3">
                      <p className="text-[13px] text-muted-foreground">{item.label}</p>
                      <p className={`text-[18px] font-bold ${item.primary ? "text-primary" : "text-foreground"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
                  <Calendar className="h-4 w-4" />{formatDates(selectedListing.available_from, selectedListing.available_until) || "Dates not specified"}
                </p>

                {selectedListing.description && (
                  <div>
                    <h4 className="mb-1 text-[15px] font-semibold text-foreground">About this place</h4>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">{selectedListing.description}</p>
                  </div>
                )}

                <ReviewSection listingId={selectedListing.id} tenantId={selectedListing.tenant_id} />

                {/* Actions */}
                {!isOwnListing(selectedListing) && (
                  <div className="space-y-3 pt-2">
                    {selectedListing.is_urgent ? (
                      <Button className="w-full rounded-full h-12 text-[15px]" size="lg" onClick={() => { setSelectedListing(null); setOfferListing(selectedListing); }}>
                        Make an offer
                      </Button>
                    ) : (
                      <SecureThisPlace listing={selectedListing} />
                    )}
                    <KnockButton listingId={selectedListing.id} tenantId={selectedListing.tenant_id} listingHeadline={selectedListing.headline} listingAddress={selectedListing.address} knockCount={(selectedListing as any).knock_count || 0} />
                    <Button variant="outline" className="w-full rounded-full h-12 text-[15px]" size="lg" onClick={() => handleContact(selectedListing)} disabled={contactingId === selectedListing.id}>
                      {contactingId === selectedListing.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Opening chat...</> : <><MessageSquare className="mr-1 h-4 w-4" />Send a message</>}
                    </Button>
                  </div>
                )}
                {role === "tenant" && isOwnListing(selectedListing) && (
                  <Button className="w-full rounded-full h-12 text-[15px]" size="lg" onClick={() => navigate(`/listings/edit/${selectedListing.id}`)}>
                    Edit listing
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Offer Modal */}
      {offerListing && (
        <MakeOfferModal open={!!offerListing} onClose={() => setOfferListing(null)} listing={offerListing} />
      )}
    </div>
  );
};

export default ListingsPage;
