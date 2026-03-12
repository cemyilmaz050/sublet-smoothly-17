import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Eye, Heart, Users, MessageSquare, Home, ArrowRight, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Listing {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  status: string;
  available_from: string | null;
  available_until: string | null;
  view_count: number;
  save_count: number;
}

const statusColor: Record<string, string> = {
  active: "bg-emerald/15 text-emerald border-emerald/30",
  pending: "bg-amber/15 text-amber border-amber/30",
  draft: "bg-muted text-muted-foreground border-border",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const TenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [subletOpen, setSubletOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, status, available_from, available_until, view_count, save_count")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) || []);
      setLoading(false);
    };
    fetchListings();
  }, [user]);

  const draftListing = listings.find((l) => l.status === "draft");

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f} – ${u}`;
  };

  // Empty state
  if (!loading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-accent">
            <Home className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">You haven't listed any properties yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">Start subletting your place in just a few steps</p>
          <Button size="lg" className="mt-6" onClick={() => setSubletOpen(true)}>
            Sublet Your Apartment
          </Button>
          <SubletFlowOverlay open={subletOpen} onClose={() => setSubletOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Draft Banner */}
        {draftListing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card className="border-primary/30 bg-accent/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">You have an unfinished draft</p>
                    <p className="text-sm text-muted-foreground">{draftListing.headline || draftListing.address || "Untitled listing"}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(`/listings/edit/${draftListing.id}`)}>
                  Continue Draft <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT: Your Listings (60%) */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Your Listings</h2>
            </div>

            <div className="space-y-4">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className="relative">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.headline || ""}
                          className="h-48 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-muted text-muted-foreground">No photo</div>
                      )}
                      <Badge className={`absolute right-3 top-3 border text-xs capitalize ${statusColor[listing.status] || statusColor.draft}`}>
                        {listing.status}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{listing.headline || listing.address || "Untitled"}</h3>
                      {listing.address && <p className="mt-1 text-sm text-muted-foreground">{listing.address}</p>}
                      {listing.monthly_rent && (
                        <p className="mt-1 text-lg font-bold text-primary">${listing.monthly_rent.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                      )}
                      {listing.available_from && (
                        <p className="mt-1 text-xs text-muted-foreground">{formatDates(listing.available_from, listing.available_until)}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{listing.view_count} views</span>
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{listing.save_count} saves</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />0 applicants</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/listings/edit/${listing.id}`)}>Edit</Button>
                        <Button size="sm" variant="outline">Pause</Button>
                        <Button size="sm" variant="outline">View Applicants</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Add another listing */}
              <button
                onClick={() => setSubletOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Add another listing</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Messages (40%) */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-foreground">Messages</h2>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No messages yet. They will appear here when subtenants reach out about your listings.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SubletFlowOverlay open={subletOpen} onClose={() => setSubletOpen(false)} />
    </div>
  );
};

export default TenantDashboard;
