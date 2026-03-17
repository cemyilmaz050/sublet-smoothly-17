import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BBGSubletApplicationForm, { type SubletApplicationData } from "@/components/documents/BBGSubletApplicationForm";
import BBGGuarantyOfLeaseForm, { type GuarantyData } from "@/components/documents/BBGGuarantyOfLeaseForm";

export default function BBGDocumentFillingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const packageId = searchParams.get("package");
  const listingId = searchParams.get("listing");

  const [docStep, setDocStep] = useState<1 | 2>(1);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listing + profile data for auto-fill
  const [listing, setListing] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [appData, setAppData] = useState<Partial<SubletApplicationData>>({});
  const [guarantyData, setGuarantyData] = useState<Partial<GuarantyData>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [guarantyId, setGuarantyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, packageId, listingId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load profile
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      setProfile(prof);

      // Load listing if provided
      if (listingId) {
        const { data: lst } = await supabase.from("listings").select("*").eq("id", listingId).single();
        setListing(lst);
      }

      // Load existing application if any
      const appQ = supabase.from("bbg_sublet_applications").select("*").eq("applicant_id", user!.id);
      if (listingId) appQ.eq("listing_id", listingId);
      const { data: existingApps } = await appQ.order("created_at", { ascending: false }).limit(1);
      if (existingApps?.length) {
        setAppData(existingApps[0] as any);
        setApplicationId(existingApps[0].id);
        if (existingApps[0].status === "completed") setDocStep(2);
      }

      // Load existing guaranty if any
      const gQ = supabase.from("bbg_guaranty_of_lease").select("*").eq("applicant_id", user!.id);
      if (listingId) gQ.eq("listing_id", listingId);
      const { data: existingGuaranty } = await gQ.order("created_at", { ascending: false }).limit(1);
      if (existingGuaranty?.length) {
        setGuarantyData(existingGuaranty[0] as any);
        setGuarantyId(existingGuaranty[0].id);
        if (existingGuaranty[0].status === "completed" && existingApps?.[0]?.status === "completed") {
          setCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function saveApplication(data: SubletApplicationData) {
    setSaving(true);
    try {
      const payload = { ...data, applicant_id: user!.id, listing_id: listingId, status: "in_progress" };
      if (applicationId) {
        await supabase.from("bbg_sublet_applications").update(payload).eq("id", applicationId);
      } else {
        const { data: inserted } = await supabase.from("bbg_sublet_applications").insert(payload).select("id").single();
        if (inserted) setApplicationId(inserted.id);
      }
      toast.success("Progress saved");
    } catch (e) {
      toast.error("Failed to save");
    }
    setSaving(false);
  }

  async function submitApplication(data: SubletApplicationData) {
    setSaving(true);
    try {
      const payload = { ...data, applicant_id: user!.id, listing_id: listingId, status: "completed", signed_at: new Date().toISOString(), completed_at: new Date().toISOString() };
      if (applicationId) {
        await supabase.from("bbg_sublet_applications").update(payload).eq("id", applicationId);
      } else {
        const { data: inserted } = await supabase.from("bbg_sublet_applications").insert(payload).select("id").single();
        if (inserted) setApplicationId(inserted.id);
      }
      // Update package status
      if (packageId) {
        await supabase.from("bbg_document_packages").update({ overall_status: "partially_complete" }).eq("id", packageId);
      }
      toast.success("Sublet Application submitted!");
      setDocStep(2);
    } catch (e) {
      toast.error("Failed to submit");
    }
    setSaving(false);
  }

  async function saveGuaranty(data: GuarantyData) {
    setSaving(true);
    try {
      const payload = { ...data, applicant_id: user!.id, listing_id: listingId, status: "in_progress" };
      if (guarantyId) {
        await supabase.from("bbg_guaranty_of_lease").update(payload).eq("id", guarantyId);
      } else {
        const { data: inserted } = await supabase.from("bbg_guaranty_of_lease").insert(payload).select("id").single();
        if (inserted) setGuarantyId(inserted.id);
      }
      toast.success("Progress saved");
    } catch (e) {
      toast.error("Failed to save");
    }
    setSaving(false);
  }

  async function submitGuaranty(data: GuarantyData) {
    setSaving(true);
    try {
      const payload = { ...data, applicant_id: user!.id, listing_id: listingId, status: "completed", signed_at: new Date().toISOString(), completed_at: new Date().toISOString() };
      if (guarantyId) {
        await supabase.from("bbg_guaranty_of_lease").update(payload).eq("id", guarantyId);
      } else {
        const { data: inserted } = await supabase.from("bbg_guaranty_of_lease").insert(payload).select("id").single();
        if (inserted) setGuarantyId(inserted.id);
      }
      // Update package
      if (packageId) {
        await supabase.from("bbg_document_packages").update({ overall_status: "fully_complete" }).eq("id", packageId);
      }
      toast.success("Guaranty of Lease submitted!");
      setCompleted(true);
    } catch (e) {
      toast.error("Failed to submit");
    }
    setSaving(false);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to complete your documents.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading your documents...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Documents Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Your documents have been submitted to Boston Brokerage Group. You will hear back within 24 hours.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const autoFillApp: Partial<SubletApplicationData> = {
    ...appData,
    full_name: appData.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
    phone: appData.phone || profile?.phone || "",
    email: appData.email || (user?.email ?? ""),
  };

  const autoFillGuaranty: Partial<GuarantyData> = {
    ...guarantyData,
    lessee_name: guarantyData.lessee_name || autoFillApp.full_name || "",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">BBG Subletting Documents</h1>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => setDocStep(1)} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${docStep === 1 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Step 1: Sublet Application
            </button>
            <button onClick={() => setDocStep(2)} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${docStep === 2 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Step 2: Guaranty of Lease
            </button>
          </div>
          <Progress value={docStep === 1 ? 25 : 75} className="h-1.5" />
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            All information is encrypted and only shared with your property manager
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {listing && (
          <div className="mb-6 rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{listing.address}{listing.unit_number ? `, Unit ${listing.unit_number}` : ""}</p>
            {listing.monthly_rent && <p className="text-xs text-muted-foreground">${listing.monthly_rent}/month</p>}
          </div>
        )}

        {docStep === 1 ? (
          <BBGSubletApplicationForm
            initialData={autoFillApp}
            listingAddress={listing?.address}
            listingUnit={listing?.unit_number}
            listingCity={listing?.address?.split(",").slice(-2, -1)[0]?.trim()}
            listingRent={listing?.monthly_rent}
            onSave={saveApplication}
            onSubmit={submitApplication}
            saving={saving}
          />
        ) : (
          <BBGGuarantyOfLeaseForm
            initialData={autoFillGuaranty}
            listingAddress={listing?.address}
            listingUnit={listing?.unit_number}
            listingCity={listing?.address?.split(",").slice(-2, -1)[0]?.trim()}
            lesseeName={autoFillApp.full_name}
            onSave={saveGuaranty}
            onSubmit={submitGuaranty}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
