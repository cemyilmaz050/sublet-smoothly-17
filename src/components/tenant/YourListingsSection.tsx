import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus, Eye, Heart, Users, Pencil, Pause, Zap, Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ListingData {
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

interface Props {
  listings: ListingData[];
  loading: boolean;
  onOpenOnboarding: () => void;
}

const statusColor: Record<string, string> = {
  active: "bg-emerald text-emerald-foreground",
  pending: "bg-amber text-amber-foreground",
  draft: "bg-muted text-muted-foreground",
  expired: "bg-destructive text-destructive-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const YourListingsSection = ({ listings, loading, onOpenOnboarding }: Props) => {
  const navigate = useNavigate();
  const [applicantDrawer, setApplicantDrawer] = useState<string | null>(null);

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "Dates not set";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f} – ${u}`;
  };

  if (loading) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Your Listings</h2>
        <Button size="sm" onClick={onOpenOnboarding}>
          <Plus className="mr-1 h-4 w-4" />
          New Listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">You haven't listed any properties yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first listing to start finding a subtenant
          </p>
          <Button className="mt-6" onClick={onOpenOnboarding}>
            Sublet Your Apartment
          </Button>
        </motion.div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group w-[320px] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-elevated"
                onClick={() => navigate(`/listings?id=${listing.id}`)}
              >
                {/* Photo */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {listing.photos && listing.photos[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-sm">No photo</div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status badge */}
                  <div className="absolute right-2 top-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[listing.status] || "bg-muted text-muted-foreground"}`}>
                      {listing.status}
                    </span>
                  </div>

                  {/* Rent */}
                  <div className="absolute bottom-3 left-3">
                    <p className="text-2xl font-bold text-white drop-shadow-md">
                      ${listing.monthly_rent?.toLocaleString() ?? "—"}
                      <span className="text-sm font-normal opacity-80">/mo</span>
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {listing.headline || "Untitled"}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{listing.address || "No address"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDates(listing.available_from, listing.available_until)}
                  </p>

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {listing.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" /> {listing.save_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> 0
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => navigate(`/listings/edit/${listing.id}`)}
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Pause className="mr-1 h-3 w-3" /> Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => setApplicantDrawer(listing.id)}
                    >
                      <Users className="mr-1 h-3 w-3" /> Applicants
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Applicant Drawer */}
      <Sheet open={!!applicantDrawer} onOpenChange={(open) => !open && setApplicantDrawer(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Applicants</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No applicants yet for this listing</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Applicants will appear here once subtenants apply
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default YourListingsSection;
