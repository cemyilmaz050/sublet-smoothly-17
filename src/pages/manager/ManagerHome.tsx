import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Clock, CheckCircle2, ArrowRight, AlertTriangle, FileText, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import bbgLogo from "@/assets/bbg-logo.png";

const ManagerHome = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["manager-home-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [listingsRes, requestsRes] = await Promise.all([
        supabase.from("listings").select("id, status").eq("manager_id", user!.id),
        supabase.from("sublet_requests").select("id, status").eq("manager_id", user!.id),
      ]);
      const listings = listingsRes.data || [];
      const requests = requestsRes.data || [];

      let pendingApps = 0;
      let totalApps = 0;
      const listingIds = listings.map(l => l.id);
      if (listingIds.length > 0) {
        const [pendingRes, totalRes] = await Promise.all([
          supabase.from("applications").select("id", { count: "exact", head: true }).in("listing_id", listingIds).eq("status", "pending"),
          supabase.from("applications").select("id", { count: "exact", head: true }).in("listing_id", listingIds),
        ]);
        pendingApps = pendingRes.count ?? 0;
        totalApps = totalRes.count ?? 0;
      }

      return {
        pendingApprovals: listings.filter(l => l.status === "pending").length,
        activeListings: listings.filter(l => l.status === "active").length,
        totalApplications: totalApps,
        pendingApplications: pendingApps,
        completedSublets: requests.filter(r => r.status === "approved").length,
      };
    },
  });

  const { data: recentNotifications = [] } = useQuery({
    queryKey: ["manager-recent-notifs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const P = "/portal-mgmt-bbg";
  const tiles = [
    { label: "Pending Approvals", value: stats?.pendingApprovals ?? 0, icon: ClipboardCheck, color: "text-destructive", link: `${P}/approvals`, badge: true },
    { label: "Active Listings", value: stats?.activeListings ?? 0, icon: Building2, color: "text-primary", link: `${P}/listings` },
    { label: "Total Applications", value: stats?.totalApplications ?? 0, icon: Users, color: "text-cyan", link: `${P}/applications` },
    { label: "Pending Review", value: stats?.pendingApplications ?? 0, icon: Clock, color: "text-amber", link: `${P}/applications`, badge: true },
    { label: "Completed Sublets", value: stats?.completedSublets ?? 0, icon: CheckCircle2, color: "text-emerald", link: `${P}/checks` },
  ];

  const notifIcon = (type: string) => {
    if (type === "application") return <Users className="h-4 w-4 text-primary" />;
    if (type === "approval") return <CheckCircle2 className="h-4 w-4 text-emerald" />;
    if (type === "rejection") return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* BBG Welcome Banner */}
      <div className="flex items-center gap-4">
        <img src={bbgLogo} alt="Boston Brokerage Group" className="h-14 w-14 rounded-xl object-contain border bg-card p-1" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boston Brokerage Group</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Staff Dashboard — Property Management Portal</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.link}>
            <Card className="shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
                  <tile.icon className={`h-5 w-5 ${tile.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{tile.value}</p>
                    {tile.badge && (tile.value as number) > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {tile.value}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
          <Link to={`${P}/notifications`}>
            <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        <CardContent className="pt-0 space-y-1">
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No recent activity yet.</p>
          ) : (
            recentNotifications.map((n: any) => (
              <Link key={n.id} to={n.link || `${P}/notifications`}>
                <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerHome;
