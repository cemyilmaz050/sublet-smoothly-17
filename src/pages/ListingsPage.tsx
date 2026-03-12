import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, DollarSign, ShieldCheck, Heart, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ListingItem {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  available_from: string | null;
  available_until: string | null;
  bedrooms: number | null;
  source: string;
}

const mockListings = [
  {
    id: "mock-1",
    headline: "Sunny 2BR in Downtown",
    address: "Manhattan, NY",
    monthly_rent: 2400,
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop"],
    available_from: "2026-07-01",
    available_until: "2026-12-31",
    bedrooms: 2,
    source: "manual",
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
    source: "manual",
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
    source: "manual",
  },
];

const ListingsPage = () => {
  const [location, setLocation] = useState("");
  const [dbListings, setDbListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, source")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setDbListings((data as ListingItem[]) || []);
      setLoading(false);
    };
    fetchListings();
  }, []);

  // Combine mock + real listings
  const allListings = [...dbListings, ...mockListings];
  const filtered = location
    ? allListings.filter((l) => l.address?.toLowerCase().includes(location.toLowerCase()))
    : allListings;

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "";
    const f = new Date(from);
    const fStr = f.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${fStr}`;
    const u = new Date(until);
    const uStr = u.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${fStr} - ${uStr}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Browse Listings</h1>
          <p className="mt-2 text-muted-foreground">All listings are manager-approved and ready for verified subtenants</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 flex flex-wrap gap-3 rounded-xl border bg-card p-4 shadow-card">
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger className="w-[160px]">
              <DollarSign className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Price range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1500">Under $1,500</SelectItem>
              <SelectItem value="1500-2500">$1,500 - $2,500</SelectItem>
              <SelectItem value="2500+">$2,500+</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summer">Summer 2026</SelectItem>
              <SelectItem value="fall">Fall 2026</SelectItem>
              <SelectItem value="winter">Winter 2026-27</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>

        {/* Listings Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={`/listing/${listing.id}`} className="group block">
                <div className="overflow-hidden rounded-xl border bg-card shadow-card transition-all hover:shadow-elevated">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.headline || ""}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">No photo</div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                      {listing.source === "appfolio" ? (
                        <Badge className="bg-emerald-600 text-white shadow-sm">
                          <Building2 className="mr-1 h-3 w-3" />
                          AppFolio Verified
                        </Badge>
                      ) : (
                        <Badge variant="approved" className="shadow-sm">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Manager Approved
                        </Badge>
                      )}
                    </div>
                    <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary">{listing.headline || "Untitled"}</h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {listing.address || "Unknown"}
                        </p>
                      </div>
                      {listing.monthly_rent && (
                        <p className="text-lg font-bold text-primary">${listing.monthly_rent}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDates(listing.available_from, listing.available_until)}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="py-16 text-center text-muted-foreground">
            No listings found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;
