import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import StripeIdVerification from "./StripeIdVerification";

interface TenantIdVerificationProps {
  idVerified: boolean;
  onVerified?: () => void;
}

const TenantIdVerification = ({ idVerified, onVerified }: TenantIdVerificationProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (idVerified) {
    return (
      <Card className="border-emerald/30 bg-emerald/5">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald" />
          <div>
            <p className="text-sm font-semibold text-foreground">Identity Verified</p>
            <p className="text-xs text-muted-foreground">Your government-issued ID has been verified.</p>
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
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ id_document_url: path } as any)
      .eq("id", user.id);
    if (updateError) {
      toast.error("Failed to save document");
    } else {
      toast.success("Document uploaded! It will be reviewed manually.");
      onVerified?.();
    }
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      {/* Primary: Stripe Identity */}
      <StripeIdVerification idVerified={false} onVerified={onVerified} />

      {/* Fallback: Manual upload */}
      {!showManual ? (
        <button
          onClick={() => setShowManual(true)}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Having trouble? Upload your ID manually instead
        </button>
      ) : (
        <Card className="border-muted">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
              <div>
                <p className="text-sm font-semibold text-foreground">Manual Upload</p>
                <p className="text-xs text-muted-foreground">
                  Upload a photo of your government-issued ID for manual review. This may take 1-2 business days.
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
      )}
    </div>
  );
};

export default TenantIdVerification;
