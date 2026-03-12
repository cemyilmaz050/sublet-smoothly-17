import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  Loader2,
  Camera,
  User,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STEPS = ["Photo ID", "Application Form", "Co-Signer Info"];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE_10MB = 10 * 1024 * 1024;
const MAX_FILE_SIZE_20MB = 20 * 1024 * 1024;

const RELATIONSHIPS = [
  "Parent",
  "Spouse or Partner",
  "Sibling",
  "Friend",
  "Employer",
  "Other",
];

const EMPLOYMENT_STATUSES = [
  "Employed Full Time",
  "Employed Part Time",
  "Self Employed",
  "Retired",
  "Other",
];

interface UploadedFile {
  file: File;
  preview: string;
  url?: string;
}

const TenantOnboardingPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [frontId, setFrontId] = useState<UploadedFile | null>(null);
  const [backId, setBackId] = useState<UploadedFile | null>(null);
  const [idConfirmed, setIdConfirmed] = useState(false);

  // Step 2 state
  const [applicationForm, setApplicationForm] = useState<UploadedFile | null>(null);
  const [appFormConfirmed, setAppFormConfirmed] = useState(false);

  // Step 3 state
  const [cosignerName, setCosignerName] = useState("");
  const [cosignerRelationship, setCosignerRelationship] = useState("");
  const [cosignerEmail, setCosignerEmail] = useState("");
  const [cosignerPhone, setCosignerPhone] = useState("");
  const [cosignerStreet, setCosignerStreet] = useState("");
  const [cosignerCity, setCosignerCity] = useState("");
  const [cosignerState, setCosignerState] = useState("");
  const [cosignerZip, setCosignerZip] = useState("");
  const [cosignerEmployment, setCosignerEmployment] = useState("");
  const [cosignerIncome, setCosignerIncome] = useState("");
  const [cosignerDoc, setCosignerDoc] = useState<UploadedFile | null>(null);
  const [cosignerConfirmed, setCosignerConfirmed] = useState(false);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const appRef = useRef<HTMLInputElement>(null);
  const cosignerDocRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: (f: UploadedFile | null) => void,
      maxSize: number,
      acceptedTypes: string[]
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`Invalid file type. Accepted: ${acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`);
        return;
      }
      if (file.size > maxSize) {
        toast.error(`File too large. Maximum ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      setter({ file, preview });
    },
    []
  );

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("tenant-documents")
      .upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("tenant-documents")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const step1Valid = frontId && idConfirmed;
  const step2Valid = applicationForm && appFormConfirmed;
  const step3Valid =
    cosignerName &&
    cosignerRelationship &&
    cosignerEmail &&
    cosignerPhone &&
    cosignerConfirmed;

  const handleSubmit = async () => {
    if (!user || !step3Valid || !frontId || !applicationForm) return;
    setSubmitting(true);
    try {
      // Upload all files
      const frontUrl = await uploadFile(frontId.file, "photo-id");
      let backUrl: string | null = null;
      if (backId) {
        backUrl = await uploadFile(backId.file, "photo-id");
      }
      const appFormUrl = await uploadFile(applicationForm.file, "application-form");
      let cosignerDocUrl: string | null = null;
      if (cosignerDoc) {
        cosignerDocUrl = await uploadFile(cosignerDoc.file, "cosigner-docs");
      }

      // Save documents to tenant_documents
      const docs = [
        { document_type: "photo_id_front", file_url: frontUrl, file_name: frontId.file.name, file_size: frontId.file.size },
        ...(backUrl ? [{ document_type: "photo_id_back", file_url: backUrl, file_name: backId!.file.name, file_size: backId!.file.size }] : []),
        { document_type: "application_form", file_url: appFormUrl, file_name: applicationForm.file.name, file_size: applicationForm.file.size },
        ...(cosignerDocUrl && cosignerDoc ? [{ document_type: "cosigner_document", file_url: cosignerDocUrl, file_name: cosignerDoc.file.name, file_size: cosignerDoc.file.size }] : []),
      ].map((d) => ({ ...d, tenant_id: user.id }));

      const { error: docError } = await supabase
        .from("tenant_documents" as any)
        .insert(docs as any);
      if (docError) throw docError;

      // Save cosigner
      const cosignerAddress = [cosignerStreet, cosignerCity, cosignerState, cosignerZip].filter(Boolean).join(", ");
      const { error: cosignerError } = await supabase
        .from("cosigners" as any)
        .insert({
          tenant_id: user.id,
          full_name: cosignerName,
          relationship: cosignerRelationship,
          email: cosignerEmail,
          phone: cosignerPhone,
          address: cosignerAddress || null,
          employment_status: cosignerEmployment || null,
          monthly_income: cosignerIncome ? parseFloat(cosignerIncome) : null,
          document_url: cosignerDocUrl,
        } as any);
      if (cosignerError) throw cosignerError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true, documents_status: "pending_review" } as any)
        .eq("id", user.id);
      if (profileError) throw profileError;

      // Send co-signer email via edge function
      try {
        await supabase.functions.invoke("send-cosigner-email", {
          body: { cosignerEmail, cosignerName, tenantId: user.id },
        });
      } catch (emailErr) {
        console.warn("Co-signer email could not be sent:", emailErr);
      }

      // Refresh auth context so route guard allows dashboard access
      await refreshProfile();

      toast.success("Documents submitted successfully! Your documents are under review.");
      navigate("/dashboard/tenant");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit documents");
    } finally {
      setSubmitting(false);
    }
  };

  const DropZone = ({
    label,
    sublabel,
    file,
    onRemove,
    inputRef,
    onSelect,
    accept,
    maxSize,
  }: {
    label: string;
    sublabel?: string;
    file: UploadedFile | null;
    onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept: string;
    maxSize: string;
  }) => (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
        file ? "border-emerald bg-emerald/5" : "border-border hover:border-primary/50 hover:bg-accent/30"
      }`}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onSelect}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2 w-full">
          {file.preview ? (
            <img src={file.preview} alt="" className="h-20 w-20 rounded-lg object-cover" />
          ) : (
            <FileText className="h-12 w-12 text-emerald" />
          )}
          <p className="text-sm font-medium text-foreground truncate max-w-full">{file.file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.file.size / 1024).toFixed(0)} KB</p>
          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm text-foreground">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
          <p className="text-xs text-muted-foreground mt-1">Max {maxSize}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo header */}
      <div className="flex items-center justify-center py-6 border-b border-border">
        <span className="text-2xl font-bold text-primary">SubletSmoothly</span>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Info banner */}
          <div className="mb-6 rounded-xl bg-accent/60 border border-primary/20 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              Before you can list or manage your sublet, your property manager requires the following documents. This is a one-time step.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    i <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i < currentStep
                        ? "bg-primary text-primary-foreground"
                        : i === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{step}</span>
                </div>
              ))}
            </div>
            <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
          </div>

          <Card className="shadow-elevated">
            <CardContent className="p-6 sm:p-8">
              {/* Step 1: Photo ID */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      Upload Your Photo ID
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please upload a clear photo of a government-issued ID such as a passport, driver's license, or state ID.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Front of ID *</Label>
                      <DropZone
                        label="Drag & drop or click to upload"
                        file={frontId}
                        onRemove={() => setFrontId(null)}
                        inputRef={frontRef as React.RefObject<HTMLInputElement>}
                        onSelect={(e) => handleFileSelect(e, setFrontId, MAX_FILE_SIZE_10MB, ACCEPTED_IMAGE_TYPES)}
                        accept=".jpg,.jpeg,.png,.pdf"
                        maxSize="10MB"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Back of ID</Label>
                      <DropZone
                        label="Drag & drop or click to upload"
                        sublabel="Not required for passports"
                        file={backId}
                        onRemove={() => setBackId(null)}
                        inputRef={backRef as React.RefObject<HTMLInputElement>}
                        onSelect={(e) => handleFileSelect(e, setBackId, MAX_FILE_SIZE_10MB, ACCEPTED_IMAGE_TYPES)}
                        accept=".jpg,.jpeg,.png,.pdf"
                        maxSize="10MB"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, or PDF. Maximum 10MB per file.</p>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="id-confirm"
                      checked={idConfirmed}
                      onCheckedChange={(v) => setIdConfirmed(v === true)}
                    />
                    <Label htmlFor="id-confirm" className="text-sm leading-snug cursor-pointer">
                      I confirm this is a valid, unexpired government-issued ID belonging to me
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 2: Application Form */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Upload Your Completed Application Form
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please upload the fully completed rental application form provided by your property manager. Make sure all fields are filled in and the form is signed before uploading.
                    </p>
                  </div>

                  <Button variant="outline" className="gap-2" onClick={() => toast.info("Application form template download coming soon")}>
                    <Download className="h-4 w-4" />
                    Download Blank Application Form
                  </Button>

                  <DropZone
                    label="Upload completed application form (PDF only)"
                    file={applicationForm}
                    onRemove={() => setApplicationForm(null)}
                    inputRef={appRef as React.RefObject<HTMLInputElement>}
                    onSelect={(e) => handleFileSelect(e, setApplicationForm, MAX_FILE_SIZE_20MB, ["application/pdf"])}
                    accept=".pdf"
                    maxSize="20MB"
                  />

                  {applicationForm && (
                    <div className="flex items-center gap-2 text-sm text-emerald">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{applicationForm.file.name}</span>
                      <span className="text-muted-foreground">({(applicationForm.file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="app-confirm"
                      checked={appFormConfirmed}
                      onCheckedChange={(v) => setAppFormConfirmed(v === true)}
                    />
                    <Label htmlFor="app-confirm" className="text-sm leading-snug cursor-pointer">
                      I confirm this application form is fully completed and signed
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 3: Co-Signer Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Co-Signer Information
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      A co-signer is required to guarantee your sublet. Please provide their details below. Your co-signer will receive an email to confirm their role.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="cs-name">Full Legal Name *</Label>
                      <Input id="cs-name" value={cosignerName} onChange={(e) => setCosignerName(e.target.value)} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <Label>Relationship to Tenant *</Label>
                      <Select value={cosignerRelationship} onValueChange={setCosignerRelationship}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIPS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cs-email">Email Address *</Label>
                      <Input id="cs-email" type="email" value={cosignerEmail} onChange={(e) => setCosignerEmail(e.target.value)} placeholder="jane@example.com" />
                    </div>
                    <div>
                      <Label htmlFor="cs-phone">Phone Number *</Label>
                      <Input id="cs-phone" type="tel" value={cosignerPhone} onChange={(e) => setCosignerPhone(e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="cs-street">Street Address</Label>
                      <Input id="cs-street" value={cosignerStreet} onChange={(e) => setCosignerStreet(e.target.value)} placeholder="123 Main St" />
                    </div>
                    <div>
                      <Label htmlFor="cs-city">City</Label>
                      <Input id="cs-city" value={cosignerCity} onChange={(e) => setCosignerCity(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="cs-state">State</Label>
                      <Input id="cs-state" value={cosignerState} onChange={(e) => setCosignerState(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="cs-zip">Zip Code</Label>
                      <Input id="cs-zip" value={cosignerZip} onChange={(e) => setCosignerZip(e.target.value)} />
                    </div>
                    <div>
                      <Label>Employment Status</Label>
                      <Select value={cosignerEmployment} onValueChange={setCosignerEmployment}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cs-income">Monthly Income</Label>
                      <Input id="cs-income" type="number" value={cosignerIncome} onChange={(e) => setCosignerIncome(e.target.value)} placeholder="5000" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Co-signer supporting document (optional but recommended)</Label>
                    <DropZone
                      label="Upload co-signer ID or proof of income"
                      file={cosignerDoc}
                      onRemove={() => setCosignerDoc(null)}
                      inputRef={cosignerDocRef as React.RefObject<HTMLInputElement>}
                      onSelect={(e) => handleFileSelect(e, setCosignerDoc, MAX_FILE_SIZE_10MB, ACCEPTED_IMAGE_TYPES)}
                      accept=".jpg,.jpeg,.png,.pdf"
                      maxSize="10MB"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="cs-confirm"
                      checked={cosignerConfirmed}
                      onCheckedChange={(v) => setCosignerConfirmed(v === true)}
                    />
                    <Label htmlFor="cs-confirm" className="text-sm leading-snug cursor-pointer">
                      I confirm I have permission to provide this person's information and they have agreed to act as my co-signer
                    </Label>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                {currentStep < 2 ? (
                  <Button
                    onClick={() => setCurrentStep((s) => s + 1)}
                    disabled={currentStep === 0 ? !step1Valid : !step2Valid}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!step3Valid || submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Documents"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TenantOnboardingPage;
