import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Eye, Heart, Users, Pencil, Pause, Play, Trash2, MoreVertical, Home, Loader2, Clock, AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  onRefresh?: () => void;
}

const statusColor: Record<string, string> = {
  active: "bg-emerald text-emerald-foreground",
  pending: "bg-amber text-amber-foreground",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-amber/60 text-amber-foreground",
  expired: "bg-destructive text-destructive-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  pending: "Pending Review",
  draft: "Draft",
  paused: "Paused",
  expired: "Expired",
  rejected: "Changes Needed",
};

const YourListingsSection = ({ listings, loading, onOpenOnboarding, onRefresh }: Props) => {
  const navigate = useNavigate();
  const [applicantDrawer, setApplicantDrawer] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListingData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pausingId, setPausingId] = useState<string | null>(null);

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "Dates not set";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f} – ${u}`;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Check for active bookings first
      const { data: activeBookings } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("listing_id", deleteTarget.id)
        .in("status", ["confirmed"]);

      if (activeBookings && activeBookings.length > 0) {
        toast.error("You have an active booking for this listing. Please resolve the booking before deleting.");
        setDeleting(false);
        setDeleteTarget(null);
        return;
      }

      const { error } = await supabase.functions.invoke("delete-listing", {
        body: { listingId: deleteTarget.id },
      });
      if (error) throw error;
      toast.success("Listing deleted successfully.");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete listing.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handlePauseToggle = async (listing: ListingData) => {
    setPausingId(listing.id);
    const newStatus = listing.status === "paused" ? "active" : "paused";
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus as any })
      .eq("id", listing.id);

    if (error) {
      toast.error("Failed to update listing status.");
    } else {
      toast.success(newStatus === "paused" ? "Listing paused. It's hidden from the public." : "Listing is live again!");
      onRefresh?.();
    }
    setPausingId(null);
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
                className="group relative w-[320px] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-elevated"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status badge */}
                  <div className="absolute left-2 top-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[listing.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabel[listing.status] || listing.status}
                    </span>
                  </div>

                  {/* 3-dot menu */}
                  <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePauseToggle(listing)}
                          disabled={pausingId === listing.id}
                        >
                          {listing.status === "paused" ? (
                            <><Play className="mr-2 h-4 w-4" /> Unpause Listing</>
                          ) : (
                            <><Pause className="mr-2 h-4 w-4" /> Pause Listing</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(listing)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Listing
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      <Users className="h-3.5 w-3.5" /> {(listing as any).knock_count || 0} knocks
                    </span>
                  </div>

                  {/* Status banner for pending/rejected */}
                  {listing.status === "pending" && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber/10 px-2.5 py-1.5">
                      <Clock className="h-3 w-3 text-amber shrink-0" />
                      <p className="text-[11px] text-amber-foreground">Under review by Boston Brokerage Group — usually approved within 24 hours</p>
                    </div>
                  )}
                  {listing.status === "rejected" && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                        <p className="text-[11px] text-destructive">Changes needed — check your notifications for details</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/listings/edit/${listing.id}`); }}
                      >
                        <Pencil className="mr-1 h-3 w-3" /> Edit & Resubmit
                      </Button>
                    </div>
                  )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and all applications and messages related to this listing will be permanently removed.
              {deleteTarget && (
                <span className="mt-2 block font-medium text-foreground">
                  "{deleteTarget.headline || deleteTarget.address || "Untitled"}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                "Yes, Delete Listing"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default YourListingsSection;
