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
  MessageSquare, ShieldCheck, Eye, FileText,
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
  renter_verified?: boolean;
  doc_status?: string;
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
      const { data: profiles } = await supabase.from("profiles_public" as any).select("id, first_name, last_name").in("id", applicantIds) as any;
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

      // Fetch document completion status
      const { data: docPkgs } = await supabase.from("bbg_document_packages").select("applicant_id, overall_status").in("applicant_id", applicantIds);
      const docMap = Object.fromEntries((docPkgs || []).map((d: any) => [d.applicant_id, d.overall_status]));

      return apps.map(app => {
        const p = profileMap[app.applicant_id];
        const l = listingMap[app.listing_id];
        return {
          ...app,
          applicant_name: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Unknown",
          listing_headline: l?.headline ?? null,
          listing_address: l?.address ?? null,
          listing_monthly_rent: l?.monthly_rent ?? null,
          doc_status: docMap[app.applicant_id] || "not_sent",
        } as AppWithDetails;
      });
    },
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
      title: decision === "approved" ? "Application Approved!" : "Application Update",
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

  const filtered = applications.filter(app => {
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return app.applicant_name.toLowerCase().includes(q) || (app.listing_headline?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const statusVariant = (s: string | null) => s === "approved" ? "emerald" : s === "declined" ? "destructive" : "secondary";
  const statusLabel = (s: string | null) => s === "approved" ? "Approved" : s === "declined" ? "Declined" : "Pending";
  const docLabel = (s: string) => s === "fully_complete" ? "Complete" : s === "not_sent" ? "Not Started" : "Incomplete";
  const pendingCount = applications.filter(a => a.status === "pending").length;

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

      {/* List */}
      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
          {applications.length === 0 ? "No applications yet." : "No applications match your filters."}
        </CardContent></Card>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-0 divide-y">
            {filtered.map(app => (
              <div key={app.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{app.applicant_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{app.listing_headline || app.listing_address || "Listing"}</p>
                </div>
                <div className="hidden sm:block text-center">
                  <Badge variant={app.doc_status === "fully_complete" ? "emerald" : "secondary"} className="text-[10px]">
                    <FileText className="mr-1 h-3 w-3" /> {docLabel(app.doc_status || "not_sent")}
                  </Badge>
                </div>
                <Badge variant={statusVariant(app.status) as any} className="shrink-0 text-xs">{statusLabel(app.status)}</Badge>
                {app.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" className="bg-emerald hover:bg-emerald/90 text-white h-8 px-3" onClick={() => handleDecision(app, "approved")}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8 px-3" onClick={() => handleDecision(app, "declined")}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <Button variant="ghost" size="sm" className="h-8" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
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
                  Applied {selectedApp.created_at ? format(new Date(selectedApp.created_at), "MMMM d, yyyy 'at' h:mm a") : "-"}
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
                    <Button className="flex-1 bg-emerald hover:bg-emerald/90 text-white" onClick={() => handleDecision(selectedApp, "approved")}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
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
