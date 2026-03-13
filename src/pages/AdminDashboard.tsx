import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Home, DollarSign, FileText, TrendingUp, BarChart3, Shield } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";


// Hardcoded founder user IDs — only these can access
const FOUNDER_IDS = [
  "370d6445-15bc-4802-8626-1507c38fbdd4", // BBG staff
];

interface DailyMetric {
  date: string;
  count: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalApplications: 0,
    pendingApplications: 0,
    verifiedUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [dailySignups, setDailySignups] = useState<DailyMetric[]>([]);
  const [dailyListings, setDailyListings] = useState<DailyMetric[]>([]);

  const isFounder = user && FOUNDER_IDS.includes(user.id);

  useEffect(() => {
    if (!user) return;
    if (!FOUNDER_IDS.includes(user.id)) {
      navigate("/");
      return;
    }
    fetchAllMetrics();
  }, [user]);

  const fetchAllMetrics = async () => {
    setLoading(true);

    // Parallel fetches
    const [
      { count: totalUsers },
      { count: totalListings },
      { count: activeListings },
      { count: totalBookings },
      { data: bookingsData },
      { count: totalApplications },
      { count: pendingApplications },
      { count: verifiedUsers },
      { data: recentUsersData },
      { data: recentBookingsData },
      { data: profilesForSignups },
      { data: listingsForDaily },
    ] = await Promise.all([
      supabase.from("profiles_public" as any).select("id", { count: "exact", head: true }) as any,
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("total_paid, platform_fee"),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("id_verified", true),
      supabase.from("profiles_public" as any).select("id, first_name, last_name, role, created_at").order("created_at", { ascending: false }).limit(10) as any,
      supabase.from("bookings").select("id, total_paid, platform_fee, status, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles_public" as any).select("created_at").gte("created_at", subDays(new Date(), 30).toISOString()).order("created_at", { ascending: true }) as any,
      supabase.from("listings").select("created_at").gte("created_at", subDays(new Date(), 30).toISOString()).order("created_at", { ascending: true }),
    ]);

    const totalRevenue = (bookingsData || []).reduce((sum: number, b: any) => sum + (b.platform_fee || 0), 0);

    setStats({
      totalUsers: totalUsers || 0,
      totalListings: totalListings || 0,
      activeListings: activeListings || 0,
      totalBookings: totalBookings || 0,
      totalRevenue,
      totalApplications: totalApplications || 0,
      pendingApplications: pendingApplications || 0,
      verifiedUsers: verifiedUsers || 0,
    });

    setRecentUsers(recentUsersData || []);
    setRecentBookings(recentBookingsData || []);

    // Aggregate daily signups
    setDailySignups(aggregateByDay(profilesForSignups || []));
    setDailyListings(aggregateByDay(listingsForDaily || []));

    setLoading(false);
  };

  const aggregateByDay = (items: { created_at: string }[]): DailyMetric[] => {
    const map = new Map<string, number>();
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM dd");
      map.set(d, 0);
    }
    items.forEach((item) => {
      const d = format(new Date(item.created_at), "MMM dd");
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  };

  if (!isFounder) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Active Listings", value: `${stats.activeListings}/${stats.totalListings}`, icon: Home, color: "text-emerald" },
    { label: "Platform Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-amber" },
    { label: "Bookings", value: stats.totalBookings, icon: TrendingUp, color: "text-cyan" },
    { label: "Applications", value: `${stats.pendingApplications} pending / ${stats.totalApplications} total`, icon: FileText, color: "text-coral" },
    { label: "Verified Users", value: stats.verifiedUsers, icon: Shield, color: "text-emerald" },
  ];

  const maxSignup = Math.max(...dailySignups.map((d) => d.count), 1);
  const maxListing = Math.max(...dailyListings.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-background">
      

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Founder Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform metrics & insights</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {statCards.map((s) => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Signups Chart */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                User Signups (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-[2px] h-32">
                {dailySignups.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary/80 hover:bg-primary transition-colors cursor-default group relative"
                    style={{ height: `${Math.max((d.count / maxSignup) * 100, 2)}%` }}
                    title={`${d.date}: ${d.count}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{dailySignups[0]?.date}</span>
                <span className="text-[10px] text-muted-foreground">{dailySignups[dailySignups.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>

          {/* Listings Chart */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-emerald" />
                New Listings (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-[2px] h-32">
                {dailyListings.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-emerald/80 hover:bg-emerald transition-colors cursor-default"
                    style={{ height: `${Math.max((d.count / maxListing) * 100, 2)}%` }}
                    title={`${d.date}: ${d.count}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{dailyListings[0]?.date}</span>
                <span className="text-[10px] text-muted-foreground">{dailyListings[dailyListings.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {u.first_name || ""} {u.last_name || ""}{" "}
                        {!u.first_name && !u.last_name && <span className="italic text-muted-foreground">No name</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet</p>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">${b.total_paid?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Fee: ${b.platform_fee?.toLocaleString()} · {format(new Date(b.created_at), "MMM d")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${
                          b.status === "confirmed" ? "bg-emerald/15 text-emerald" :
                          b.status === "pending" ? "bg-amber/15 text-amber" :
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
