import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Heart, MessageSquare, Search, MapPin, Calendar, X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SavedListing {
  listing_id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  available_from: string | null;
  available_until: string | null;
}

const SubtenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    // Fetch saved listings with joined data
    supabase
      .from("saved_listings")
      .select("listing_id, listings(headline, address, monthly_rent, photos, available_from, available_until)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setSavedListings(
            data.map((d: any) => ({
              listing_id: d.listing_id,
              ...(d.listings || {}),
            }))
          );
        }
      });
  }, [user]);

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f} – ${u}`;
  };

  const removeSave = async (listingId: string) => {
    if (!user) return;
    setSavedListings((prev) => prev.filter((l) => l.listing_id !== listingId));
    await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listingId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT: Discover & Applications (60%) */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-xl font-bold text-foreground">Discover Properties</h2>

            {/* Search */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by neighborhood, address or zip code"
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

            <Button className="mb-6 w-full" onClick={() => navigate("/listings")}>
              Browse All Properties
            </Button>

            {/* Applications */}
            <h3 className="mb-3 text-lg font-semibold text-foreground">Your Applications</h3>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven't applied to any properties yet. Browse listings to find your perfect place.
                </p>
                <Button variant="link" onClick={() => navigate("/listings")} className="mt-2">
                  Browse Listings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Messages (40%) */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-foreground">Messages</h2>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No messages yet. Messages from landlords will appear here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Saved Properties */}
        {savedListings.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-foreground">Saved Properties</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {savedListings.map((listing) => (
                <motion.div
                  key={listing.listing_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-64 shrink-0"
                >
                  <Card className="overflow-hidden">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img src={listing.photos[0]} alt={listing.headline || ""} className="h-36 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-muted text-muted-foreground text-sm">No photo</div>
                    )}
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-1">{listing.headline || listing.address || "Untitled"}</h4>
                      {listing.address && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{listing.address}
                        </p>
                      )}
                      {listing.monthly_rent && (
                        <p className="mt-1 text-sm font-bold text-primary">${listing.monthly_rent.toLocaleString()}/mo</p>
                      )}
                      {listing.available_from && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />{formatDates(listing.available_from, listing.available_until)}
                        </p>
                      )}
                      <button
                        onClick={() => removeSave(listing.listing_id)}
                        className="mt-2 flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Heart className="h-3 w-3 fill-current" /> Remove
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              <Link to="/listings" className="flex w-48 shrink-0 items-center justify-center rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:text-primary hover:border-primary">
                Browse more properties
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtenantDashboard;
