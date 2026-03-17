import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FileText, Search, Download, Printer, ChevronRight, Clock,
  CheckCircle2, AlertCircle, Send, X, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DocPackage = {
  id: string;
  listing_id: string | null;
  applicant_id: string;
  application_id: string | null;
  guaranty_id: string | null;
  overall_status: string;
  sent_at: string | null;
  reminder_sent_at: string | null;
  manager_notes: string | null;
  created_at: string;
  // joined
  listing?: any;
  applicant_profile?: any;
  application?: any;
  guaranty?: any;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  not_sent: { label: "Not Sent", color: "bg-muted text-muted-foreground", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  partially_complete: { label: "Partial", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  fully_complete: { label: "Complete", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_sent;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} border-0 gap-1`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

function DocStatusBadge({ status }: { status: string | null }) {
  if (!status || status === "not_started") return <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Not started</span>;
  if (status === "in_progress") return <span className="text-xs text-yellow-600 flex items-center gap-1"><Clock className="h-3 w-3" /> In progress</span>;
  if (status === "completed") return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
  return <span className="text-xs text-muted-foreground">{status}</span>;
}

export default function ManagerDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  // Fetch packages with related data
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["bbg-doc-packages"],
    enabled: !!user,
    queryFn: async () => {
      const { data: pkgs } = await supabase
        .from("bbg_document_packages")
        .select("*")
        .order("created_at", { ascending: false });
      if (!pkgs?.length) return [];

      // Enrich with listing, profile, application, guaranty data
      const enriched = await Promise.all(
        pkgs.map(async (pkg: any) => {
          const [listingRes, profileRes, appRes, guarantyRes] = await Promise.all([
            pkg.listing_id ? supabase.from("listings").select("address, unit_number, monthly_rent").eq("id", pkg.listing_id).single() : { data: null },
            supabase.from("profiles_public").select("*").eq("id", pkg.applicant_id).single(),
            pkg.application_id ? supabase.from("bbg_sublet_applications").select("status, completed_at, full_name").eq("id", pkg.application_id).single() : { data: null },
            pkg.guaranty_id ? supabase.from("bbg_guaranty_of_lease").select("status, completed_at, guarantor_name").eq("id", pkg.guaranty_id).single() : { data: null },
          ]);
          return {
            ...pkg,
            listing: listingRes.data,
            applicant_profile: profileRes.data,
            application: appRes.data,
            guaranty: guarantyRes.data,
          };
        })
      );
      return enriched as DocPackage[];
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      await supabase.from("bbg_document_packages").update({ manager_notes: notes }).eq("id", id);
    },
    onSuccess: () => {
      toast.success("Notes saved");
      queryClient.invalidateQueries({ queryKey: ["bbg-doc-packages"] });
      setNotesOpen(null);
    },
  });

  const filtered = packages.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${p.applicant_profile?.first_name || ""} ${p.applicant_profile?.last_name || ""}`.toLowerCase();
    const addr = (p.listing?.address || "").toLowerCase();
    return name.includes(s) || addr.includes(s);
  });

  const selectedPackage = packages.find((p) => p.id === selectedPkg);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">Track and manage subletting documents for all applicants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or address..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Packages", value: packages.length, color: "text-foreground" },
          { label: "Completed", value: packages.filter((p) => p.overall_status === "fully_complete").length, color: "text-green-600" },
          { label: "In Progress", value: packages.filter((p) => ["in_progress", "partially_complete", "sent"].includes(p.overall_status)).length, color: "text-yellow-600" },
          { label: "Not Started", value: packages.filter((p) => p.overall_status === "not_sent").length, color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No document packages yet</p>
          <p className="text-xs text-muted-foreground mt-1">Document packages are created when sub-lessees are approved</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => {
            const name = `${pkg.applicant_profile?.first_name || ""} ${pkg.applicant_profile?.last_name || "Unknown"}`.trim();
            return (
              <div key={pkg.id} className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{name}</h3>
                      <StatusBadge status={pkg.overall_status} />
                    </div>
                    {pkg.listing && (
                      <p className="text-sm text-muted-foreground truncate">
                        {pkg.listing.address}{pkg.listing.unit_number ? `, Unit ${pkg.listing.unit_number}` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs font-medium text-foreground mb-0.5">Sublet Application</p>
                        <DocStatusBadge status={pkg.application?.status} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground mb-0.5">Guaranty of Lease</p>
                        <DocStatusBadge status={pkg.guaranty?.status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => { setNotesOpen(pkg.id); setNotesText(pkg.manager_notes || ""); }}>
                      <StickyNote className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPkg(pkg.id)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes dialog */}
      <Dialog open={!!notesOpen} onOpenChange={() => setNotesOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manager Notes</DialogTitle>
          </DialogHeader>
          <Textarea rows={5} value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="Add internal notes about this applicant..." />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNotesOpen(null)}>Cancel</Button>
            <Button onClick={() => notesOpen && saveNotesMutation.mutate({ id: notesOpen, notes: notesText })}>
              Save Notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <Dialog open={!!selectedPkg} onOpenChange={() => setSelectedPkg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Folder
            </DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{selectedPackage.applicant_profile?.first_name} {selectedPackage.applicant_profile?.last_name}</p>
                {selectedPackage.listing && (
                  <p className="text-sm text-muted-foreground">{selectedPackage.listing.address}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">BMG Sublet Application</p>
                    <DocStatusBadge status={selectedPackage.application?.status} />
                  </div>
                  {selectedPackage.application?.status === "completed" && (
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Download className="h-4 w-4 mr-1" /> Print
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">BBG Guaranty of Lease</p>
                    <DocStatusBadge status={selectedPackage.guaranty?.status} />
                  </div>
                  {selectedPackage.guaranty?.status === "completed" && (
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Download className="h-4 w-4 mr-1" /> Print
                    </Button>
                  )}
                </div>
              </div>

              {selectedPackage.manager_notes && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Manager Notes</p>
                  <p className="text-sm">{selectedPackage.manager_notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" /> Print All Documents
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
