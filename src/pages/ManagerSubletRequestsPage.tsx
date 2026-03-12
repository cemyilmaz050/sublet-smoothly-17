import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, CheckCircle2, Clock, XCircle, Eye, MessageSquare,
  Search, ArrowLeft, User, Calendar, AlertTriangle, Send
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Mock data for documents and tenant profiles (since those tables aren't fully wired yet)
const mockDocuments = [
  { id: "1", document_type: "Lease Agreement", file_name: "lease_agreement.pdf", status: "pending", file_url: "#" },
  { id: "2", document_type: "Proof of Residence", file_name: "utility_bill.pdf", status: "pending", file_url: "#" },
  { id: "3", document_type: "Sublet Request Letter", file_name: "sublet_request.pdf", status: "pending", file_url: "#" },
  { id: "4", document_type: "Government ID", file_name: "drivers_license.jpg", status: "pending", file_url: "#" },
];

const mockTenantProfiles: Record<string, { name: string; email: string; phone: string; tenancy: string }> = {};

const rejectionReasons = [
  "Does not meet building policy",
  "Lease does not allow subletting",
  "Incomplete documentation",
  "Other",
];

interface SubletRequest {
  id: string;
  tenant_id: string;
  manager_id: string;
  property_address: string;
  unit_number: string | null;
  status: string;
  rejection_reason: string | null;
  rejection_note: string | null;
  manager_message: string | null;
  max_sublet_duration: number | null;
  additional_rules: string | null;
  co_approve_subtenant: boolean | null;
  created_at: string;
  updated_at: string;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved": return "approved";
    case "rejected": return "rejected";
    case "more_info_needed": return "amber";
    default: return "pending";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "more_info_needed": return "More Info Needed";
    default: return "Pending";
  }
};

const OnboardingDocumentsTab = () => {
  const { user } = useAuth();

  const { data: tenantDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["manager-onboarding-docs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all tenant documents visible to manager
      const { data, error } = await supabase
        .from("tenant_documents" as any)
        .select("*")
        .order("uploaded_at", { ascending: false }) as any;
      if (error) throw error;

      // Group by tenant_id
      const grouped: Record<string, any[]> = {};
      for (const doc of (data || [])) {
        if (!grouped[doc.tenant_id]) grouped[doc.tenant_id] = [];
        grouped[doc.tenant_id].push(doc);
      }

      // Get profiles for those tenants
      const tenantIds = Object.keys(grouped);
      if (tenantIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, documents_status")
        .in("id", tenantIds) as any;

      // Get cosigners
      const { data: cosigners } = await supabase
        .from("cosigners" as any)
        .select("*")
        .in("tenant_id", tenantIds) as any;

      return tenantIds.map((tid) => ({
        tenantId: tid,
        profile: (profiles || []).find((p: any) => p.id === tid),
        documents: grouped[tid],
        cosigner: (cosigners || []).find((c: any) => c.tenant_id === tid),
      }));
    },
  });

  const queryClient = useQueryClient();

  const handleDocAction = async (docId: string, status: string, comment?: string) => {
    await supabase
      .from("tenant_documents" as any)
      .update({ status, review_comment: comment || null } as any)
      .eq("id", docId);
    queryClient.invalidateQueries({ queryKey: ["manager-onboarding-docs"] });
    toast.success(`Document ${status}`);
  };

  const handleApproveAll = async (tenantId: string, docs: any[]) => {
    for (const doc of docs) {
      await supabase
        .from("tenant_documents" as any)
        .update({ status: "approved" } as any)
        .eq("id", doc.id);
    }
    await supabase
      .from("profiles")
      .update({ documents_status: "approved" } as any)
      .eq("id", tenantId);
    
    await supabase.from("notifications").insert({
      user_id: tenantId,
      title: "Documents Approved",
      message: "Your onboarding documents have been approved! You can now create listings.",
      type: "approval",
      link: "/dashboard/tenant",
    });
    
    queryClient.invalidateQueries({ queryKey: ["manager-onboarding-docs"] });
    toast.success("All documents approved");
  };

  const docTypeLabel = (type: string) => {
    switch (type) {
      case "photo_id_front": return "Photo ID (Front)";
      case "photo_id_back": return "Photo ID (Back)";
      case "application_form": return "Application Form";
      case "cosigner_document": return "Co-Signer Document";
      default: return type;
    }
  };

  if (docsLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  if (tenantDocs.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          No onboarding documents submitted yet. They will appear here when tenants complete their onboarding.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tenantDocs.map((tenant: any) => (
        <Card key={tenant.tenantId} className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {tenant.profile?.first_name || ""} {tenant.profile?.last_name || "Tenant"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(tenant.documents[0]?.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="emerald"
                size="sm"
                onClick={() => handleApproveAll(tenant.tenantId, tenant.documents)}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Approve All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.documents.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{docTypeLabel(doc.document_type)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{doc.file_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(doc.status) as any}>
                        {statusLabel(doc.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="emerald" size="sm" onClick={() => handleDocAction(doc.id, "approved")}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDocAction(doc.id, "rejected", "Please re-upload")}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenant.cosigner && (
                  <TableRow>
                    <TableCell className="font-medium">Co-Signer</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tenant.cosigner.full_name} ({tenant.cosigner.email})
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(tenant.cosigner.confirmation_status) as any}>
                        {tenant.cosigner.confirmation_status === "confirmed" ? "Confirmed" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const ManagerSubletRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<SubletRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Decision state
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [additionalRules, setAdditionalRules] = useState("");
  const [coApprove, setCoApprove] = useState(false);

  // Doc review state
  const [docStatuses, setDocStatuses] = useState<Record<string, { status: string; comment: string }>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["manager-sublet-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sublet_requests")
        .select("*")
        .eq("manager_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SubletRequest[];
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("sublet_requests")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-sublet-requests"] });
      queryClient.invalidateQueries({ queryKey: ["manager-stats"] });
    },
  });

  const handleApprove = async () => {
    if (!selectedRequest) return;
    await updateRequestMutation.mutateAsync({
      id: selectedRequest.id,
      updates: {
        status: "approved",
        max_sublet_duration: maxDuration ? parseInt(maxDuration) : null,
        additional_rules: additionalRules || null,
        co_approve_subtenant: coApprove,
      },
    });
    // Send notification to tenant
    await supabase.from("notifications").insert({
      user_id: selectedRequest.tenant_id,
      title: "Sublet Request Approved",
      message: `Your sublet request for ${selectedRequest.property_address}${selectedRequest.unit_number ? ` Unit ${selectedRequest.unit_number}` : ""} has been approved.`,
      type: "approval",
      link: "/dashboard/tenant",
    });
    toast.success("Request approved successfully");
    setReviewOpen(false);
    resetDecisionState();
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error("Please select a rejection reason");
      return;
    }
    await updateRequestMutation.mutateAsync({
      id: selectedRequest.id,
      updates: {
        status: "rejected",
        rejection_reason: rejectionReason,
        rejection_note: rejectionNote || null,
      },
    });
    await supabase.from("notifications").insert({
      user_id: selectedRequest.tenant_id,
      title: "Sublet Request Rejected",
      message: `Your sublet request for ${selectedRequest.property_address} has been rejected. Reason: ${rejectionReason}`,
      type: "rejection",
      link: "/dashboard/tenant",
    });
    toast.success("Request rejected");
    setReviewOpen(false);
    resetDecisionState();
  };

  const handleRequestMoreInfo = async () => {
    if (!selectedRequest || !moreInfoMessage) {
      toast.error("Please enter a message");
      return;
    }
    await updateRequestMutation.mutateAsync({
      id: selectedRequest.id,
      updates: {
        status: "more_info_needed",
        manager_message: moreInfoMessage,
      },
    });
    await supabase.from("notifications").insert({
      user_id: selectedRequest.tenant_id,
      title: "More Information Needed",
      message: moreInfoMessage,
      type: "info_request",
      link: "/dashboard/tenant",
    });
    toast.success("Information request sent to tenant");
    setReviewOpen(false);
    resetDecisionState();
  };

  const resetDecisionState = () => {
    setRejectionReason("");
    setRejectionNote("");
    setMoreInfoMessage("");
    setMaxDuration("");
    setAdditionalRules("");
    setCoApprove(false);
    setDocStatuses({});
    setSelectedRequest(null);
  };

  const openReview = (req: SubletRequest) => {
    setSelectedRequest(req);
    setReviewOpen(true);
    // Pre-fill if already has conditions
    if (req.max_sublet_duration) setMaxDuration(String(req.max_sublet_duration));
    if (req.additional_rules) setAdditionalRules(req.additional_rules);
    if (req.co_approve_subtenant) setCoApprove(true);
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.property_address.toLowerCase().includes(q) ||
        (r.unit_number?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link to="/dashboard/manager">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sublet Requests</h1>
            <p className="text-sm text-muted-foreground">Review and manage tenant sublet requests and onboarding documents</p>
          </div>
        </div>

        <Tabs defaultValue="requests" className="mb-6">
          <TabsList>
            <TabsTrigger value="requests">Sublet Requests</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by address or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="more_info_needed">More Info Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests Table */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property Address</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {requests.length === 0
                        ? "No sublet requests yet. They will appear here when tenants submit them."
                        : "No requests match your filters."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} className="cursor-pointer hover:bg-accent/50" onClick={() => openReview(req)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground text-sm">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground">Tenant</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{req.property_address}</TableCell>
                      <TableCell>{req.unit_number || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(req.status) as any}>
                          {statusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openReview(req); }}>
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingDocumentsTab />
        </TabsContent>
        </Tabs>
      </div>
      <Dialog open={reviewOpen} onOpenChange={(open) => { if (!open) { setReviewOpen(false); resetDecisionState(); } }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              Review Sublet Request
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <Tabs defaultValue="documents" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
                <TabsTrigger value="tenant" className="flex-1">Tenant Profile</TabsTrigger>
                <TabsTrigger value="decision" className="flex-1">Decision</TabsTrigger>
                {selectedRequest.status === "approved" && (
                  <TabsTrigger value="conditions" className="flex-1">Conditions</TabsTrigger>
                )}
              </TabsList>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">Review each uploaded document and approve or reject individually.</p>
                {mockDocuments.map((doc) => {
                  const docState = docStatuses[doc.id] || { status: doc.status, comment: "" };
                  return (
                    <Card key={doc.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{doc.document_type}</p>
                              <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                            </div>
                          </div>
                          <Badge variant={statusBadgeVariant(docState.status) as any}>
                            {docState.status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                            {docState.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                            {docState.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                            {docState.status.charAt(0).toUpperCase() + docState.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Document viewer coming soon")}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            variant="emerald"
                            size="sm"
                            onClick={() => setDocStatuses(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], status: "approved", comment: prev[doc.id]?.comment || "" } }))}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDocStatuses(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], status: "rejected", comment: prev[doc.id]?.comment || "" } }))}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                        {docState.status === "rejected" && (
                          <Textarea
                            placeholder="Reason for rejection..."
                            className="mt-3"
                            value={docState.comment}
                            onChange={(e) => setDocStatuses(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], comment: e.target.value } }))}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Tenant Profile Tab */}
              <TabsContent value="tenant" className="mt-4">
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                        <User className="h-8 w-8 text-accent-foreground" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Tenant Profile</h3>
                          <p className="text-sm text-muted-foreground">Request for {selectedRequest.property_address}{selectedRequest.unit_number ? `, Unit ${selectedRequest.unit_number}` : ""}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">Contact Email</p>
                            <p className="text-sm text-foreground">tenant@email.com</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">Phone</p>
                            <p className="text-sm text-foreground">(555) 123-4567</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">Tenant Since</p>
                            <p className="text-sm text-foreground">January 2024</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">Rental History</p>
                            <p className="text-sm text-foreground">No prior sublets on platform</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Decision Tab */}
              <TabsContent value="decision" className="mt-4 space-y-6">
                {selectedRequest.status === "pending" || selectedRequest.status === "more_info_needed" ? (
                  <>
                    {/* Approve Section */}
                    <Card className="border-emerald/30 shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-emerald">
                          <CheckCircle2 className="h-5 w-5" />
                          Approve Sublet Request
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Approving will allow the tenant to create a listing and find a subtenant.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium text-foreground">Max Sublet Duration (months)</label>
                            <Select value={maxDuration} onValueChange={setMaxDuration}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 6, 9, 12].map(m => (
                                  <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Checkbox checked={coApprove} onCheckedChange={(c) => setCoApprove(!!c)} />
                              Require co-approval of subtenant
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Additional Rules or Restrictions</label>
                          <Textarea
                            placeholder="Any additional rules for this sublet..."
                            className="mt-1"
                            value={additionalRules}
                            onChange={(e) => setAdditionalRules(e.target.value)}
                          />
                        </div>
                        <Button variant="emerald" onClick={handleApprove} disabled={updateRequestMutation.isPending}>
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Approve Sublet Request
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Request More Info */}
                    <Card className="border-amber/30 shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-amber">
                          <MessageSquare className="h-5 w-5" />
                          Request More Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="What additional information do you need from the tenant?"
                          value={moreInfoMessage}
                          onChange={(e) => setMoreInfoMessage(e.target.value)}
                        />
                        <Button variant="amber" onClick={handleRequestMoreInfo} disabled={updateRequestMutation.isPending || !moreInfoMessage}>
                          <Send className="mr-1 h-4 w-4" />
                          Send Request
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Reject */}
                    <Card className="border-destructive/30 shadow-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-destructive">
                          <XCircle className="h-5 w-5" />
                          Reject Sublet Request
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Rejection Reason *</label>
                          <Select value={rejectionReason} onValueChange={setRejectionReason}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {rejectionReasons.map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder="Optional additional note..."
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                        />
                        <Button variant="destructive" onClick={handleReject} disabled={updateRequestMutation.isPending || !rejectionReason}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject Request
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="shadow-card">
                    <CardContent className="flex flex-col items-center py-12 text-center">
                      {selectedRequest.status === "approved" && (
                        <>
                          <CheckCircle2 className="h-12 w-12 text-emerald" />
                          <h3 className="mt-4 text-lg font-semibold text-foreground">Request Approved</h3>
                          <p className="mt-2 text-sm text-muted-foreground">This request has been approved. The tenant can now create a listing.</p>
                        </>
                      )}
                      {selectedRequest.status === "rejected" && (
                        <>
                          <XCircle className="h-12 w-12 text-destructive" />
                          <h3 className="mt-4 text-lg font-semibold text-foreground">Request Rejected</h3>
                          <p className="mt-2 text-sm text-muted-foreground">Reason: {selectedRequest.rejection_reason}</p>
                          {selectedRequest.rejection_note && (
                            <p className="mt-1 text-sm text-muted-foreground">{selectedRequest.rejection_note}</p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Conditions Tab (shown after approval) */}
              {selectedRequest.status === "approved" && (
                <TabsContent value="conditions" className="mt-4">
                  <Card className="shadow-card">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-foreground">Sublet Conditions</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Max Duration</p>
                          <p className="text-sm text-foreground">
                            {selectedRequest.max_sublet_duration ? `${selectedRequest.max_sublet_duration} months` : "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Co-Approval Required</p>
                          <p className="text-sm text-foreground">{selectedRequest.co_approve_subtenant ? "Yes" : "No"}</p>
                        </div>
                      </div>
                      {selectedRequest.additional_rules && (
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Additional Rules</p>
                          <p className="mt-1 text-sm text-foreground">{selectedRequest.additional_rules}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerSubletRequestsPage;
