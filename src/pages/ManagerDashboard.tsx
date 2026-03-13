import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, Clock, CheckCircle2, AlertTriangle, MessageSquare,
  Settings, DollarSign, FileText, Users, ArrowRight, RefreshCw,
  ClipboardList
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ManagerDashboard = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["manager-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [requestsRes, listingsRes, integrationsRes] = await Promise.all([
        supabase.from("sublet_requests").select("id, status").eq("manager_id", user!.id),
        supabase.from("listings").select("id, status, source").eq("manager_id", user!.id),
        supabase.from("manager_integrations").select("*").eq("manager_id", user!.id).maybeSingle(),
      ]);
      const requests = requestsRes.data || [];
      const listings = listingsRes.data || [];

      // Get pending applications count
      const listingIds = listings.map(l => l.id);
      let pendingApplications = 0;
      if (listingIds.length > 0) {
        const { count } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("listing_id", listingIds)
          .eq("status", "pending");
        pendingApplications = count ?? 0;
      }

      return {
        pendingRequests: requests.filter(r => r.status === "pending").length,
        approvedSublets: requests.filter(r => r.status === "approved").length,
        totalProperties: listings.filter(l => l.status === "active").length,
        syncedProperties: listings.filter(l => l.source === "appfolio").length,
        pendingApplications,
        integration: integrationsRes.data,
      };
    },
  });

  const { data: recentRequests } = useQuery({
    queryKey: ["manager-recent-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("sublet_requests")
        .select("*")
        .eq("manager_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Mock activity feed data
  const activityFeed = [
    { message: "New sublet request from Sarah J. for Unit 4B", time: "2 hours ago", type: "request" },
    { message: "Payment received for 123 Main St — $2,400", time: "5 hours ago", type: "payment" },
    { message: "New applicant verified for Listing #12", time: "1 day ago", type: "applicant" },
    { message: "Document uploaded by Mike C. for Unit 7A", time: "1 day ago", type: "document" },
  ];

  const pendingActions = [
    { label: "Review sublet request — Apt 4B", link: "/dashboard/manager/requests", urgent: true },
    { label: "Co-approve applicant — Unit 2C", link: "/dashboard/manager/applicants", urgent: true },
    { label: "Review uploaded documents (3)", link: "/dashboard/manager/requests", urgent: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property Manager Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Overview of your properties and sublet activity</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/manager/integrations">
              <Button variant="outline" size="sm">
                <Settings className="mr-1 h-4 w-4" />
                Integrations
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Properties", value: stats?.totalProperties ?? 0, icon: Building2, color: "text-primary" },
            { label: "Pending Requests", value: stats?.pendingRequests ?? 0, icon: Clock, color: "text-amber", badge: (stats?.pendingRequests ?? 0) > 0 },
            { label: "Active Sublets", value: stats?.approvedSublets ?? 0, icon: CheckCircle2, color: "text-emerald" },
            { label: "Monthly Revenue", value: "$0", icon: DollarSign, color: "text-cyan" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    {stat.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {stat.value}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Link to="/dashboard/manager/requests">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityFeed.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                      {event.type === "request" && <FileText className="h-4 w-4 text-amber" />}
                      {event.type === "payment" && <DollarSign className="h-4 w-4 text-emerald" />}
                      {event.type === "applicant" && <Users className="h-4 w-4 text-primary" />}
                      {event.type === "document" && <ClipboardList className="h-4 w-4 text-cyan" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pending Actions */}
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingActions.map((action, i) => (
                  <Link key={i} to={action.link}>
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
                      {action.urgent && <AlertTriangle className="h-4 w-4 shrink-0 text-amber" />}
                      <span className="flex-1 text-sm font-medium text-foreground">{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* AppFolio Sync Status */}
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="h-5 w-5" />
                  AppFolio Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={stats?.integration?.status === "connected" ? "emerald" : "secondary"}>
                    {stats?.integration?.status === "connected" ? "Connected" : stats?.integration ? "Error" : "Not Connected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Properties Synced</span>
                  <span className="font-semibold text-foreground">{stats?.syncedProperties ?? 0}</span>
                </div>
                {stats?.integration?.last_synced_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="text-foreground">{new Date(stats.integration.last_synced_at).toLocaleDateString()}</span>
                  </div>
                )}
                <Link to="/dashboard/manager/integrations">
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <Settings className="mr-1 h-4 w-4" />
                    Manage Integration
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Applications", desc: "Review applicants", icon: Users, link: "/dashboard/manager/applications", count: stats?.pendingApplications },
            { label: "Sublet Requests", desc: "Review and manage requests", icon: FileText, link: "/dashboard/manager/requests", count: stats?.pendingRequests },
            { label: "Properties", desc: "View your property portfolio", icon: Building2, link: "/dashboard/manager/properties" },
            { label: "Active Sublets", desc: "Monitor running sublets", icon: CheckCircle2, link: "/dashboard/manager/sublets" },
            { label: "Messages", desc: "Communicate with tenants", icon: MessageSquare, link: "/messages" },
          ].map((nav) => (
            <Link key={nav.label} to={nav.link}>
              <Card className="h-full shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                    <nav.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{nav.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{nav.desc}</p>
                  {nav.count !== undefined && nav.count > 0 && (
                    <Badge variant="pending" className="mt-2">{nav.count} pending</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
