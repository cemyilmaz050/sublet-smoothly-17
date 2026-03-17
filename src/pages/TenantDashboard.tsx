import { useEffect, useState, useCallback } from "react";
import { Home, ExternalLink, Pencil, MoreVertical, Pause, Play, Trash2, Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";


import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import FriendSubletPreScreen from "@/components/FriendSubletPreScreen";
import FriendSubletFlow from "@/components/FriendSubletFlow";
import ProfileCompleteness from "@/components/ProfileCompleteness";
import TenantIdVerification from "@/components/TenantIdVerification";
import KnocksSection from "@/components/tenant/KnocksSection";

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

const statusStyle: Record<string, string> = {
  active: "bg-emerald/15 text-emerald border-emerald/30",
  pending: "bg-amber/15 text-amber border-amber/30",
  draft: "bg-muted text-muted-foreground border-border",
  paused: "bg-amber/15 text-amber border-amber/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const formatDates = (from: string | null, until: string | null) => {
  if (!from) return "Dates not set";
  const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!until) return `From ${f}`;
  const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${f} – ${u}`;
};

const TenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSublet, setShowSublet] = useState(false);
  const [showPreScreen, setShowPreScreen] = useState(false);
  const [showFriendFlow, setShowFriendFlow] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [idVerified, setIdVerified] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, headline, address, monthly_rent, photos, status, available_from, available_until, view_count, save_count")
      .eq("tenant_id", user.id)
      .neq("status", "deleted" as any)
      .order("created_at", { ascending: false });
    setListings((listingsData as Listing[]) || []);

    // Check ID verification
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id_verified")
      .eq("id", user.id)
      .single() as any;
    setIdVerified(profileData?.id_verified || false);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false }) as any;

    if (convos && convos.length > 0) {
      const enriched = await Promise.all(
        convos.map(async (c: any) => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
          const { data: profile } = await supabase
            .from("profiles_public")
            .select("first_name, last_name, avatar_url")
            .eq("id", otherId)
            .single() as any;
          const { data: msgs } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, read")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1) as any;
          const lastMsg = msgs?.[0];
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("read", false)
            .neq("sender_id", user.id) as any;
          return {
            ...c,
            otherUser: profile || { first_name: "User", last_name: "" },
            lastMessage: lastMsg,
            unread: count || 0,
          };
        })
      );
      setConversations(enriched);
      setUnreadCount(enriched.reduce((sum: number, c: any) => sum + c.unread, 0));
    } else {
      setConversations([]);
      setUnreadCount(0);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tenant-dash-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "listings" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  // 60s polling fallback
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePauseToggle = async (listing: Listing) => {
    const newStatus = listing.status === "paused" ? "active" : "paused";
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus as any })
      .eq("id", listing.id);
    if (error) {
      toast.error("Failed to update listing status.");
    } else {
      toast.success(newStatus === "paused" ? "Listing paused." : "Listing is live again!");
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
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
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete listing.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* Main content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 space-y-8">
        {/* Profile Completeness */}
        <ProfileCompleteness />

        {/* ID Verification */}
        <TenantIdVerification idVerified={idVerified} onVerified={() => setIdVerified(true)} />

        {/* SECTION 1: Knocks */}
        <KnocksSection />

        {/* SECTION 2: My Listing */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">My Listing</h2>

          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          ) : listings.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Home className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium text-foreground">Your place could be earning money right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                List it in 3 minutes and find the perfect guest
              </p>
              <Button className="mt-5" onClick={() => setShowPreScreen(true)}>
                Sublet Your Apartment
              </Button>
            </div>
          ) : (
            /* Listing cards */
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm sm:flex-row"
                >
                  {/* Photo */}
                  <div className="relative aspect-square w-full shrink-0 sm:w-48">
                    {listing.photos && listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.headline || "Listing photo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-foreground line-clamp-1">
                          {listing.headline || "Untitled Listing"}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${statusStyle[listing.status] || ""}`}
                          >
                            {listing.status}
                          </Badge>
                          {/* 3-dot menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Listing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePauseToggle(listing)}>
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
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{listing.address || "No address"}</p>
                      <p className="mt-2 text-2xl font-bold text-primary">
                        ${listing.monthly_rent?.toLocaleString() ?? "—"}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDates(listing.available_from, listing.available_until)}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/listings/edit/${listing.id}`)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit Listing
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/listings?id=${listing.id}`)}
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        View Public Listing
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: Messages — links to full messages page */}
        <section>
          <button
            onClick={() => navigate("/messages")}
            className="flex w-full items-center justify-between rounded-xl border bg-card px-5 py-4 text-left transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Messages</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : `${conversations.length} conversations`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </section>
      </main>

      {showPreScreen && (
        <FriendSubletPreScreen
          onFriend={() => { setShowPreScreen(false); setShowFriendFlow(true); }}
          onMarketplace={() => { setShowPreScreen(false); setShowSublet(true); }}
        />
      )}
      <FriendSubletFlow open={showFriendFlow} onClose={() => setShowFriendFlow(false)} />
      <SubletFlowOverlay open={showSublet} onClose={() => setShowSublet(false)} />

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

export default TenantDashboard;
