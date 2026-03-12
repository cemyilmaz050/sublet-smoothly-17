import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  MapPin, Calendar, DollarSign, ShieldCheck, Heart, Building2,
  Search, SlidersHorizontal, Zap, Pencil, Eye, X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
}

const mockListings: ListingItem[] = [
  {
    id: "mock-1",
    headline: "Sunny 2BR in Downtown",
    address: "Manhattan, NY",
    monthly_rent: 2400,
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop"],
    available_from: "2026-07-01",
    available_until: "2026-12-31",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    description: "Bright corner apartment with skyline views, in-unit laundry, and modern finishes throughout.",
    source: "manual",
    tenant_id: "",
    manager_id: null,
  },
  {
    id: "mock-2",
    headline: "Cozy Studio near Park",
    address: "Brooklyn, NY",
    monthly_rent: 1800,
    photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop"],
    available_from: "2026-08-01",
    available_until: "2026-11-30",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 480,
    description: "Charming studio steps from Prospect Park. Hardwood floors, lots of natural light.",
    source: "manual",
    tenant_id: "",
    manager_id: null,
  },
  {
    id: "mock-3",
    headline: "Modern 1BR with Views",
    address: "Jersey City, NJ",
    monthly_rent: 2100,
    photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"],
    available_from: "2026-07-15",
    available_until: "2027-01-15",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    description: "Floor-to-ceiling windows with stunning river views. Doorman building with gym.",
    source: "manual",
    tenant_id: "",
    manager_id: null,
  },
  {
    id: "mock-4",
    headline: "Spacious 3BR Brownstone",
    address: "Harlem, NY",
    monthly_rent: 3200,
    photos: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop"],
    available_from: "2026-06-15",
    available_until: "2026-12-15",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1200,
    description: "Classic brownstone with exposed brick, chef's kitchen, and private backyard.",
    source: "manual",
    tenant_id: "",
    manager_id: null,
  },
];

// Pin positions for the placeholder map (percentage-based)
const pinPositions = [
  { x: 35, y: 30 },
  { x: 55, y: 50 },
  { x: 25, y: 65 },
  { x: 65, y: 25 },
  { x: 45, y: 72 },
  { x: 70, y: 55 },
];

const ListingsPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dbListings, setDbListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setDbListings((data as ListingItem[]) || []);
      setLoading(false);
    };
    fetchListings();
  }, []);

  const allListings = [...dbListings, ...mockListings];

  const filtered = allListings.filter((l) => {
    if (searchQuery && !l.address?.toLowerCase().includes(searchQuery.toLowerCase()) && !l.headline?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (priceFilter) {
      const rent = l.monthly_rent ?? 0;
      if (priceFilter === "0-1500" && rent > 1500) return false;
      if (priceFilter === "1500-2500" && (rent < 1500 || rent > 2500)) return false;
      if (priceFilter === "2500+" && rent < 2500) return false;
    }
    return true;
  });

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "";
    const f = new Date(from);
    const fStr = f.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${fStr}`;
    const u = new Date(until);
    const uStr = u.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${fStr} – ${uStr}`;
  };

  const isOwnListing = (listing: ListingItem) => user && listing.tenant_id === user.id;
  const isManagedListing = (listing: ListingItem) => user && listing.manager_id === user.id;

  const toggleSave = (id: string) => {
    if (!user) {
      toast.info("Please sign in to save listings.");
      navigate("/login");
      return;
    }
    setSavedListings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleApply = (listing: ListingItem) => {
    if (!user) {
      toast.info("Please sign in to apply for this property.");
      navigate("/login");
      return;
    }
    toast.success("Application started! (Coming soon)");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

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
              <button onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
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
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any dates</SelectItem>
              <SelectItem value="summer">Summer 2026</SelectItem>
              <SelectItem value="fall">Fall 2026</SelectItem>
              <SelectItem value="winter">Winter 2026–27</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Listings Cards */}
        <div className="w-full overflow-y-auto lg:w-[45%]">
          <div className="p-4 lg:p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} listing{filtered.length !== 1 ? "s" : ""} found
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
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-auto sm:w-48 sm:min-h-[140px]">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.headline || ""}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full min-h-[140px] items-center justify-center bg-muted text-muted-foreground">No photo</div>
                      )}
                      <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {listing.source === "appfolio" ? (
                          <Badge className="bg-emerald text-emerald-foreground text-xs shadow-sm">
                            <Building2 className="mr-1 h-3 w-3" />
                            AppFolio
                          </Badge>
                        ) : (
                          <Badge variant="approved" className="text-xs shadow-sm">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Approved
                          </Badge>
                        )}
                      </div>

                      {/* Role-specific badges on image */}
                      {isOwnListing(listing) && role === "tenant" && (
                        <div className="absolute right-2 top-2">
                          <Badge className="bg-primary text-primary-foreground text-xs">Your listing</Badge>
                        </div>
                      )}
                      {isManagedListing(listing) && role === "manager" && (
                        <div className="absolute right-2 top-2">
                          <Badge className="bg-accent text-accent-foreground text-xs">Managed by you</Badge>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground group-hover:text-primary line-clamp-1">
                            {listing.headline || "Untitled"}
                          </h3>
                          {listing.monthly_rent && (
                            <p className="ml-2 whitespace-nowrap text-lg font-bold text-primary">
                              ${listing.monthly_rent.toLocaleString()}
                              <span className="text-xs font-normal text-muted-foreground">/mo</span>
                            </p>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {listing.address || "Unknown"}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDates(listing.available_from, listing.available_until)}
                        </p>
                      </div>

                      {/* Role-specific actions row */}
                      <div className="mt-3 flex items-center gap-2">
                        {role === "subtenant" && (
                          <>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Zap className="h-3 w-3 text-amber" />
                              Fast Lane
                            </Badge>
                          </>
                        )}

                        <div className="ml-auto flex items-center gap-1.5">
                          {/* Save button for subtenants & unauthenticated */}
                          {role !== "manager" && role !== "tenant" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }}
                              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
                            >
                              <Heart
                                className={`h-4 w-4 ${savedListings.has(listing.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filtered.length === 0 && !loading && (
                <div className="py-16 text-center text-muted-foreground">
                  No listings found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map Placeholder */}
        <div className="relative hidden border-l lg:block lg:w-[55%]">
          <div className="sticky top-0 h-[calc(100vh-7.5rem)] overflow-hidden bg-muted/30">
            {/* Grid pattern for map feel */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }} />

            {/* "Streets" */}
            <div className="absolute left-[20%] top-0 h-full w-px bg-border/40" />
            <div className="absolute left-[50%] top-0 h-full w-px bg-border/40" />
            <div className="absolute left-[75%] top-0 h-full w-px bg-border/40" />
            <div className="absolute top-[30%] left-0 w-full h-px bg-border/40" />
            <div className="absolute top-[60%] left-0 w-full h-px bg-border/40" />

            {/* Map pins */}
            {filtered.slice(0, pinPositions.length).map((listing, i) => {
              const pos = pinPositions[i];
              const isHovered = hoveredId === listing.id;
              return (
                <motion.div
                  key={listing.id}
                  className="absolute z-10 cursor-pointer"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  animate={isHovered ? { scale: 1.3 } : { scale: 1 }}
                  onClick={() => setSelectedListing(listing)}
                >
                  <div
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-md transition-colors ${
                      isHovered
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-card text-foreground border"
                    }`}
                  >
                    ${listing.monthly_rent ? listing.monthly_rent.toLocaleString() : "???"}
                  </div>
                  {/* Pin stem */}
                  <div className={`mx-auto h-2 w-0.5 ${isHovered ? "bg-primary" : "bg-border"}`} />
                  <div className={`mx-auto h-1.5 w-1.5 rounded-full ${isHovered ? "bg-primary" : "bg-border"}`} />
                </motion.div>
              );
            })}

            {/* Map label */}
            <div className="absolute bottom-4 left-4 rounded-lg border bg-card/90 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
              <MapPin className="mr-1 inline h-3 w-3" />
              Interactive map coming soon
            </div>
          </div>
        </div>
      </div>

      {/* Listing Detail Drawer */}
      <Sheet open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selectedListing && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedListing.headline || "Untitled"}</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-5">
                {/* Photo */}
                {selectedListing.photos && selectedListing.photos[0] && (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={selectedListing.photos[0]}
                      alt={selectedListing.headline || ""}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedListing.source === "appfolio" ? (
                    <Badge className="bg-emerald text-emerald-foreground">
                      <Building2 className="mr-1 h-3 w-3" />
                      AppFolio Verified
                    </Badge>
                  ) : (
                    <Badge variant="approved">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Manager Approved
                    </Badge>
                  )}
                  {isOwnListing(selectedListing) && role === "tenant" && (
                    <Badge className="bg-primary text-primary-foreground">This is your listing</Badge>
                  )}
                  {isManagedListing(selectedListing) && role === "manager" && (
                    <Badge className="bg-accent text-accent-foreground">Managed by you</Badge>
                  )}
                </div>

                {/* Key info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                    <p className="text-lg font-bold text-primary">
                      ${selectedListing.monthly_rent?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                    <p className="text-lg font-bold text-foreground">{selectedListing.bedrooms ?? "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                    <p className="text-lg font-bold text-foreground">{selectedListing.bathrooms ?? "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Sq. Ft.</p>
                    <p className="text-lg font-bold text-foreground">{selectedListing.sqft ?? "—"}</p>
                  </div>
                </div>

                {/* Location & Dates */}
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {selectedListing.address || "Unknown location"}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDates(selectedListing.available_from, selectedListing.available_until)}
                  </p>
                </div>

                {/* Description */}
                {selectedListing.description && (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-foreground">About this listing</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedListing.description}</p>
                  </div>
                )}

                {/* Role-specific CTA */}
                <div className="space-y-2 pt-2">
                  {/* Subtenant: Apply + Save */}
                  {(role === "subtenant" || (!user && !role)) && (
                    <>
                      <Button className="w-full" size="lg" onClick={() => handleApply(selectedListing)}>
                        Apply Now
                        <Zap className="ml-1 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleSave(selectedListing.id)}
                      >
                        <Heart className={`mr-1 h-4 w-4 ${savedListings.has(selectedListing.id) ? "fill-primary text-primary" : ""}`} />
                        {savedListings.has(selectedListing.id) ? "Saved" : "Save Listing"}
                      </Button>
                    </>
                  )}

                  {/* Tenant: Edit own listing */}
                  {role === "tenant" && isOwnListing(selectedListing) && (
                    <Button className="w-full" size="lg" onClick={() => navigate(`/listings/edit/${selectedListing.id}`)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit Listing
                    </Button>
                  )}

                  {/* Manager: View details */}
                  {role === "manager" && (
                    <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/dashboard/manager/properties")}>
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
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
