import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  MapPin, Calendar, DollarSign, ShieldCheck, Heart, Building2,
  Search, SlidersHorizontal, Zap, Pencil, Eye, X, CalendarDays, Map,
  MessageSquare, Send, CheckCircle2, Loader2, CalendarIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import SecureThisPlace from "@/components/listing/SecureThisPlace";
import ReviewSection from "@/components/ReviewSection";
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

const mockListings: ListingItem[] = [
  {
    id: "mock-1", headline: "Sunny 2BR in Downtown", address: "Manhattan, NY", monthly_rent: 2400,
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop"],
    available_from: "2026-07-01", available_until: "2026-12-31", bedrooms: 2, bathrooms: 1, sqft: 850,
    description: "Bright corner apartment with skyline views, in-unit laundry, and modern finishes throughout.",
    source: "manual", tenant_id: "", manager_id: null, property_type: "apartment",
  },
  {
    id: "mock-2", headline: "Cozy Studio near Park", address: "Brooklyn, NY", monthly_rent: 1800,
    photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop"],
    available_from: "2026-08-01", available_until: "2026-11-30", bedrooms: 1, bathrooms: 1, sqft: 480,
    description: "Charming studio steps from Prospect Park. Hardwood floors, lots of natural light.",
    source: "manual", tenant_id: "", manager_id: null, property_type: "studio",
  },
  {
    id: "mock-3", headline: "Modern 1BR with Views", address: "Jersey City, NJ", monthly_rent: 2100,
    photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"],
    available_from: "2026-07-15", available_until: "2027-01-15", bedrooms: 1, bathrooms: 1, sqft: 650,
    description: "Floor-to-ceiling windows with stunning river views. Doorman building with gym.",
    source: "manual", tenant_id: "", manager_id: null, property_type: "apartment",
  },
  {
    id: "mock-4", headline: "Spacious 3BR Brownstone", address: "Harlem, NY", monthly_rent: 3200,
    photos: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop"],
    available_from: "2026-06-15", available_until: "2026-12-15", bedrooms: 3, bathrooms: 2, sqft: 1200,
    description: "Classic brownstone with exposed brick, chef's kitchen, and private backyard.",
    source: "manual", tenant_id: "", manager_id: null, property_type: "house",
  },
];


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
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id, property_type")
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

  const allListings = [...dbListings, ...mockListings];

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

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [appliedListings, setAppliedListings] = useState<Set<string>>(new Set());
  const [applicationMessage, setApplicationMessage] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Load existing applications
  useEffect(() => {
    if (!user) return;
    supabase.from("applications").select("listing_id").eq("applicant_id", user.id).then(({ data }) => {
      if (data) setAppliedListings(new Set(data.map((d) => d.listing_id)));
    });
  }, [user]);

  const handleApply = async (listing: ListingItem) => {
    if (!user) { requireAuth(() => handleApply(listing)); return; }
    if (appliedListings.has(listing.id)) { toast.info("You've already applied to this listing."); return; }
    setApplyingId(listing.id);
    const { error } = await supabase.from("applications").insert({
      applicant_id: user.id,
      listing_id: listing.id,
      message: applicationMessage || null,
      status: "pending",
    });
    setApplyingId(null);
    if (error) { toast.error("Failed to submit application. Please try again."); return; }
    setAppliedListings((prev) => new Set(prev).add(listing.id));
    setApplicationMessage("");
    setShowApplyForm(false);
    toast.success("Application submitted! The tenant will be notified.");

    // Also create a notification for the listing owner
    await supabase.from("notifications").insert({
      user_id: listing.tenant_id,
      title: "New Application",
      message: `Someone applied to your listing "${listing.headline || "Untitled"}"`,
      type: "application",
      link: "/tenant/applicants",
    });
  };

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
    <div className="flex min-h-screen flex-col bg-background">
      

      {/* Search & Filter Bar */}
      <div className="border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location or keyword..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}><X className="h-4 w-4 text-muted-foreground" /></button>
            )}
          </div>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[160px]">
              <DollarSign className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Price range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All prices</SelectItem>
              <SelectItem value="0-1500">Under $1,500</SelectItem>
              <SelectItem value="1500-2500">$1,500 – $2,500</SelectItem>
              <SelectItem value="2500+">$2,500+</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal text-xs h-9", !moveInDate && "text-muted-foreground")}>
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
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal text-xs h-9", !moveOutDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {moveOutDate ? format(moveOutDate, "MMM d") : "Move out"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker mode="single" selected={moveOutDate} onSelect={setMoveOutDate} disabled={(d) => d < (moveInDate || new Date())} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {(moveInDate || moveOutDate) && (
            <button onClick={() => { setMoveInDate(undefined); setMoveOutDate(undefined); }} className="text-xs text-primary hover:underline">
              Clear dates
            </button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          {/* Calendar/Map toggle */}
          <div className="hidden lg:flex items-center gap-1 rounded-lg border p-0.5">
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => { setViewMode("map"); setCalendarSelectedDate(null); }}
            >
              <Map className="mr-1 h-3.5 w-3.5" /> Map
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="mr-1 h-3.5 w-3.5" /> Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Listings Cards */}
        <div className="w-full overflow-y-auto lg:w-[45%]">
          <div className="p-4 lg:p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} listing{filtered.length !== 1 ? "s" : ""} found
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

            <div className="space-y-4">
              {filtered.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onMouseEnter={() => setHoveredId(listing.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedListing(listing)}
                  className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-elevated"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-auto sm:w-48 sm:min-h-[140px]">
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
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground group-hover:text-primary line-clamp-1">{listing.headline || "Untitled"}</h3>
                          {listing.monthly_rent && (
                            <p className="ml-2 whitespace-nowrap text-lg font-bold text-primary">
                              ${listing.monthly_rent.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                            </p>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{listing.address || "Unknown"}</p>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{formatDates(listing.available_from, listing.available_until)}</p>
                        {(listing.avg_rating ?? 0) > 0 && (
                          <div className="mt-1.5">
                            <StarRating rating={listing.avg_rating || 0} size="sm" showCount count={listing.review_count} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {role === "subtenant" && (
                          <Badge variant="outline" className="gap-1 text-xs"><Zap className="h-3 w-3 text-amber" />Fast Lane</Badge>
                        )}
                        <div className="ml-auto flex items-center gap-1.5">
                          {role !== "manager" && role !== "tenant" && (
                            <button onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent">
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
                <div className="py-16 text-center text-muted-foreground">No listings found matching your search.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map or Calendar */}
        <div className="relative hidden border-l lg:block lg:w-[55%]">
          {viewMode === "calendar" ? (
            <div className="sticky top-0 h-[calc(100vh-7.5rem)] overflow-hidden">
              <CalendarView
                listings={allListings}
                onDayClick={setCalendarSelectedDate}
                selectedDate={calendarSelectedDate}
              />
            </div>
          ) : (
            <div className="sticky top-0 h-[calc(100vh-7.5rem)] overflow-hidden">
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
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
                    { label: "Monthly Rent", value: `$${selectedListing.monthly_rent?.toLocaleString() ?? "—"}`, primary: true },
                    { label: "Bedrooms", value: selectedListing.bedrooms ?? "—" },
                    { label: "Bathrooms", value: selectedListing.bathrooms ?? "—" },
                    { label: "Sq. Ft.", value: selectedListing.sqft ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border p-3">
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
                    <h4 className="mb-1 text-sm font-semibold text-foreground">About this listing</h4>
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
                      {appliedListings.has(selectedListing.id) ? (
                        <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald/30 bg-emerald/10 py-3 text-sm font-medium text-emerald">
                          <CheckCircle2 className="h-4 w-4" /> Application Submitted
                        </div>
                      ) : showApplyForm ? (
                        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                          <h4 className="text-sm font-semibold text-foreground">Apply to this listing</h4>
                          <Textarea
                            placeholder="Introduce yourself — why are you interested in this apartment? (optional)"
                            value={applicationMessage}
                            onChange={(e) => setApplicationMessage(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => handleApply(selectedListing)} disabled={applyingId === selectedListing.id}>
                              {applyingId === selectedListing.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-1 h-4 w-4" />Submit Application</>}
                            </Button>
                            <Button variant="outline" onClick={() => { setShowApplyForm(false); setApplicationMessage(""); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full" size="lg" onClick={() => {
                          if (!user) { requireAuth(() => setShowApplyForm(true)); return; }
                          setShowApplyForm(true);
                        }}>
                          <Zap className="mr-1 h-4 w-4" /> Apply Now
                        </Button>
                      )}
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
