import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ClipboardCheck, FileText, ArrowRight, MapPin, User, Calendar, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import bbgLogo from "@/assets/bbg-logo.png";
import { format } from "date-fns";
import { toast } from "sonner";

const P = "/portal-mgmt-bbg";

const ManagerHome = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["manager-home-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [listingsRes, docsRes] = await Promise.all([
        supabase.from("listings").select("id, status").eq("manager_id", user!.id),
        supabase.from("bbg_document_packages").select("id, overall_status"),
      ]);
      const listings = listingsRes.data || [];
      const docs = docsRes.data || [];

      return {
        pendingApprovals: listings.filter(l => l.status === "pending").length,
        activeListings: listings.filter(l => l.status === "active").length,
        documentsPending: docs.filter(d => d.overall_status !== "fully_complete" && d.overall_status !== "not_sent").length,
      };
    },
  });

  // Recent pending approvals (top 3)
  const { data: recentPending = [] } = useQuery({
    queryKey: ["manager-recent-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, address, tenant_id, created_at")
        .eq("manager_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!data?.length) return [];

      const tenantIds = [...new Set(data.map(l => l.tenant_id))];
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name")
        .in("id", tenantIds) as any;
      const pm = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

      return data.map(l => ({
        ...l,
        tenant_name: [pm[l.tenant_id]?.first_name, pm[l.tenant_id]?.last_name].filter(Boolean).join(" ") || "Unknown Tenant",
      }));
    },
  });

  // Recent incomplete documents (top 3)
  const { data: recentDocs = [] } = useQuery({
    queryKey: ["manager-recent-docs-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: pkgs } = await supabase
        .from("bbg_document_packages")
        .select("*")
        .neq("overall_status", "fully_complete")
        .neq("overall_status", "not_sent")
        .order("updated_at", { ascending: false })
        .limit(3);
      if (!pkgs?.length) return [];

      const enriched = await Promise.all(
        pkgs.map(async (pkg: any) => {
          const [profileRes, listingRes, appRes, guarantyRes] = await Promise.all([
            supabase.from("profiles_public").select("first_name, last_name").eq("id", pkg.applicant_id).single(),
            pkg.listing_id ? supabase.from("listings").select("address").eq("id", pkg.listing_id).single() : { data: null },
            pkg.application_id ? supabase.from("bbg_sublet_applications").select("status").eq("id", pkg.application_id).single() : { data: null },
            pkg.guaranty_id ? supabase.from("bbg_guaranty_of_lease").select("status").eq("id", pkg.guaranty_id).single() : { data: null },
          ]);
          const missing: string[] = [];
          if (!appRes.data || appRes.data.status !== "completed") missing.push("Sublet Application");
          if (!guarantyRes.data || guarantyRes.data.status !== "completed") missing.push("Guaranty of Lease");
          return {
            ...pkg,
            applicant_name: [profileRes.data?.first_name, profileRes.data?.last_name].filter(Boolean).join(" ") || "Unknown",
            address: listingRes.data?.address || "—",
            missing_docs: missing.join(", ") || "Unknown",
          };
        })
      );
      return enriched;
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (pkg: any) => {
      await supabase.from("notifications").insert({
        user_id: pkg.applicant_id,
        title: "Document Reminder",
        message: `Please complete your BBG subletting documents for ${pkg.address}.`,
        type: "document_reminder",
        link: `/documents/bbg?listing_id=${pkg.listing_id}`,
      });
      await supabase.from("bbg_document_packages").update({ reminder_sent_at: new Date().toISOString() }).eq("id", pkg.id);
    },
    onSuccess: () => {
      toast.success("Reminder sent");
      queryClient.invalidateQueries({ queryKey: ["manager-recent-docs-pending"] });
    },
  });

  const tiles = [
    { label: "Pending Approvals", value: stats?.pendingApprovals ?? 0, icon: ClipboardCheck, color: "text-amber-600", link: `${P}/approvals` },
    { label: "Active Listings", value: stats?.activeListings ?? 0, icon: Building2, color: "text-primary", link: `${P}/listings` },
    { label: "Documents Pending", value: stats?.documentsPending ?? 0, icon: FileText, color: "text-destructive", link: `${P}/documents` },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* BBG Welcome Banner */}
      <div className="flex items-center gap-4">
        <img src={bbgLogo} alt="Boston Brokerage Group" className="h-14 w-14 rounded-xl object-contain border bg-card p-1" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boston Brokerage Group</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Staff Dashboard · Property Management Portal</p>
        </div>
      </div>

      {/* 3 Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.link}>
            <Card className="shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
                  <tile.icon className={`h-5 w-5 ${tile.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <p className="text-xl font-bold text-foreground">{tile.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Approvals Section */}
      <Card className="shadow-card">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Pending Approvals</h2>
          <Link to={`${P}/approvals`}>
            <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        <CardContent className="pt-0 space-y-1">
          {recentPending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No pending approvals right now.</p>
          ) : (
            recentPending.map((listing: any) => (
              <div key={listing.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{listing.address || "No address"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {listing.tenant_name}
                    <span className="mx-1">·</span>
                    <Calendar className="h-3 w-3" /> {listing.created_at ? format(new Date(listing.created_at), "MMM d, yyyy") : "—"}
                  </p>
                </div>
                <Link to={`${P}/approvals`}>
                  <Button size="sm" variant="outline">Review</Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Documents Pending Section */}
      <Card className="shadow-card">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Documents Pending</h2>
          <Link to={`${P}/documents`}>
            <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        <CardContent className="pt-0 space-y-1">
          {recentDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">All documents are complete.</p>
          ) : (
            recentDocs.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.applicant_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.address} · Missing: {doc.missing_docs}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendReminderMutation.mutate(doc)}
                  disabled={sendReminderMutation.isPending}
                >
                  <Send className="mr-1 h-3.5 w-3.5" /> Remind
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerHome;
