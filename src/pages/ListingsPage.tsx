import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import WelcomePopup, { useWelcomePopup } from "@/components/WelcomePopup";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  MapPin, Calendar, DollarSign, ShieldCheck, Heart, Building2,
  Search, SlidersHorizontal, Pencil, Eye, X, CalendarDays, Map,
  MessageSquare, Loader2, CalendarIcon, Home, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import SecureThisPlace from "@/components/listing/SecureThisPlace";
import ReviewSection from "@/components/ReviewSection";
import KnockButton, { KnockActivity } from "@/components/KnockButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import StarRating from "@/components/StarRating";
import ShareListing from "@/components/ShareListing";
import CalendarView from "@/components/discover/CalendarView";
import ListingsMap from "@/components/discover/ListingsMap";
import { useNavigate } from "react-router-dom";
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
}

const ListingsPage = () => {
  const { user, role } = useAuth();
  const { requireAuth } = useAuthModal();
  const welcomePopup = useWelcomePopup();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [moveOutDate, setMoveOutDate] = useState<Date | undefined>();
  const [dbListings, setDbListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"map" | "calendar">("map");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id, management_group_id, property_type, knock_count, latitude, longitude")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const tenantIds = [...new Set(data.map((l: any) => l.tenant_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, id_verified")
          .in("id", tenantIds) as any;
        const verifiedMap: Record<string, boolean> = {};
        (profiles || []).forEach((p: any) => { verifiedMap[p.id] = p.id_verified; });

        const listingIds = data.map((l: any) => l.id);
        const { data: reviews } = await supabase
          .from("reviews")
          .select("listing_id, rating")
          .in("listing_id", listingIds) as any;

        const ratingMap: Record<string, { sum: number; count: number }> = {};
        (reviews || []).forEach((r: any) => {
          if (!ratingMap[r.listing_id]) ratingMap[r.listing_id] = { sum: 0, count: 0 };
          ratingMap[r.listing_id].sum += r.rating;
          ratingMap[r.listing_id].count += 1;
        });

        const enriched = data.map((l: any) => ({
          ...l,
          tenant_verified: verifiedMap[l.tenant_id] || false,
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
    supabase.from("listing_views").insert({
      listing_id: selectedListing.id,
      viewer_id: user.id,
    }).then();
  }, [selectedListing?.id]);

  const allListings = dbListings;

  const filtered = allListings.filter((l) => {
    if (searchQuery && !l.address?.toLowerCase().includes(searchQuery.toLowerCase()) && !l.headline?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
    if (calendarSelectedDate && viewMode === "calendar") {
      const date = new Date(calendarSelectedDate);
      const from = l.available_from ? new Date(l.available_from) : null;
      const until = l.available_until ? new Date(l.available_until) : null;
      if (!from || !until || date < from || date > until) return false;
    }
    return true;
  });

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
    setSavedListings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (isSaved) {
      await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", id);
    } else {
      await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: id });
    }
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
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .maybeSingle();

    if (existing) {
      setContactingId(null);
      navigate(`/messages?conversation=${existing.id}`);
      return;
    }

    const { data: convo, error } = await supabase
      .from("conversations")
      .insert({
        participant_1: user.id,
        participant_2: listing.tenant_id,
        listing_id: listing.id,
      })
      .select("id")
      .single();

    setContactingId(null);
    if (error || !convo) { toast.error("Failed to start conversation."); return; }

    await supabase.from("messages").insert({
      conversation_id: convo.id,
      sender_id: user.id,
      content: `Hi! I'm interested in your listing "${listing.headline || "your apartment"}". Is it still available?`,
    });

    await supabase.from("notifications").insert({
      user_id: listing.tenant_id,
      title: "New Message",
      message: `Someone sent you a message about "${listing.headline || "Untitled"}"`,
      type: "message",
      link: "/messages",
    });

    toast.success("Message sent! Redirecting to your conversation...");
    navigate(`/messages?conversation=${convo.id}`);
  };

    return (
    <div className="flex flex-col bg-background" style={{ height: "calc(100dvh - 4rem)" }}>
      <WelcomePopup show={welcomePopup.show} returningMode={welcomePopup.returningMode} dismiss={welcomePopup.dismiss} />

      {/* ===== LISTINGS SECTION ===== */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="z-30 border-b bg-card/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-background px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Search location..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[16px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}><X className="h-4 w-4 text-muted-foreground" /></button>
              )}
            </div>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[120px] sm:w-[160px] shrink-0">
                <DollarSign className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All prices</SelectItem>
                <SelectItem value="0-1500">Under $1,500</SelectItem>
                <SelectItem value="1500-2500">$1,500 – $2,500</SelectItem>
                <SelectItem value="2500+">$2,500+</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="shrink-0 h-9 w-9 sm:hidden" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className={cn(
            "items-center gap-2 px-3 pb-2 sm:flex sm:px-4 sm:pb-3 lg:px-6",
            showMobileFilters ? "flex" : "hidden sm:flex"
          )}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("flex-1 sm:flex-none sm:w-[140px] justify-start text-left font-normal text-xs h-10 sm:h-9", !moveInDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                  {moveInDate ? format(moveInDate, "MMM d") : "Move in"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={moveInDate} onSelect={setMoveInDate} disabled={(d) => d < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("flex-1 sm:flex-none sm:w-[140px] justify-start text-left font-normal text-xs h-10 sm:h-9", !moveOutDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                  {moveOutDate ? format(moveOutDate, "MMM d") : "Move out"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={moveOutDate} onSelect={setMoveOutDate} disabled={(d) => d < (moveInDate || new Date())} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            {(moveInDate || moveOutDate) && (
              <button onClick={() => { setMoveInDate(undefined); setMoveOutDate(undefined); }} className="text-xs text-primary hover:underline whitespace-nowrap">
                Clear dates
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 ml-auto">
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border p-0.5 ml-auto sm:ml-0">
              <Button
                variant={mobileView === "list" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => { setMobileView("list"); setViewMode("map"); setCalendarSelectedDate(null); }}
              >
                List
              </Button>
              <Button
                variant={mobileView === "map" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => { setMobileView("map"); setViewMode("map"); }}
              >
                <Map className="mr-1 h-3.5 w-3.5" /> Map
              </Button>
              <Button
                variant={viewMode === "calendar" && mobileView === "list" ? "default" : "ghost"}
                size="sm"
                className="hidden lg:flex h-7 px-2 text-xs"
                onClick={() => { setViewMode("calendar"); setMobileView("list"); }}
              >
                <CalendarDays className="mr-1 h-3.5 w-3.5" /> Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Split Screen — map is fixed height, listings scroll */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Left: Scrollable listings panel */}
          <div className={cn(
            "w-full lg:w-[45%] overflow-y-auto",
            mobileView === "map" && "hidden lg:block"
          )}>
            <div className="p-3 sm:p-4 lg:p-6">
              <h2 className="text-base font-medium text-foreground mb-1">All available sublets in Boston</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {filtered.length} place{filtered.length !== 1 ? "s" : ""} available
                {calendarSelectedDate && viewMode === "calendar" && (
                  <span className="ml-2">
                    · Showing availability for{" "}
                    <span className="font-medium text-foreground">
                      {new Date(calendarSelectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    <button onClick={() => setCalendarSelectedDate(null)} className="ml-1 text-primary hover:underline text-xs">
                      Clear
                    </button>
                  </span>
                )}
              </p>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading listings...</p>
                </div>
              ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onMouseEnter={() => setHoveredId(listing.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedListing(listing)}
                    className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-elevated active:scale-[0.99] h-[120px] sm:h-[140px] lg:h-[160px]"
                  >
                    <div className="flex h-full">
                      {/* Fixed-size photo */}
                      <div className="relative h-full w-[120px] sm:w-[140px] lg:w-[160px] shrink-0 overflow-hidden">
                        {listing.photos && listing.photos.length > 0 ? (
                          <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/60">
                            <Home className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="absolute left-2 top-2 flex flex-col gap-1">
                          {listing.tenant_verified && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                              <Check className="h-3 w-3 text-emerald-500" strokeWidth={2} />
                              Verified
                            </span>
                          )}
                        </div>
                        {isOwnListing(listing) && role === "tenant" && (
                          <div className="absolute right-2 top-2"><Badge className="bg-primary text-primary-foreground text-xs">Your listing</Badge></div>
                        )}
                        {isManagedListing(listing) && role === "manager" && (
                          <div className="absolute right-2 top-2"><Badge className="bg-accent text-accent-foreground text-xs">Managed by you</Badge></div>
                        )}
                      </div>
                      {/* Content area - fixed layout */}
                      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 min-w-0 overflow-hidden">
                        {/* Title + Price row */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-[15px] truncate">{listing.headline || "Untitled"}</h3>
                          <div className="ml-2 text-right shrink-0">
                            {listing.monthly_rent ? (
                              <p className="whitespace-nowrap text-lg font-bold text-primary">
                                ${listing.monthly_rent.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                              </p>
                            ) : (
                              <p className="whitespace-nowrap text-sm text-muted-foreground">Price TBD</p>
                            )}
                          </div>
                        </div>
                        {/* Address row */}
                        <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{listing.address || "Address not specified"}</span>
                        </p>
                        {/* Dates row */}
                        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="truncate">{formatDates(listing.available_from, listing.available_until) || "Dates not specified"}</span>
                        </p>
                        {/* Bottom row: Knock + actions */}
                        <div className="flex items-center gap-2 mt-auto">
                          {!isOwnListing(listing) && (
                            <KnockButton
                              listingId={listing.id}
                              tenantId={listing.tenant_id}
                              listingHeadline={listing.headline}
                              listingAddress={listing.address}
                              knockCount={(listing as any).knock_count || 0}
                              compact
                            />
                          )}
                          <div className="ml-auto flex items-center gap-1.5">
                            {(listing.avg_rating ?? 0) > 0 && (
                              <StarRating rating={listing.avg_rating || 0} size="sm" showCount count={listing.review_count} />
                            )}
                            {role !== "manager" && role !== "tenant" && (
                              <button onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent active:bg-accent">
                                <Heart className={`h-4 w-4 ${savedListings.has(listing.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filtered.length === 0 && !loading && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-base font-semibold text-foreground">No places here yet</p>
                    <p className="mt-1 text-sm text-muted-foreground max-w-xs">Boston is filling up fast though. Check back soon or broaden your search!</p>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Right: Map — fills remaining height, never scrolls */}
          <div className={cn(
            "lg:block lg:w-[55%] border-l relative z-[1] overflow-hidden",
            mobileView === "map" ? "block w-full" : "hidden"
          )}>
            <div className="h-full">
              {viewMode === "calendar" ? (
                <CalendarView
                  listings={allListings}
                  onDayClick={setCalendarSelectedDate}
                  selectedDate={calendarSelectedDate}
                />
              ) : (
                <ListingsMap
                  listings={filtered}
                  hoveredId={hoveredId}
                  selectedId={selectedListing?.id || null}
                  onSelect={(l) => setSelectedListing(l as any)}
                />
              )}
            </div>
          </div>
        </div>
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
                {selectedListing.photos && selectedListing.photos[0] && (
                  <div className="overflow-hidden rounded-lg">
                    <img src={selectedListing.photos[0]} alt={selectedListing.headline || ""} className="h-56 w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedListing.tenant_verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                      Verified host
                    </span>
                  )}
                  <VerifiedBadge verified={selectedListing.tenant_verified || false} />
                  {isOwnListing(selectedListing) && role === "tenant" && <Badge className="bg-primary text-primary-foreground">This is your listing</Badge>}
                  {isManagedListing(selectedListing) && role === "manager" && <Badge className="bg-accent text-accent-foreground">Managed by you</Badge>}
                  {(selectedListing.avg_rating ?? 0) > 0 && (
                    <div className="ml-auto">
                      <StarRating rating={selectedListing.avg_rating || 0} size="md" showCount count={selectedListing.review_count} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Monthly Rent", value: `$${selectedListing.monthly_rent?.toLocaleString() ?? "-"}`, sub: selectedListing.monthly_rent ? `~$${Math.round(selectedListing.monthly_rent / 4).toLocaleString()}/week` : undefined, primary: true },
                    { label: "Bedrooms", value: selectedListing.bedrooms ?? "-" },
                    { label: "Bathrooms", value: selectedListing.bathrooms ?? "-" },
                    { label: "Sq. Ft.", value: selectedListing.sqft ?? "-" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-lg font-bold ${item.primary ? "text-primary" : "text-foreground"}`}>{item.value}</p>
                      {(item as any).sub && <p className="text-[11px] text-muted-foreground">{(item as any).sub}</p>}
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

                <div className="space-y-3 pt-2">
                  {!isOwnListing(selectedListing) && (
                    <SecureThisPlace listing={selectedListing} />
                  )}
                  {!isOwnListing(selectedListing) && (
                    <>
                      <KnockButton
                        listingId={selectedListing.id}
                        tenantId={selectedListing.tenant_id}
                        listingHeadline={selectedListing.headline}
                        listingAddress={selectedListing.address}
                        knockCount={(selectedListing as any).knock_count || 0}
                      />
                      <Button variant="outline" className="w-full" size="lg" onClick={() => handleContact(selectedListing)} disabled={contactingId === selectedListing.id}>
                        {contactingId === selectedListing.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Opening chat...</> : <><MessageSquare className="mr-1 h-4 w-4" />Send a Message</>}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => toggleSave(selectedListing.id)}>
                        <Heart className={`mr-1 h-4 w-4 ${savedListings.has(selectedListing.id) ? "fill-primary text-primary" : ""}`} />
                        {savedListings.has(selectedListing.id) ? "Saved" : "Save Listing"}
                      </Button>
                    </>
                  )}
                  {role === "tenant" && isOwnListing(selectedListing) && (
                    <Button className="w-full" size="lg" onClick={() => navigate(`/listings/edit/${selectedListing.id}`)}><Pencil className="mr-1 h-4 w-4" />Edit Listing</Button>
                  )}
                  {role === "manager" && (
                    <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/dashboard/manager/properties")}><Eye className="mr-1 h-4 w-4" />View Details</Button>
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
