import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  MapPin, Calendar, ShieldCheck, Heart, Building2, Video,
  Search, SlidersHorizontal, Pencil, Eye, X, Map,
  MessageSquare, Loader2, CalendarIcon, Home, Check, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import SecureThisPlace from "@/components/listing/SecureThisPlace";
import ReviewSection from "@/components/ReviewSection";
import KnockButton from "@/components/KnockButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import StarRating from "@/components/StarRating";
import ShareListing from "@/components/ShareListing";
import ListingsMap from "@/components/discover/ListingsMap";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { toast } from "sonner";

import VideoPlayer from "@/components/video/VideoPlayer";
import UrgentListingCard from "@/components/urgent/UrgentListingCard";
import MakeOfferModal from "@/components/urgent/MakeOfferModal";

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
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [moveOutDate, setMoveOutDate] = useState<Date | undefined>();
  const [dbListings, setDbListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [offerListing, setOfferListing] = useState<ListingItem | null>(null);

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

        const listingIds = data.map((l: any) => l.id);
        const { data: reviews } = await supabase.from("reviews").select("listing_id, rating").in("listing_id", listingIds) as any;
        const ratingMap: Record<string, { sum: number; count: number }> = {};
        (reviews || []).forEach((r: any) => {
          if (!ratingMap[r.listing_id]) ratingMap[r.listing_id] = { sum: 0, count: 0 };
          ratingMap[r.listing_id].sum += r.rating;
          ratingMap[r.listing_id].count += 1;
        });

        const enriched = data.map((l: any) => ({
          ...l,
          tenant_verified: verifiedMap[l.tenant_id] || false,
          tenant_name: nameMap[l.tenant_id] || "Host",
          avg_rating: ratingMap[l.id] ? ratingMap[l.id].sum / ratingMap[l.id].count : 0,
          review_count: ratingMap[l.id]?.count || 0,
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

  const filtered = dbListings.filter((l) => {
    if (searchQuery && !l.address?.toLowerCase().includes(searchQuery.toLowerCase()) && !l.headline?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (urgentOnly && !l.is_urgent) return false;
    if (priceFilter && priceFilter !== "all") {
      const rent = l.monthly_rent ?? 0;
      if (priceFilter === "0-1500" && rent > 1500) return false;
      if (priceFilter === "1500-2500" && (rent < 1500 || rent > 2500)) return false;
      if (priceFilter === "2500+" && rent < 2500) return false;
    }
    if (moveInDate || moveOutDate) {
      const from = l.available_from ? new Date(l.available_from) : null;
      const until = l.available_until ? new Date(l.available_until) : null;
      if (moveInDate && from && from > moveInDate) return false;
      if (moveInDate && until && until < moveInDate) return false;
      if (moveOutDate && until && until < moveOutDate) return false;
      if (moveOutDate && from && from > moveOutDate) return false;
    }
    return true;
  });

  const urgentListings = dbListings.filter((l) => l.is_urgent);

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f} – ${u}`;
  };

  const isOwnListing = (listing: ListingItem) => user && listing.tenant_id === user.id;
  const isManagedListing = (listing: ListingItem) => user && listing.manager_id === user.id;

  const toggleSave = async (id: string) => {
    if (!user) { requireAuth(() => toggleSave(id)); return; }
    const isSaved = savedListings.has(id);
    setSavedListings((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    if (isSaved) await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", id);
    else await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: id });
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_listings").select("listing_id").eq("user_id", user.id).then(({ data }) => {
      if (data) setSavedListings(new Set(data.map((d) => d.listing_id)));
    });
  }, [user]);

  const [contactingId, setContactingId] = useState<string | null>(null);

  const handleContact = async (listing: ListingItem) => {
    if (!user) { requireAuth(() => handleContact(listing)); return; }
    setContactingId(listing.id);
    const { data: existing } = await supabase.from("conversations").select("id").eq("listing_id", listing.id).or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).maybeSingle();
    if (existing) { setContactingId(null); navigate(`/messages?conversation=${existing.id}`); return; }
    const { data: convo, error } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: listing.tenant_id, listing_id: listing.id }).select("id").single();
    setContactingId(null);
    if (error || !convo) { toast.error("Failed to start conversation."); return; }
    await supabase.from("messages").insert({ conversation_id: convo.id, sender_id: user.id, content: `Hi! I'm interested in your listing "${listing.headline || "your apartment"}". Is it still available?` });
    await supabase.from("notifications").insert({ user_id: listing.tenant_id, title: "New Message", message: `Someone sent you a message about "${listing.headline || "Untitled"}"`, type: "message", link: "/messages" });
    toast.success("Message sent!");
    navigate(`/messages?conversation=${convo.id}`);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">Available Listings</h1>
          <p className="mt-1 text-muted-foreground">Browse manager-approved sublets in your area</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border-b sticky top-16 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border bg-background px-4 h-11">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Search by location or name..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[16px] h-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button onClick={() => setSearchQuery("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
            </div>
            <Button variant="outline" className="rounded-full gap-2 shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <div className="hidden sm:flex items-center gap-1 rounded-full border p-0.5">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-3 text-xs" onClick={() => setViewMode("grid")}>
                Grid
              </Button>
              <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-3 text-xs" onClick={() => setViewMode("map")}>
                <Map className="mr-1 h-3.5 w-3.5" /> Map
              </Button>
            </div>
            {/* Urgent filter toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-full border p-0.5">
              <Button variant={!urgentOnly ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-3 text-xs" onClick={() => setUrgentOnly(false)}>
                All Listings
              </Button>
              <Button variant={urgentOnly ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-3 text-xs text-amber-600" onClick={() => setUrgentOnly(true)}>
                <Zap className="mr-1 h-3 w-3" /> Urgent Only
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("rounded-full", !moveInDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {moveInDate ? format(moveInDate, "MMM d") : "Move in"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={moveInDate} onSelect={setMoveInDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("rounded-full", !moveOutDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {moveOutDate ? format(moveOutDate, "MMM d") : "Move out"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={moveOutDate} onSelect={setMoveOutDate} disabled={(d) => d < (moveInDate || new Date())} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {(moveInDate || moveOutDate) && (
                <button onClick={() => { setMoveInDate(undefined); setMoveOutDate(undefined); }} className="text-xs text-primary hover:underline">Clear dates</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Urgent Sublets Section */}
        {!urgentOnly && urgentListings.length > 0 && viewMode === "grid" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Urgent Sublets</h2>
              <Link to="/urgent" className="ml-auto text-sm text-amber-600 hover:underline font-medium">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
              {urgentListings.map((listing) => (
                <UrgentListingCard key={listing.id} listing={listing as any} onMakeOffer={(l) => setOfferListing({ ...listing, ...l } as any)} />
              ))}
            </div>
          </div>
        )}
        {viewMode === "map" ? (
          <div className="rounded-2xl overflow-hidden border shadow-card" style={{ height: "calc(100vh - 280px)" }}>
            <ListingsMap
              listings={filtered}
              hoveredId={hoveredId}
              selectedId={selectedListing?.id || null}
              onSelect={(l) => setSelectedListing(l as any)}
            />
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground">No listings available</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">Check back soon or broaden your search.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onMouseEnter={() => setHoveredId(listing.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedListing(listing)}
                className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:shadow-elevated hover:-translate-y-1"
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
                  {/* Manager Approved badge */}
                  <div className="absolute left-3 top-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Manager Approved
                    </span>
                  </div>
                  {/* Video avatar thumbnail */}
                  {listing.intro_video_url && (
                    <div className="absolute left-3 bottom-3" onClick={(e) => e.stopPropagation()}>
                      <VideoPlayer videoUrl={listing.intro_video_url} compact />
                    </div>
                  )}
                  {/* Video badge */}
                  {listing.intro_video_url && (
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-medium text-white">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-[15px] truncate">{listing.headline || "Untitled"}</h3>
                    {listing.monthly_rent && (
                      <p className="whitespace-nowrap text-lg font-bold text-primary shrink-0">
                        ${listing.monthly_rent.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {listing.address || "Address not specified"}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 truncate">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatDates(listing.available_from, listing.available_until) || "Dates not specified"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Drawer */}
      <Sheet open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg safe-bottom">
          {selectedListing && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8 text-xl">{selectedListing.headline || "Untitled"}</SheetTitle>
                <div className="flex items-center gap-2 pt-1">
                  <ShareListing listingId={selectedListing.id} headline={selectedListing.headline} address={selectedListing.address} />
                </div>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                {/* Tenant intro video */}
                {selectedListing.intro_video_url && (
                  <VideoPlayer
                    videoUrl={selectedListing.intro_video_url}
                    tenantName={selectedListing.tenant_name || "Host"}
                    verified={selectedListing.tenant_verified}
                  />
                )}
                {selectedListing.photos && selectedListing.photos[0] && (
                  <div className="overflow-hidden rounded-xl">
                    <img src={selectedListing.photos[0]} alt={selectedListing.headline || ""} className="h-56 w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Manager Approved
                  </span>
                  {selectedListing.tenant_verified && <VerifiedBadge verified />}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Monthly Rent", value: `$${selectedListing.monthly_rent?.toLocaleString() ?? "-"}`, primary: true },
                    { label: "Bedrooms", value: selectedListing.bedrooms ?? "-" },
                    { label: "Bathrooms", value: selectedListing.bathrooms ?? "-" },
                    { label: "Sq. Ft.", value: selectedListing.sqft ?? "-" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-lg font-bold ${item.primary ? "text-primary" : "text-foreground"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{selectedListing.address || "Unknown"}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{formatDates(selectedListing.available_from, selectedListing.available_until)}</p>
                </div>
                {selectedListing.description && (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-foreground">About this place</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedListing.description}</p>
                  </div>
                )}
                <ReviewSection listingId={selectedListing.id} tenantId={selectedListing.tenant_id} />

                {selectedListing.management_group_id && !isOwnListing(selectedListing) && (
                  <Button className="w-full rounded-full" size="lg" variant="outline" onClick={() => navigate(`/documents/bbg?listing_id=${selectedListing.id}`)}>
                    <Pencil className="mr-1 h-4 w-4" /> Complete BBG Documents
                  </Button>
                )}

                <div className="space-y-3 pt-2">
                  {!isOwnListing(selectedListing) && (
                    <>
                      <SecureThisPlace listing={selectedListing} />
                      <KnockButton listingId={selectedListing.id} tenantId={selectedListing.tenant_id} listingHeadline={selectedListing.headline} listingAddress={selectedListing.address} knockCount={(selectedListing as any).knock_count || 0} />
                      <Button variant="outline" className="w-full rounded-full" size="lg" onClick={() => handleContact(selectedListing)} disabled={contactingId === selectedListing.id}>
                        {contactingId === selectedListing.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Opening chat...</> : <><MessageSquare className="mr-1 h-4 w-4" />Send a Message</>}
                      </Button>
                    </>
                  )}
                  {role === "tenant" && isOwnListing(selectedListing) && (
                    <Button className="w-full rounded-full" size="lg" onClick={() => navigate(`/listings/edit/${selectedListing.id}`)}><Pencil className="mr-1 h-4 w-4" />Edit Listing</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ListingsPage;
