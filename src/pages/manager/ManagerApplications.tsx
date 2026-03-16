import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, User, Calendar, CheckCircle2, XCircle,
  MessageSquare, ShieldCheck, Eye, Clock, Fingerprint, Home, Briefcase, StickyNote,
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
  applicant_email?: string;
  listing_headline: string | null;
  listing_address: string | null;
  listing_monthly_rent: number | null;
  renter_verified?: boolean;
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterListing, setFilterListing] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Background check panel state
  const [bgCheckOpen, setBgCheckOpen] = useState(false);
  const [bgCheckApp, setBgCheckApp] = useState<AppWithDetails | null>(null);
  const [bgIdentity, setBgIdentity] = useState(false);
  const [bgRental, setBgRental] = useState(false);
  const [bgEmployment, setBgEmployment] = useState(false);
  const [bgNotes, setBgNotes] = useState("");
  const [bgSaving, setBgSaving] = useState(false);

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
      const { data: profiles } = await supabase.from("profiles_public" as any).select("id, first_name, last_name").in("id", applicantIds) as { data: { id: string; first_name: string | null; last_name: string | null }[] | null };
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      // Fetch renter verification status
      const { data: renterApps } = await supabase.from("renter_applications" as any).select("renter_id").in("renter_id", applicantIds) as any;
      const renterAppSet = new Set((renterApps || []).map((r: any) => r.renter_id));

      return apps.map(app => {
        const p = profileMap[app.applicant_id];
        const l = listingMap[app.listing_id];
        return {
          ...app,
          applicant_name: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Unknown",
          listing_headline: l?.headline ?? null,
          listing_address: l?.address ?? null,
          listing_monthly_rent: l?.monthly_rent ?? null,
          renter_verified: renterAppSet.has(app.applicant_id),
        } as AppWithDetails;
      });
    },
  });

  // Fetch existing background checks
  const { data: bgChecks = {} } = useQuery({
    queryKey: ["mgr-bg-checks-map", user?.id],
    enabled: !!user && applications.length > 0,
    queryFn: async () => {
      const appIds = applications.map(a => a.id);
      const { data } = await supabase
        .from("background_checks")
        .select("*")
        .in("application_id", appIds);
      return Object.fromEntries((data || []).map((bc: any) => [bc.application_id, bc]));
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
    // Block approving unverified renters
    if (decision === "approved" && !app.renter_verified) {
      toast.error("This renter has not completed all 3 verification steps yet — you can only confirm fully verified renters.");
      return;
    }
    await updateMut.mutateAsync({ id: app.id, status: decision });
    await supabase.from("notifications").insert({
      user_id: app.applicant_id,
      title: decision === "approved" ? "Application Approved! 🎉" : "Application Update",
      message: decision === "approved"
        ? `Your application for ${app.listing_headline || app.listing_address || "a listing"} has been approved by Boston Brokerage Group!`
        : `Your application for ${app.listing_headline || app.listing_address || "a listing"} was not approved at this time.`,
      type: decision === "approved" ? "approval" : "rejection",
      link: "/dashboard/subtenant",
    });
    toast.success(decision === "approved" ? "Applicant approved!" : "Applicant declined");
    setDetailOpen(false);
    setSelectedApp(null);
  };

  const openBgCheck = (app: AppWithDetails) => {
    const existing = (bgChecks as any)[app.id];
    setBgCheckApp(app);
    setBgIdentity(existing?.identity_verified ?? false);
    setBgRental(existing?.rental_history_verified ?? false);
    setBgEmployment(existing?.employment_verified ?? false);
    setBgNotes(existing?.notes ?? "");
    setBgCheckOpen(true);
  };

  const handleBgCheckSave = async (finalStatus: string) => {
    if (!bgCheckApp || !user) return;
    setBgSaving(true);
    try {
      const existing = (bgChecks as any)[bgCheckApp.id];
      const payload = {
        identity_verified: bgIdentity,
        rental_history_verified: bgRental,
        employment_verified: bgEmployment,
        notes: bgNotes,
        status: finalStatus,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("background_checks").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("background_checks").insert({
          ...payload,
          application_id: bgCheckApp.id,
          applicant_id: bgCheckApp.applicant_id,
          reviewer_id: user.id,
        });
      }

      // If verified, approve the application
      if (finalStatus === "verified") {
        await handleDecision(bgCheckApp, "approved");
      } else if (finalStatus === "declined") {
        await handleDecision(bgCheckApp, "declined");
      }

      queryClient.invalidateQueries({ queryKey: ["mgr-bg-checks-map"] });
      toast.success(
        finalStatus === "verified" ? "Applicant verified and approved!" :
        finalStatus === "declined" ? "Applicant declined." :
        "Background check saved — needs more info."
      );
      setBgCheckOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setBgSaving(false);
    }
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

  const getBgStatus = (appId: string) => {
    const bc = (bgChecks as any)[appId];
    if (!bc) return null;
    return bc.status;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          {pendingCount > 0 && <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Review applicants for Boston Brokerage Group properties</p>
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
          {filtered.map(app => {
            const bgStatus = getBgStatus(app.id);
            return (
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
                      {/* Renter verification badge */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.renter_verified ? (
                          <Badge variant="emerald" className="text-[10px] gap-0.5">
                            <ShieldCheck className="h-3 w-3" /> Fully Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-0.5 border-amber/30 text-amber">
                            ⏳ Verification In Progress
                          </Badge>
                        )}
                        {bgStatus && (
                          <Badge variant={bgStatus === "verified" ? "emerald" : bgStatus === "declined" ? "destructive" : "secondary"} className="text-[10px] gap-0.5">
                            <ShieldCheck className="h-3 w-3" />
                            {bgStatus === "verified" ? "BG Verified" : bgStatus === "declined" ? "BG Declined" : "Needs Info"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Review
                    </Button>
                    {app.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => openBgCheck(app)}>
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Run Background Check
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDecision(app, "declined")}><XCircle className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusVariant(selectedApp.status) as any}>{statusLabel(selectedApp.status)}</Badge>
                </div>
                {selectedApp.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={() => { setDetailOpen(false); openBgCheck(selectedApp); }}>
                      <ShieldCheck className="mr-1 h-4 w-4" /> Run Background Check
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={() => handleDecision(selectedApp, "declined")}><XCircle className="mr-1 h-4 w-4" />Decline</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Background Check Panel */}
      <Dialog open={bgCheckOpen} onOpenChange={(o) => { if (!o) setBgCheckOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          {bgCheckApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Background Check — {bgCheckApp.applicant_name}
                </DialogTitle>
                <DialogDescription>
                  Reviewing for {bgCheckApp.listing_headline || bgCheckApp.listing_address || "a listing"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-3">
                {/* Checklist */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox checked={bgIdentity} onCheckedChange={(v) => setBgIdentity(!!v)} />
                    <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Identity Verification</p>
                      <p className="text-xs text-muted-foreground">Government-issued ID verified</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox checked={bgRental} onCheckedChange={(v) => setBgRental(!!v)} />
                    <Home className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Rental History</p>
                      <p className="text-xs text-muted-foreground">Previous landlord references checked</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox checked={bgEmployment} onCheckedChange={(v) => setBgEmployment(!!v)} />
                    <Briefcase className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Employment Status</p>
                      <p className="text-xs text-muted-foreground">Current employment or income verified</p>
                    </div>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <StickyNote className="h-3.5 w-3.5" /> Notes
                  </label>
                  <Textarea
                    placeholder="Add any notes about this applicant..."
                    value={bgNotes}
                    onChange={(e) => setBgNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="emerald"
                    className="w-full"
                    disabled={bgSaving}
                    onClick={() => handleBgCheckSave("verified")}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Verified & Approved
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={bgSaving}
                      onClick={() => handleBgCheckSave("needs_info")}
                    >
                      <Clock className="mr-1.5 h-4 w-4" /> Needs More Info
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={bgSaving}
                      onClick={() => handleBgCheckSave("declined")}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" /> Declined
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerApplications;
