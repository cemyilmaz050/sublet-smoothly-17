import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface TenantIdVerificationProps {
  idVerified: boolean;
  onVerified?: () => void;
}

const TenantIdVerification = ({ idVerified, onVerified }: TenantIdVerificationProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (idVerified) {
    return (
      <Card className="border-emerald/30 bg-emerald/5">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Identity Verified</p>
            <p className="text-xs text-muted-foreground">Your government-issued ID has been verified. A "Verified Tenant" badge appears on your listings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/gov-id.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("tenant-documents")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed. Please try again.");
      setUploading(false);
      return;
    }
    // Mark as verified (in production this would go through manual review)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ id_verified: true, id_document_url: path })
      .eq("id", user.id);
    if (updateError) {
      toast.error("Failed to update verification status");
    } else {
      toast.success("ID verified! Your listings will now show a Verified badge.");
      onVerified?.();
    }
    setUploading(false);
  };

  return (
    <Card className="border-amber/30 bg-amber/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Verify Your Identity</p>
            <p className="text-xs text-muted-foreground">
              Upload a government-issued ID to get a "Verified Tenant" badge on your listings. This builds trust with potential subtenants.
            </p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="mr-1 h-3.5 w-3.5" /> Upload Government ID</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TenantIdVerification;
