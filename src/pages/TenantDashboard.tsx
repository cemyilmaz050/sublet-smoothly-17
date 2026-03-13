import { useEffect, useState, useCallback } from "react";
import { Home, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

import DashboardMessages from "@/components/tenant/DashboardMessages";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import ProfileCompleteness from "@/components/ProfileCompleteness";
import TenantIdVerification from "@/components/TenantIdVerification";

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
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [idVerified, setIdVerified] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, headline, address, monthly_rent, photos, status, available_from, available_until, view_count, save_count")
      .eq("tenant_id", user.id)
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

          // Fetch other user's profile
          const { data: profile } = await supabase
            .from("profiles_public" as any)
            .select("first_name, last_name")
            .eq("id", otherId)
            .maybeSingle() as { data: { first_name: string | null; last_name: string | null } | null };

          const otherFirstName = profile?.first_name || "User";
          const otherLastName = profile?.last_name || "";
          const otherName = otherLastName ? `${otherFirstName} ${otherLastName}` : otherFirstName;

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, read, sender_id, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1) as any;

          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("read", false)
            .neq("sender_id", user.id) as any;

          let listingHeadline = "";
          let listingAddress = "";
          if (c.listing_id) {
            const { data: l } = await supabase.from("listings").select("headline, address").eq("id", c.listing_id).maybeSingle() as any;
            listingHeadline = l?.headline || "";
            listingAddress = l?.address || "";
          }

          return {
            ...c,
            other_id: otherId,
            other_name: otherName,
            other_initial: otherFirstName.charAt(0).toUpperCase(),
            last_message: lastMsg?.[0]?.content || "",
            last_message_time: lastMsg?.[0]?.created_at || c.last_message_at,
            unread_count: count || 0,
            listing_headline: listingHeadline,
            listing_address: listingAddress,
          };
        })
      );
      setConversations(enriched);
      setUnreadCount(enriched.reduce((sum: number, c: any) => sum + c.unread_count, 0));
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Main content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 space-y-8">
        {/* Profile Completeness */}
        <ProfileCompleteness />

        {/* ID Verification */}
        <TenantIdVerification idVerified={idVerified} onVerified={() => setIdVerified(true)} />

        {/* SECTION 1: My Listing */}
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
              <p className="font-medium text-foreground">You haven't posted a listing yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                List your apartment and find the perfect subtenant
              </p>
              <Button className="mt-5" onClick={() => setShowSublet(true)}>
                Sublet Your Apartment
              </Button>
            </div>
          ) : (
            /* Listing cards */
            <div className="space-y-4">
              {listings.slice(0, 1).map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm sm:flex-row"
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
                        <Badge
                          variant="outline"
                          className={`shrink-0 capitalize text-xs ${statusStyle[listing.status] || ""}`}
                        >
                          {listing.status}
                        </Badge>
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

        {/* SECTION 2: Messages */}
        <section>
          <DashboardMessages conversations={conversations} unreadCount={unreadCount} />
        </section>
      </main>

      <SubletFlowOverlay open={showSublet} onClose={() => setShowSublet(false)} />
    </div>
  );
};

export default TenantDashboard;
