import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, AlertCircle, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "@/components/tenant/TenantSidebar";
import DashboardStats from "@/components/tenant/DashboardStats";
import YourListingsSection from "@/components/tenant/YourListingsSection";
import DashboardMessages from "@/components/tenant/DashboardMessages";
import RecentApplicants from "@/components/tenant/RecentApplicants";
import DashboardCalendarWidget from "@/components/tenant/DashboardCalendarWidget";
import OnboardingChecklist from "@/components/tenant/OnboardingChecklist";
import UserMenu from "@/components/UserMenu";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";

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

const TenantDashboard = () => {
  const { user, onboardingComplete, documentsStatus } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSublet, setShowSublet] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const firstName = user?.user_metadata?.first_name || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, headline, address, monthly_rent, photos, status, available_from, available_until, view_count, save_count")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false });
    setListings((listingsData as Listing[]) || []);

    // Fetch conversations
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false })
      .limit(5) as any;

    if (convos && convos.length > 0) {
      // Get last message for each
      const enriched = await Promise.all(
        convos.map(async (c: any) => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, read, sender_id")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1) as any;

          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("read", false)
            .neq("sender_id", user.id) as any;

          // Fetch listing address
          let listingAddress = "";
          if (c.listing_id) {
            const { data: l } = await supabase.from("listings").select("address").eq("id", c.listing_id).single() as any;
            listingAddress = l?.address || "";
          }

          return {
            ...c,
            other_name: `User ${otherId.slice(0, 6)}`,
            other_initial: "U",
            last_message: lastMsg?.[0]?.content || "",
            unread_count: count || 0,
            listing_address: listingAddress,
          };
        })
      );
      setConversations(enriched);
      setUnreadCount(enriched.reduce((sum: number, c: any) => sum + c.unread_count, 0));
    }

    // Fetch applications
    if (listingsData && listingsData.length > 0) {
      const listingIds = listingsData.map((l: any) => l.id);
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
        .limit(10) as any;

      if (apps) {
        const enrichedApps = apps.map((a: any) => {
          const listing = listingsData.find((l: any) => l.id === a.listing_id);
          return {
            id: a.id,
            name: `Applicant ${a.applicant_id.slice(0, 6)}`,
            initial: "A",
            verified: false,
            listing_headline: listing?.headline || "Listing",
            listing_address: listing?.address || "",
            message: a.message,
            status: a.status,
            created_at: a.created_at,
          };
        });
        setApplicants(enrichedApps);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("tenant-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => {
        fetchData();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "listings" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  // 60s polling fallback
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeListings = listings.filter((l) => l.status === "active").length;
  const isNewTenant = listings.length === 0 && conversations.length === 0 && applicants.length === 0;
  const draftListing = listings.find((l) => l.status === "draft");

  const docBanner = documentsStatus && documentsStatus !== "approved" && documentsStatus !== "not_started";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TenantSidebar />

        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-14 items-center justify-between border-b bg-card px-4">
            <SidebarTrigger className="lg:hidden" />
            <div />
            <UserMenu />
          </header>

          {/* Document status banner */}
          {docBanner && (
            <div className={`px-6 py-3 text-sm font-medium ${
              documentsStatus === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber/10 text-amber"
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {documentsStatus === "pending" && "Your documents are under review. You will be notified once approved."}
                {documentsStatus === "rejected" && (
                  <>Some documents need attention. <button className="underline font-semibold">View Details</button></>
                )}
                {documentsStatus === "more_info" && (
                  <>Your property manager has requested more information. <button className="underline font-semibold">Respond Now</button></>
                )}
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {/* Welcome header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{today}</p>
              </div>
              <Button onClick={() => setShowSublet(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Sublet Another Property
              </Button>
            </div>

            {isNewTenant && !loading ? (
              <OnboardingChecklist
                identityVerified={onboardingComplete === true}
                documentsSubmitted={documentsStatus === "pending" || documentsStatus === "approved"}
                hasListing={false}
                onSublet={() => setShowSublet(true)}
              />
            ) : (
              <div className="space-y-8">
                {/* Stats */}
                <DashboardStats
                  activeListings={activeListings}
                  totalApplicants={applicants.length}
                  unreadMessages={unreadCount}
                  earningsThisMonth={0}
                />

                {/* Draft banner */}
                {draftListing && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-primary/30 bg-accent/50 shadow-card">
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

                {/* Listings */}
                <YourListingsSection
                  listings={listings}
                  loading={loading}
                  onOpenOnboarding={() => setShowSublet(true)}
                />

                {/* Messages */}
                <DashboardMessages conversations={conversations} unreadCount={unreadCount} />

                {/* Recent Applicants */}
                <RecentApplicants applicants={applicants} />

                {/* Calendar */}
                <DashboardCalendarWidget listings={listings} />
              </div>
            )}
          </main>
        </div>
      </div>

      <SubletFlowOverlay open={showSublet} onClose={() => setShowSublet(false)} />
    </SidebarProvider>
  );
};

export default TenantDashboard;
