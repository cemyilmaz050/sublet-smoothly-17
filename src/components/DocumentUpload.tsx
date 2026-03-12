import { Upload, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  label: string;
  description?: string;
  status?: "pending" | "approved" | "rejected" | "empty";
  fileName?: string;
  onUpload?: () => void;
}

const statusConfig = {
  pending: { badge: "pending" as const, label: "Pending", icon: Clock },
  approved: { badge: "approved" as const, label: "Approved", icon: CheckCircle2 },
  rejected: { badge: "rejected" as const, label: "Rejected", icon: XCircle },
  empty: { badge: "secondary" as const, label: "Required", icon: Upload },
};

const DocumentUpload = ({ label, description, status = "empty", fileName, onUpload }: DocumentUploadProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      onClick={onUpload}
      className={cn(
        "group cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all hover:border-primary hover:bg-accent/50",
        status === "empty" ? "border-muted" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              status === "approved" ? "bg-emerald/10" : status === "rejected" ? "bg-destructive/10" : "bg-accent"
            )}
          >
            {fileName ? (
              <FileText className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{label}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            {fileName && <p className="mt-1 text-sm text-muted-foreground">{fileName}</p>}
          </div>
        </div>
        <Badge variant={config.badge}>
          <Icon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </div>
    </div>
  );
};

export default DocumentUpload;
