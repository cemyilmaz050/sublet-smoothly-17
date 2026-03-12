import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface DocStatus {
  type: string;
  status: string;
  reviewComment?: string | null;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <Badge variant="default" className="bg-emerald text-emerald-foreground gap-1">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
  }
};

const docLabel = (type: string) => {
  switch (type) {
    case "photo_id_front":
    case "photo_id_back":
      return "Photo ID";
    case "application_form":
      return "Application Form";
    case "cosigner_document":
      return "Co-Signer Document";
    default:
      return type;
  }
};

const DocumentReviewStatusCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocStatus[]>([]);
  const [cosignerStatus, setCosignerStatus] = useState<string>("pending");
  const [overallStatus, setOverallStatus] = useState<string>("pending_review");
  const [rejectedDocs, setRejectedDocs] = useState<DocStatus[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const { data: docData } = await supabase
        .from("tenant_documents" as any)
        .select("document_type, status, review_comment")
        .eq("tenant_id", user.id) as any;

      const { data: cosignerData } = await supabase
        .from("cosigners" as any)
        .select("confirmation_status")
        .eq("tenant_id", user.id)
        .limit(1) as any;

      const { data: profile } = await supabase
        .from("profiles")
        .select("documents_status")
        .eq("id", user.id)
        .single() as any;

      if (docData) {
        // Deduplicate by type, showing worst status
        const grouped: Record<string, DocStatus> = {};
        for (const d of docData) {
          const key = d.document_type.startsWith("photo_id") ? "photo_id" : d.document_type;
          if (!grouped[key] || d.status === "rejected") {
            grouped[key] = { type: key, status: d.status, reviewComment: d.review_comment };
          }
        }
        const docList = Object.values(grouped);
        setDocs(docList);
        setRejectedDocs(docList.filter((d) => d.status === "rejected"));
      }

      if (cosignerData?.[0]) {
        setCosignerStatus(cosignerData[0].confirmation_status);
      }

      if (profile) {
        setOverallStatus((profile as any).documents_status || "pending_review");
      }
    };
    fetchStatus();
  }, [user]);

  if (overallStatus === "approved" || docs.length === 0) return null;

  return (
    <Card className="mb-6 border-primary/30 shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Document Review Status</h3>
            <p className="text-sm text-muted-foreground">
              {overallStatus === "rejected"
                ? "Some documents need to be re-uploaded."
                : "Your documents are under review. This usually takes 1–2 business days."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">Photo ID</span>
            {statusBadge(docs.find((d) => d.type === "photo_id")?.status || "pending")}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">Application Form</span>
            {statusBadge(docs.find((d) => d.type === "application_form")?.status || "pending")}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">Co-Signer</span>
            {statusBadge(cosignerStatus)}
          </div>
        </div>

        {rejectedDocs.length > 0 && (
          <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm font-medium text-destructive mb-2">Documents need attention:</p>
            {rejectedDocs.map((d) => (
              <p key={d.type} className="text-sm text-muted-foreground">
                {docLabel(d.type)}: {d.reviewComment || "Rejected by manager"}
              </p>
            ))}
            <Button
              size="sm"
              variant="destructive"
              className="mt-2"
              onClick={() => navigate("/tenant/onboarding")}
            >
              Re-upload Documents
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentReviewStatusCard;
