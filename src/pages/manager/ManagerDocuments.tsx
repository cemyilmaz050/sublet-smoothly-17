import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow, subDays, subHours } from "date-fns";
import {
  FileText, Search, Download, Printer, ChevronRight, Clock,
  CheckCircle2, AlertCircle, Send, StickyNote, X, User, Mail,
  Phone, MapPin, Calendar, Eye, ChevronDown, ChevronUp,
  Users, FileCheck, FileClock, Activity, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import BMGSubletApplicationView from "@/components/documents/BMGSubletApplicationView";
import BBGGuarantyOfLeaseView from "@/components/documents/BBGGuarantyOfLeaseView";

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
  updated_at: string;
  listing?: any;
  applicant_profile?: any;
  application?: any;
  guaranty?: any;
};

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; icon: typeof CheckCircle2 }> = {
  not_sent: { label: "Not Started", bgClass: "bg-muted", textClass: "text-muted-foreground", icon: Clock },
  sent: { label: "Sent", bgClass: "bg-blue-100 dark:bg-blue-900/30", textClass: "text-blue-700 dark:text-blue-300", icon: Send },
  in_progress: { label: "In Progress", bgClass: "bg-amber-100 dark:bg-amber-900/30", textClass: "text-amber-700 dark:text-amber-300", icon: Clock },
  partially_complete: { label: "Partially Complete", bgClass: "bg-amber-100 dark:bg-amber-900/30", textClass: "text-amber-700 dark:text-amber-300", icon: AlertCircle },
  fully_complete: { label: "Fully Complete", bgClass: "bg-emerald-100 dark:bg-emerald-900/30", textClass: "text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
};

function OverallBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_sent;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.bgClass} ${cfg.textClass} border-0 gap-1 font-medium`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

function DocStatusIcon({ status }: { status: string | null | undefined }) {
  if (!status || status === "not_started") return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" title="Not started" />;
  if (status === "in_progress") return <Clock className="h-5 w-5 text-amber-500" />;
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  return <Clock className="h-5 w-5 text-muted-foreground" />;
}

function getRowClass(status: string) {
  if (status === "fully_complete") return "border-l-4 border-l-emerald-500";
  if (["in_progress", "partially_complete", "sent"].includes(status)) return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-muted-foreground/20";
}

function getInitials(first?: string | null, last?: string | null) {
  return `${(first || "?")[0]}${(last || "")[0] || ""}`.toUpperCase();
}

export default function ManagerDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["bbg-doc-packages"],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data: pkgs } = await supabase
        .from("bbg_document_packages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!pkgs?.length) return [];

      const enriched = await Promise.all(
        pkgs.map(async (pkg: any) => {
          const [listingRes, profileRes, appRes, guarantyRes] = await Promise.all([
            pkg.listing_id ? supabase.from("listings").select("address, unit_number, monthly_rent, photos").eq("id", pkg.listing_id).single() : { data: null },
            supabase.from("profiles_public").select("*").eq("id", pkg.applicant_id).single(),
            pkg.application_id ? supabase.from("bbg_sublet_applications").select("*").eq("id", pkg.application_id).single() : supabase.from("bbg_sublet_applications").select("*").eq("applicant_id", pkg.applicant_id).eq("listing_id", pkg.listing_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
            pkg.guaranty_id ? supabase.from("bbg_guaranty_of_lease").select("*").eq("id", pkg.guaranty_id).single() : supabase.from("bbg_guaranty_of_lease").select("*").eq("applicant_id", pkg.applicant_id).eq("listing_id", pkg.listing_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
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

  const sendReminderMutation = useMutation({
    mutationFn: async (pkg: DocPackage) => {
      const name = `${pkg.applicant_profile?.first_name || ""} ${pkg.applicant_profile?.last_name || ""}`.trim();
      // Create a notification for the applicant
      await supabase.from("notifications").insert({
        user_id: pkg.applicant_id,
        title: "Document Reminder",
        message: `Please complete your BBG subletting documents for ${pkg.listing?.address || "your listing"}. Complete it in 5 minutes to secure your place.`,
        type: "document_reminder",
        link: `/documents/bbg?listing_id=${pkg.listing_id}`,
      });
      await supabase.from("bbg_document_packages").update({ reminder_sent_at: new Date().toISOString() }).eq("id", pkg.id);
    },
    onSuccess: () => {
      toast.success("Reminder sent to applicant");
      queryClient.invalidateQueries({ queryKey: ["bbg-doc-packages"] });
    },
  });

  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (filterStatus !== "all") {
        if (filterStatus === "complete" && p.overall_status !== "fully_complete") return false;
        if (filterStatus === "incomplete" && p.overall_status === "fully_complete") return false;
        if (filterStatus === "not_started" && p.overall_status !== "not_sent" && p.overall_status !== "in_progress") return false;
      }
      if (!search) return true;
      const s = search.toLowerCase();
      const name = `${p.applicant_profile?.first_name || ""} ${p.applicant_profile?.last_name || ""}`.toLowerCase();
      const addr = (p.listing?.address || "").toLowerCase();
      return name.includes(s) || addr.includes(s);
    });
  }, [packages, search, filterStatus]);

  const selectedPackage = packages.find((p) => p.id === selectedPkg);

  // Stats
  const totalApplicants = packages.length;
  const completeCount = packages.filter((p) => p.overall_status === "fully_complete").length;
  const incompleteCount = packages.filter((p) => p.overall_status !== "fully_complete" && p.overall_status !== "not_sent").length;
  const thisWeekCount = packages.filter((p) => {
    const weekAgo = subDays(new Date(), 7);
    return (p.application?.completed_at && new Date(p.application.completed_at) > weekAgo) ||
           (p.guaranty?.completed_at && new Date(p.guaranty.completed_at) > weekAgo);
  }).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBulkPrint = () => {
    window.print();
  };

  const buildTimeline = (pkg: DocPackage) => {
    const events: { date: string; label: string; icon: typeof FileText }[] = [];
    events.push({ date: pkg.created_at, label: "Application package created", icon: FileText });
    if (pkg.sent_at) events.push({ date: pkg.sent_at, label: "Documents link sent to applicant", icon: Send });
    if (pkg.application?.created_at && pkg.application.status !== "not_started") {
      events.push({ date: pkg.application.created_at, label: "Started Sublet Application", icon: FileClock });
    }
    if (pkg.application?.completed_at) {
      events.push({ date: pkg.application.completed_at, label: "Completed Sublet Application", icon: FileCheck });
    }
    if (pkg.guaranty?.created_at && pkg.guaranty.status !== "not_started") {
      events.push({ date: pkg.guaranty.created_at, label: "Started Guaranty of Lease", icon: FileClock });
    }
    if (pkg.guaranty?.completed_at) {
      events.push({ date: pkg.guaranty.completed_at, label: "Completed Guaranty of Lease", icon: FileCheck });
    }
    if (pkg.reminder_sent_at) events.push({ date: pkg.reminder_sent_at, label: "Reminder sent", icon: Bell });
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">Track and manage all BBG subletting documents</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkPrint}>
              <Printer className="h-4 w-4 mr-1" /> Print Selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleBulkPrint}>
            <Download className="h-4 w-4 mr-1" /> Export Documents
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applicants", value: totalApplicants, icon: Users, colorClass: "text-foreground" },
          { label: "Complete Documents", value: completeCount, icon: FileCheck, colorClass: "text-emerald-600" },
          { label: "Incomplete", value: incompleteCount, icon: FileClock, colorClass: "text-amber-600" },
          { label: "Received This Week", value: thisWeekCount, icon: Activity, colorClass: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.colorClass}`} />
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
            <p className={`text-3xl font-bold ${stat.colorClass}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or address..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[
            { key: "all", label: "All" },
            { key: "complete", label: "Complete" },
            { key: "incomplete", label: "Incomplete" },
            { key: "not_started", label: "Not Started" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filterStatus === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(f.key)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Applicant List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No document packages found</p>
          <p className="text-xs text-muted-foreground mt-1">Packages are auto-created when sub-lessees start their documents</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
            <Checkbox
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="flex-1">Applicant</span>
            <span className="w-28 text-center hidden md:block">Application</span>
            <span className="w-28 text-center hidden md:block">Guaranty</span>
            <span className="w-36 text-center hidden md:block">Status</span>
            <span className="w-20" />
          </div>

          {filtered.map((pkg) => {
            const name = `${pkg.applicant_profile?.first_name || ""} ${pkg.applicant_profile?.last_name || "Unknown"}`.trim();
            const initials = getInitials(pkg.applicant_profile?.first_name, pkg.applicant_profile?.last_name);

            return (
              <div
                key={pkg.id}
                className={`rounded-xl border bg-card p-4 hover:shadow-md transition-all cursor-pointer ${getRowClass(pkg.overall_status)}`}
                onClick={() => setSelectedPkg(pkg.id)}
              >
                <div className="flex items-center gap-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(pkg.id)}
                      onCheckedChange={() => toggleSelect(pkg.id)}
                    />
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={pkg.applicant_profile?.avatar_url} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                    {pkg.listing && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {pkg.listing.address}{pkg.listing.unit_number ? `, Unit ${pkg.listing.unit_number}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="w-28 flex justify-center hidden md:flex">
                    <DocStatusIcon status={pkg.application?.status} />
                  </div>
                  <div className="w-28 flex justify-center hidden md:flex">
                    <DocStatusIcon status={pkg.guaranty?.status} />
                  </div>
                  <div className="w-36 flex justify-center hidden md:flex">
                    <OverallBadge status={pkg.overall_status} />
                  </div>
                  <div className="w-20 flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setNotesOpen(pkg.id); setNotesText(pkg.manager_notes || ""); }}>
                      <StickyNote className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {/* Mobile status row */}
                <div className="flex items-center gap-4 mt-3 md:hidden">
                  <div className="flex items-center gap-1.5 text-xs">
                    <DocStatusIcon status={pkg.application?.status} />
                    <span className="text-muted-foreground">Application</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <DocStatusIcon status={pkg.guaranty?.status} />
                    <span className="text-muted-foreground">Guaranty</span>
                  </div>
                  <OverallBadge status={pkg.overall_status} />
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

      {/* Detail Sheet (slide-out panel) */}
      <Sheet open={!!selectedPkg} onOpenChange={() => setSelectedPkg(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
          {selectedPackage && <ApplicantDetailPanel pkg={selectedPackage} onSendReminder={() => sendReminderMutation.mutate(selectedPackage)} sendingReminder={sendReminderMutation.isPending} buildTimeline={buildTimeline} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ApplicantDetailPanel({ pkg, onSendReminder, sendingReminder, buildTimeline }: {
  pkg: DocPackage;
  onSendReminder: () => void;
  sendingReminder: boolean;
  buildTimeline: (pkg: DocPackage) => { date: string; label: string; icon: typeof FileText }[];
}) {
  const name = `${pkg.applicant_profile?.first_name || ""} ${pkg.applicant_profile?.last_name || "Unknown"}`.trim();
  const initials = getInitials(pkg.applicant_profile?.first_name, pkg.applicant_profile?.last_name);
  const timeline = buildTimeline(pkg);
  const [viewingDoc, setViewingDoc] = useState<"application" | "guaranty" | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>BBG Documents - ${name}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print { body { margin: 0; } .page-break { page-break-before: always; } }
        body { font-family: 'Times New Roman', Georgia, serif; }
      </style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const tenantName = pkg.listing ? `Tenant` : "";

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Applicant Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={pkg.applicant_profile?.avatar_url} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            {pkg.listing && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {pkg.listing.address}{pkg.listing.unit_number ? `, Unit ${pkg.listing.unit_number}` : ""}
              </p>
            )}
            <div className="mt-2">
              <OverallBadge status={pkg.overall_status} />
            </div>
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-3">
          {pkg.application?.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{pkg.application.email}</span>
            </div>
          )}
          {pkg.application?.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{pkg.application.phone}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Document Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sublet Application Card */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Sublet Application</h3>
              <DocStatusIcon status={pkg.application?.status} />
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>Status: <span className="font-medium text-foreground">{pkg.application?.status === "completed" ? "Complete" : pkg.application?.status === "in_progress" ? "In Progress" : "Not Started"}</span></p>
              {pkg.application?.completed_at && (
                <p>Submitted: {format(new Date(pkg.application.completed_at), "MMM d, yyyy 'at' h:mm a")}</p>
              )}
            </div>
            {pkg.application?.status === "completed" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setViewingDoc("application")}>
                  <Eye className="h-3 w-3 mr-1" /> View Document
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handlePrint}>
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
              </div>
            )}
          </div>

          {/* Guaranty of Lease Card */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Guaranty of Lease</h3>
              <DocStatusIcon status={pkg.guaranty?.status} />
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>Status: <span className="font-medium text-foreground">{pkg.guaranty?.status === "completed" ? "Complete" : pkg.guaranty?.status === "in_progress" ? "In Progress" : "Not Started"}</span></p>
              {pkg.guaranty?.completed_at && (
                <p>Submitted: {format(new Date(pkg.guaranty.completed_at), "MMM d, yyyy 'at' h:mm a")}</p>
              )}
            </div>
            {pkg.guaranty?.status === "completed" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setViewingDoc("guaranty")}>
                  <Eye className="h-3 w-3 mr-1" /> View Document
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handlePrint}>
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Inline Document View — replaces the old generic data table */}
        {viewingDoc === "application" && pkg.application?.status === "completed" && (
          <div className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Sublet Application — Original Format</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="overflow-auto max-h-[600px]">
              <BMGSubletApplicationView
                data={pkg.application}
                tenantName={tenantName}
                verificationId={pkg.id.slice(0, 8).toUpperCase()}
              />
            </div>
          </div>
        )}

        {viewingDoc === "guaranty" && pkg.guaranty?.status === "completed" && (
          <div className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Guaranty of Lease — Original Format</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="overflow-auto max-h-[600px]">
              <BBGGuarantyOfLeaseView
                data={pkg.guaranty}
                verificationId={pkg.id.slice(0, 8).toUpperCase()}
              />
            </div>
          </div>
        )}

        {/* Manager Notes */}
        {pkg.manager_notes && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Manager Notes</p>
            <p className="text-sm text-foreground">{pkg.manager_notes}</p>
          </div>
        )}

        <Separator />

        {/* Activity Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" /> Activity Timeline
          </h3>
          <div className="space-y-0">
            {timeline.map((event, i) => {
              const Icon = event.icon;
              return (
                <div key={i} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm text-foreground">{event.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")} · {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Reminders */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Reminders</h3>
          {pkg.reminder_sent_at && (
            <p className="text-xs text-muted-foreground">
              Last reminder sent: {format(new Date(pkg.reminder_sent_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
          {pkg.overall_status !== "fully_complete" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSendReminder}
              disabled={sendingReminder}
            >
              <Send className="h-4 w-4 mr-1" />
              {sendingReminder ? "Sending..." : "Send Manual Reminder"}
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print All Documents
          </Button>
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-1" /> Download PDF
          </Button>
        </div>

        {/* Hidden print container with both documents */}
        <div className="hidden">
          <div ref={printRef}>
            {pkg.application?.status === "completed" && (
              <BMGSubletApplicationView
                data={pkg.application}
                tenantName={tenantName}
                verificationId={pkg.id.slice(0, 8).toUpperCase()}
              />
            )}
            {pkg.guaranty?.status === "completed" && (
              <div className="page-break">
                <BBGGuarantyOfLeaseView
                  data={pkg.guaranty}
                  verificationId={pkg.id.slice(0, 8).toUpperCase()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Legal reference label */}
        <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
          <p>Submitted via SubIn · Verification ID: {pkg.id.slice(0, 8).toUpperCase()}</p>
          <p>Date: {format(new Date(pkg.updated_at || pkg.created_at), "MMMM d, yyyy")}</p>
        </div>
      </div>
    </ScrollArea>
  );
}

