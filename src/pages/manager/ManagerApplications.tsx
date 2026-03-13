import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, User, Calendar, CheckCircle2, XCircle,
  MessageSquare, ShieldCheck, Eye, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

interface AppWithDetails {
  id: string;
  applicant_id: string;
  listing_id: string;
  message: string | null;
  status: string | null;
  created_at: string | null;
  applicant_name: string;
  listing_headline: string | null;
  listing_address: string | null;
  listing_monthly_rent: number | null;
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterListing, setFilterListing] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bgCheckVerified, setBgCheckVerified] = useState(false);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["mgr-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent")
        .eq("manager_id", user!.id);
      if (!listings?.length) return [];

      const listingMap = Object.fromEntries(listings.map(l => [l.id, l]));
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .in("listing_id", listings.map(l => l.id))
        .order("created_at", { ascending: false });
      if (!apps?.length) return [];

      const applicantIds = [...new Set(apps.map(a => a.applicant_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", applicantIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return apps.map(app => {
        const p = profileMap[app.applicant_id];
        const l = listingMap[app.listing_id];
        return {
          ...app,
          applicant_name: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Unknown",
          listing_headline: l?.headline ?? null,
          listing_address: l?.address ?? null,
          listing_monthly_rent: l?.monthly_rent ?? null,
        } as AppWithDetails;
      });
    },
  });

  // Realtime
  useQuery({
    queryKey: ["mgr-apps-rt", user?.id],
    enabled: !!user,
    queryFn: () => {
      const ch = supabase.channel("mgr-app-rt")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user!.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["mgr-apps"] });
        }).subscribe();
      return () => { supabase.removeChannel(ch); };
    },
    staleTime: Infinity,
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mgr-apps"] }),
  });

  const handleDecision = async (app: AppWithDetails, decision: "approved" | "declined") => {
    await updateMut.mutateAsync({ id: app.id, status: decision });
    await supabase.from("notifications").insert({
      user_id: app.applicant_id,
      title: decision === "approved" ? "Application Approved! 🎉" : "Application Update",
      message: decision === "approved"
        ? `Your application for ${app.listing_headline || app.listing_address || "a listing"} has been approved!`
        : `Your application for ${app.listing_headline || app.listing_address || "a listing"} was not approved at this time.`,
      type: decision === "approved" ? "approval" : "rejection",
      link: "/dashboard/subtenant",
    });
    toast.success(decision === "approved" ? "Applicant approved!" : "Applicant declined");
    setDetailOpen(false);
    setSelectedApp(null);
  };

  const uniqueListings = [...new Map(applications.map(a => [a.listing_id, { id: a.listing_id, label: a.listing_headline || a.listing_address || "Listing" }])).values()];

  const filtered = applications.filter(app => {
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (filterListing !== "all" && app.listing_id !== filterListing) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return app.applicant_name.toLowerCase().includes(q) || (app.listing_headline?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const statusVariant = (s: string | null) => s === "approved" ? "emerald" : s === "declined" ? "destructive" : "secondary";
  const statusLabel = (s: string | null) => s === "approved" ? "Approved" : s === "declined" ? "Declined" : "Pending";
  const pendingCount = applications.filter(a => a.status === "pending").length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          {pendingCount > 0 && <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Review applicants across all your listings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or listing..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterListing} onValueChange={setFilterListing}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Listings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            {uniqueListings.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
          {applications.length === 0 ? "No applications yet." : "No applications match your filters."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(app => (
            <Card key={app.id} className="shadow-card transition-all hover:shadow-elevated">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground truncate">{app.applicant_name}</p>
                      <Badge variant={statusVariant(app.status) as any} className="shrink-0 text-xs">{statusLabel(app.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{app.listing_headline || app.listing_address || "Listing"}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {app.created_at ? format(new Date(app.created_at), "MMM d, yyyy") : "—"}
                    </div>
                    {app.message && <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">"{app.message}"</p>}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedApp(app); setDetailOpen(true); setBgCheckVerified(false); }}>
                    <Eye className="mr-1 h-3.5 w-3.5" /> Review
                  </Button>
                  {app.status === "pending" && (
                    <>
                      <Button variant="emerald" size="sm" onClick={() => handleDecision(app, "approved")}><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDecision(app, "declined")}><XCircle className="h-3.5 w-3.5" /></Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(o) => { if (!o) { setDetailOpen(false); setSelectedApp(null); } }}>
        <DialogContent className="sm:max-w-lg">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />{selectedApp.applicant_name}</DialogTitle>
                <DialogDescription>Applied for {selectedApp.listing_headline || selectedApp.listing_address || "a listing"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground">{selectedApp.listing_headline || "Listing"}</p>
                  <p className="text-xs text-muted-foreground">{selectedApp.listing_address}</p>
                  {selectedApp.listing_monthly_rent && <p className="text-sm font-semibold text-primary">${selectedApp.listing_monthly_rent.toLocaleString()}/mo</p>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Applied {selectedApp.created_at ? format(new Date(selectedApp.created_at), "MMMM d, yyyy 'at' h:mm a") : "—"}
                </div>
                {selectedApp.message && (
                  <div className="rounded-lg bg-accent/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" /> Message</div>
                    <p className="text-sm text-foreground">{selectedApp.message}</p>
                  </div>
                )}
                <div className="rounded-lg border-2 border-dashed border-amber/50 bg-accent/30 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Background Check</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Run a background check before approving.</p>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" disabled className="text-xs"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Run Check (Coming Soon)</Button>
                        <Button variant={bgCheckVerified ? "emerald" : "outline"} size="sm" className="text-xs" onClick={() => setBgCheckVerified(!bgCheckVerified)}>
                          {bgCheckVerified ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Verified</> : "Mark Verified"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusVariant(selectedApp.status) as any}>{statusLabel(selectedApp.status)}</Badge>
                </div>
                {selectedApp.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" variant="emerald" onClick={() => handleDecision(selectedApp, "approved")}><CheckCircle2 className="mr-1 h-4 w-4" />Approve</Button>
                    <Button className="flex-1" variant="destructive" onClick={() => handleDecision(selectedApp, "declined")}><XCircle className="mr-1 h-4 w-4" />Decline</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerApplications;
