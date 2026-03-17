import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Search, User, Calendar, CheckCircle2, XCircle,
  MessageSquare, ShieldCheck, AlertTriangle, Clock, Eye,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApplicationWithDetails {
  id: string;
  applicant_id: string;
  listing_id: string;
  message: string | null;
  status: string | null;
  created_at: string | null;
  applicant_name: string;
  applicant_first_name: string | null;
  applicant_last_name: string | null;
  listing_headline: string | null;
  listing_address: string | null;
  listing_monthly_rent: number | null;
  listing_photos: string[] | null;
}

const ManagerApplicationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bgCheckVerified, setBgCheckVerified] = useState(false);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["manager-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get listings managed by this user
      const { data: listings } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos")
        .eq("manager_id", user!.id);

      if (!listings || listings.length === 0) return [];

      const listingIds = listings.map((l) => l.id);
      const listingMap = Object.fromEntries(listings.map((l) => [l.id, l]));

      // Get applications for those listings
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });

      if (!apps || apps.length === 0) return [];

      // Get applicant profiles
      const applicantIds = [...new Set(apps.map((a) => a.applicant_id))];
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name")
        .in("id", applicantIds) as { data: { id: string; first_name: string | null; last_name: string | null }[] | null };

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.id, p])
      );

      return apps.map((app) => {
        const profile = profileMap[app.applicant_id];
        const listing = listingMap[app.listing_id];
        return {
          ...app,
          applicant_first_name: profile?.first_name ?? null,
          applicant_last_name: profile?.last_name ?? null,
          applicant_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unknown Applicant",
          listing_headline: listing?.headline ?? null,
          listing_address: listing?.address ?? null,
          listing_monthly_rent: listing?.monthly_rent ?? null,
          listing_photos: listing?.photos ?? null,
        } as ApplicationWithDetails;
      });
    },
  });

  // Real-time subscription for notifications
  useQuery({
    queryKey: ["manager-app-realtime", user?.id],
    enabled: !!user,
    queryFn: () => {
      const channel = supabase
        .channel("manager-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user!.id}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ["manager-applications"] });
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },
    staleTime: Infinity,
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-applications"] });
    },
  });

  const handleDecision = async (app: ApplicationWithDetails, decision: "approved" | "declined") => {
    await updateAppMutation.mutateAsync({ id: app.id, status: decision });

    // Notify the applicant
    await supabase.from("notifications").insert({
      user_id: app.applicant_id,
      title: decision === "approved" ? "Application Approved!" : "Application Update",
      message: decision === "approved"
        ? `Your application for ${app.listing_headline || app.listing_address || "a listing"} has been approved!`
        : `Your application for ${app.listing_headline || app.listing_address || "a listing"} was not approved at this time.`,
      type: decision === "approved" ? "approval" : "rejection",
      link: "/dashboard/subtenant",
    });

    toast.success(decision === "approved" ? "Applicant approved!" : "Applicant declined");
    setDetailOpen(false);
    setSelectedApp(null);
    setBgCheckVerified(false);
  };

  const filtered = applications.filter((app) => {
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.applicant_name.toLowerCase().includes(q) ||
        (app.listing_headline?.toLowerCase().includes(q) ?? false) ||
        (app.listing_address?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const statusVariant = (s: string | null) => {
    if (s === "approved") return "emerald";
    if (s === "declined") return "destructive";
    return "secondary";
  };

  const statusLabel = (s: string | null) => {
    if (s === "approved") return "Approved";
    if (s === "declined") return "Declined";
    return "Pending";
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link to="/dashboard/manager">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Applications</h1>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Review applicants for your managed listings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or listing..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Application Cards */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              {applications.length === 0
                ? "No applications yet. They'll appear here when renters apply to your listings."
                : "No applications match your filters."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((app) => (
              <Card key={app.id} className="shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent">
                      <User className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground truncate">{app.applicant_name}</p>
                        <Badge variant={statusVariant(app.status) as any} className="shrink-0 text-xs">
                          {statusLabel(app.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {app.listing_headline || app.listing_address || "Listing"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {app.created_at ? format(new Date(app.created_at), "MMM d, yyyy") : "-"}
                      </div>
                      {app.message && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">"{app.message}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedApp(app); setDetailOpen(true); setBgCheckVerified(false); }}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Review
                    </Button>
                    {app.status === "pending" && (
                      <>
                        <Button variant="emerald" size="sm" onClick={() => handleDecision(app, "approved")}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDecision(app, "declined")}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(o) => { if (!o) { setDetailOpen(false); setSelectedApp(null); } }}>
        <DialogContent className="sm:max-w-lg">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {selectedApp.applicant_name}
                </DialogTitle>
                <DialogDescription>
                  Applied for {selectedApp.listing_headline || selectedApp.listing_address || "a listing"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Listing info */}
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground">{selectedApp.listing_headline || "Listing"}</p>
                  <p className="text-xs text-muted-foreground">{selectedApp.listing_address}</p>
                  {selectedApp.listing_monthly_rent && (
                    <p className="text-sm font-semibold text-primary">${selectedApp.listing_monthly_rent.toLocaleString()}/mo</p>
                  )}
                </div>

                {/* Application date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Applied {selectedApp.created_at ? format(new Date(selectedApp.created_at), "MMMM d, yyyy 'at' h:mm a") : "-"}
                </div>

                {/* Message */}
                {selectedApp.message && (
                  <div className="rounded-lg bg-accent/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" /> Applicant's Message
                    </div>
                    <p className="text-sm text-foreground">{selectedApp.message}</p>
                  </div>
                )}

                {/* Background Check Banner */}
                <div className="rounded-lg border-2 border-dashed border-amber/50 bg-accent/30 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Background Check</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Run a background check on this applicant before approving.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" disabled className="text-xs">
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Run Check (Coming Soon)
                        </Button>
                        <Button
                          variant={bgCheckVerified ? "emerald" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setBgCheckVerified(!bgCheckVerified)}
                        >
                          {bgCheckVerified ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Verified</> : "Mark as Manually Verified"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusVariant(selectedApp.status) as any}>
                    {statusLabel(selectedApp.status)}
                  </Badge>
                </div>

                {/* Action buttons */}
                {selectedApp.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" variant="emerald" onClick={() => handleDecision(selectedApp, "approved")}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={() => handleDecision(selectedApp, "declined")}>
                      <XCircle className="mr-1 h-4 w-4" /> Decline
                    </Button>
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

export default ManagerApplicationsPage;
