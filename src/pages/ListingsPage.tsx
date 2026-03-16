import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  MessageSquare, Loader2, CalendarIcon,
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
  property_type?: string | null;
  tenant_verified?: boolean;
  avg_rating?: number;
  review_count?: number;
}

const ListingsPage = () => {
  const { user, role } = useAuth();
  const { requireAuth } = useAuthModal();
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
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id, property_type, knock_count, latitude, longitude")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Fetch tenant verification status
        const tenantIds = [...new Set(data.map((l: any) => l.tenant_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, id_verified")
          .in("id", tenantIds) as any;
        const verifiedMap: Record<string, boolean> = {};
        (profiles || []).forEach((p: any) => { verifiedMap[p.id] = p.id_verified; });

        // Fetch avg ratings per listing
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

  // Track views when detail drawer opens
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
    // Date range filter
    if (moveInDate || moveOutDate) {
      const from = l.available_from ? new Date(l.available_from) : null;
      const until = l.available_until ? new Date(l.available_until) : null;
      if (moveInDate && from && from > moveInDate) return false;
      if (moveInDate && until && until < moveInDate) return false;
      if (moveOutDate && until && until < moveOutDate) return false;
      if (moveOutDate && from && from > moveOutDate) return false;
    }
    // Calendar date filter
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

  // Load saved listings
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
    // Check if a conversation already exists
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

    // Create a new conversation
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

    // Send an intro message
    await supabase.from("messages").insert({
      conversation_id: convo.id,
      sender_id: user.id,
      content: `Hi! I'm interested in your listing "${listing.headline || "your apartment"}". Is it still available?`,
    });

    // Notify the tenant
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
    <div className="flex min-h-[100dvh] flex-col bg-background">
      
      {/* Hero choice cards for new visitors */}
      {!user && (
        <section className="border-b bg-gradient-to-br from-primary/5 via-background to-accent/20 px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            >
              What brings you to SubIn? ✨
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-muted-foreground text-lg"
            >
              Start your Boston summer journey
            </motion.p>
          </div>
          <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Link to="/signup?role=tenant" className="block">
                <div className="group rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-primary/40 hover:shadow-elevated cursor-pointer">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/10">
                    <span className="text-3xl">🗝️</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    I have a place to sublet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    List your apartment and find a verified subtenant in days
                  </p>
                </div>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Link to="/find" className="block">
                <div className="group rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center transition-all hover:border-primary hover:shadow-elevated cursor-pointer ring-2 ring-primary/10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    I need a place for the summer
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Answer 7 quick questions and let AI find your perfect match
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Search & Filter Bar — scrollable on mobile */}
      <div className="border-b bg-card/80 backdrop-blur-sm">
        {/* Row 1: Search + key filters */}
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

        {/* Row 2: Date filters — hidden on mobile unless toggled */}
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
          {/* Map/List/Calendar toggle — visible on all sizes */}
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

      {/* Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Listings Cards — hidden on mobile when map view is active */}
        <div className={cn(
          "w-full overflow-y-auto lg:w-[45%]",
          mobileView === "map" && "hidden lg:block"
        )}>
          <div className="p-3 sm:p-4 lg:p-6">
            <p className="mb-3 text-sm text-muted-foreground">
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
            <div className="space-y-3 sm:space-y-4">
              {filtered.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onMouseEnter={() => setHoveredId(listing.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedListing(listing)}
                  className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-elevated active:scale-[0.99]"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:w-48 sm:min-h-[140px]">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full min-h-[140px] items-center justify-center bg-muted text-muted-foreground">No photo</div>
                      )}
                      <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {listing.source === "appfolio" ? (
                          <Badge className="bg-emerald text-emerald-foreground text-xs shadow-sm"><Building2 className="mr-1 h-3 w-3" />AppFolio</Badge>
                        ) : (
                          <Badge variant="approved" className="text-xs shadow-sm"><ShieldCheck className="mr-1 h-3 w-3" />Approved</Badge>
                        )}
                        {listing.tenant_verified && (
                          <Badge className="bg-emerald text-emerald-foreground text-xs shadow-sm"><ShieldCheck className="mr-1 h-3 w-3" />Verified Tenant</Badge>
                        )}
                      </div>
                      {isOwnListing(listing) && role === "tenant" && (
                        <div className="absolute right-2 top-2"><Badge className="bg-primary text-primary-foreground text-xs">Your listing</Badge></div>
                      )}
                      {isManagedListing(listing) && role === "manager" && (
                        <div className="absolute right-2 top-2"><Badge className="bg-accent text-accent-foreground text-xs">Managed by you</Badge></div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground group-hover:text-primary line-clamp-1 text-[15px]">{listing.headline || "Untitled"}</h3>
                          {listing.monthly_rent && (
                            <div className="ml-2 text-right shrink-0">
                              <p className="whitespace-nowrap text-lg font-bold text-primary">
                                ${listing.monthly_rent.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground">~${Math.round(listing.monthly_rent / 4).toLocaleString()}/week</p>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{listing.address || "Unknown"}</p>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{formatDates(listing.available_from, listing.available_until)}</p>
                        {listing.monthly_rent && listing.monthly_rent < 2000 && (
                          <p className="mt-1 text-[11px] text-emerald font-medium">Cheaper than a Boston hotel 🎉</p>
                        )}
                        {(listing.avg_rating ?? 0) > 0 && (
                          <div className="mt-1.5">
                            <StarRating rating={listing.avg_rating || 0} size="sm" showCount count={listing.review_count} />
                          </div>
                        )}
                        <KnockActivity knockCount={(listing as any).knock_count || 0} />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
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
                          {role !== "manager" && role !== "tenant" && (
                            <button onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }} className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-colors hover:bg-accent active:bg-accent">
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
                  <p className="text-4xl mb-3">🏙️</p>
                  <p className="text-base font-semibold text-foreground">No places here yet</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">Boston is filling up fast though. Check back soon or broaden your search!</p>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Right: Map or Calendar — full width on mobile when map view active */}
        <div className={cn(
          "relative border-l lg:block lg:w-[55%]",
          mobileView === "map" ? "block w-full" : "hidden"
        )}>
          {viewMode === "calendar" ? (
            <div className="sticky top-0 h-[calc(100dvh-8rem)] overflow-hidden">
              <CalendarView
                listings={allListings}
                onDayClick={setCalendarSelectedDate}
                selectedDate={calendarSelectedDate}
              />
            </div>
          ) : (
            <div className="sticky top-0 h-[calc(100dvh-8rem)] overflow-hidden">
              <ListingsMap
                listings={filtered}
                hoveredId={hoveredId}
                selectedId={selectedListing?.id || null}
                onSelect={(l) => setSelectedListing(l as any)}
              />
            </div>
          )}
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
                  {selectedListing.source === "appfolio" ? (
                    <Badge className="bg-emerald text-emerald-foreground"><Building2 className="mr-1 h-3 w-3" />AppFolio Verified</Badge>
                  ) : (
                    <Badge variant="approved"><ShieldCheck className="mr-1 h-3 w-3" />Manager Approved</Badge>
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
                    { label: "Monthly Rent", value: `$${selectedListing.monthly_rent?.toLocaleString() ?? "—"}`, sub: selectedListing.monthly_rent ? `~$${Math.round(selectedListing.monthly_rent / 4).toLocaleString()}/week` : undefined, primary: true },
                    { label: "Bedrooms", value: selectedListing.bedrooms ?? "—" },
                    { label: "Bathrooms", value: selectedListing.bathrooms ?? "—" },
                    { label: "Sq. Ft.", value: selectedListing.sqft ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-lg font-bold ${item.primary ? "text-primary" : "text-foreground"}`}>{item.value}</p>
                      {(item as any).sub && <p className="text-[11px] text-muted-foreground">{(item as any).sub}</p>}
                    </div>
                  ))}
                </div>
                {selectedListing.monthly_rent && selectedListing.monthly_rent < 2000 && (
                  <p className="text-sm text-emerald font-medium text-center">Cheaper than a Boston hotel for the summer 🎉</p>
                )}
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
                {/* Reviews */}
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
