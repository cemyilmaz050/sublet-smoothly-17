import { useEffect, useState, useCallback } from "react";
import { Home, ExternalLink, Pencil, MoreVertical, Pause, Play, Trash2, Loader2, MessageSquare, ArrowRight, Users, FileText, Plus, Eye, Video } from "lucide-react";
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

import KnocksSection from "@/components/tenant/KnocksSection";
import OffersSection from "@/components/urgent/OffersSection";

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
  const [applicantCount, setApplicantCount] = useState(0);
  const [docCount, setDocCount] = useState({ complete: 0, total: 0 });

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, headline, address, monthly_rent, photos, status, available_from, available_until, view_count, save_count")
      .eq("tenant_id", user.id)
      .neq("status", "deleted" as any)
      .order("created_at", { ascending: false });
    const myListings = (listingsData as Listing[]) || [];
    setListings(myListings);

    // Check ID verification
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id_verified")
      .eq("id", user.id)
      .single() as any;
    setIdVerified(profileData?.id_verified || false);

    // Fetch applicant count
    if (myListings.length > 0) {
      const listingIds = myListings.map(l => l.id);
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("listing_id", listingIds);
      setApplicantCount(count || 0);

      // Fetch document counts from bbg_document_packages
      const { data: docs } = await supabase
        .from("bbg_document_packages")
        .select("overall_status")
        .in("listing_id", listingIds);
      if (docs) {
        setDocCount({
          complete: docs.filter(d => d.overall_status === "fully_complete").length,
          total: docs.length,
        });
      }
    }

    // Fetch conversations
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false }) as any;

    if (convos && convos.length > 0) {
      let totalUnread = 0;
      for (const c of convos) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("read", false)
          .neq("sender_id", user.id) as any;
        totalUnread += count || 0;
      }
      setConversations(convos);
      setUnreadCount(totalUnread);
    } else {
      setConversations([]);
      setUnreadCount(0);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePauseToggle = async (listing: Listing) => {
    const newStatus = listing.status === "paused" ? "active" : "paused";
    const { error } = await supabase.from("listings").update({ status: newStatus as any }).eq("id", listing.id);
    if (error) toast.error("Failed to update listing status.");
    else { toast.success(newStatus === "paused" ? "Listing paused." : "Listing is live again!"); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data: activeBookings } = await supabase.from("bookings").select("id, status").eq("listing_id", deleteTarget.id).in("status", ["confirmed"]);
      if (activeBookings && activeBookings.length > 0) {
        toast.error("You have an active booking. Please resolve the booking before deleting.");
        setDeleting(false); setDeleteTarget(null); return;
      }
      const { error } = await supabase.functions.invoke("delete-listing", { body: { listingId: deleteTarget.id } });
      if (error) throw error;
      toast.success("Listing deleted successfully."); fetchData();
    } catch (err: any) { toast.error(err.message || "Failed to delete listing."); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const activeListing = listings.find(l => l.status === "active");
  const listingStatus = activeListing ? "Active" : listings.length > 0 ? listings[0].status : "None";

  return (
    <div className="min-h-screen bg-secondary/30">
      <main className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your sublet listing and applications</p>
          </div>
          <Button onClick={() => setShowPreScreen(true)} className="rounded-full px-6">
            <Plus className="mr-1.5 h-4 w-4" />
            New Listing
          </Button>
        </div>

        {/* Profile Completeness */}
        <ProfileCompleteness />
        

        {/* Video prompt for tenants without intro video */}
        {listings.length > 0 && !listings.some(l => (l as any).intro_video_url) && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Add a 30-second introduction video</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get noticed faster — sub-lessees are 3x more likely to reach out when they can see your face</p>
              <Button size="sm" className="mt-3 rounded-full" onClick={() => listings[0] && navigate(`/listings/edit/${listings[0].id}`)}>
                Add Video
              </Button>
            </div>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Home, label: "Listing Status", value: listingStatus, color: "text-primary" },
            { icon: Users, label: "Applicants", value: String(applicantCount), color: "text-primary" },
            { icon: FileText, label: "Documents", value: docCount.total > 0 ? `${docCount.complete}/${docCount.total}` : "0", color: "text-primary" },
            { icon: MessageSquare, label: "Messages", value: String(conversations.length), color: "text-primary" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Knocks Section */}
        <KnocksSection />

        {/* Offers Section (for urgent listings) */}
        {listings.length > 0 && (
          <OffersSection
            listingIds={listings.map(l => l.id)}
            minimumPrices={listings.reduce((acc, l) => ({ ...acc, [l.id]: (l as any).minimum_price || 0 }), {} as Record<string, number>)}
          />
        )}

        {/* Your Listing */}
        <section className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-foreground">Your Listing</h2>
            {activeListing && (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate(`/listings/edit/${activeListing.id}`)}>
                Edit
              </Button>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Home className="h-7 w-7 text-primary" />
                </div>
                <p className="font-medium text-foreground">No listing yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Create your first listing to start receiving applicants</p>
                <Button className="mt-5 rounded-full" onClick={() => setShowPreScreen(true)}>
                  Sublet Your Apartment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-4">
                    <div className="h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-muted">
                      {listing.photos && listing.photos[0] ? (
                        <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Home className="h-6 w-6 text-muted-foreground/40" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{listing.headline || "Untitled"}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {listing.address} · ${listing.monthly_rent?.toLocaleString()}/mo · {formatDates(listing.available_from, listing.available_until)}
                      </p>
                      <Badge variant="outline" className={`mt-1 capitalize text-xs ${statusStyle[listing.status] || ""}`}>
                        {listing.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePauseToggle(listing)}>
                          {listing.status === "paused" ? <><Play className="mr-2 h-4 w-4" /> Unpause</> : <><Pause className="mr-2 h-4 w-4" /> Pause</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(listing)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Applicants */}
        <section className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-foreground">Recent Applicants</h2>
            <Button variant="outline" size="sm" className="rounded-full">View All</Button>
          </div>
          <div className="divide-y">
            {applicantCount === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No applicants yet. Share your listing to start receiving interest.
              </div>
            ) : (
              <div className="px-6 py-4 text-sm text-muted-foreground">
                {applicantCount} applicant{applicantCount !== 1 ? "s" : ""} — view in your listing details
              </div>
            )}
          </div>
        </section>

        {/* Messages link */}
        <button
          onClick={() => navigate("/messages")}
          className="flex w-full items-center justify-between rounded-2xl border bg-card px-6 py-4 text-left shadow-card transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
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
      </main>

      {showPreScreen && (
        <FriendSubletPreScreen
          onFriend={() => { setShowPreScreen(false); setShowFriendFlow(true); }}
          onMarketplace={() => { setShowPreScreen(false); setShowSublet(true); }}
        />
      )}
      <FriendSubletFlow open={showFriendFlow} onClose={() => setShowFriendFlow(false)} />
      <SubletFlowOverlay open={showSublet} onClose={() => setShowSublet(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All applications and messages will be permanently removed.
              {deleteTarget && <span className="mt-2 block font-medium text-foreground">"{deleteTarget.headline || "Untitled"}"</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TenantDashboard;
