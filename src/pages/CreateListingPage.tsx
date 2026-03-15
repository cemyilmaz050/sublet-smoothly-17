import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, Home, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import StepProgress from "@/components/StepProgress";
import ListingStep1 from "@/components/listing/ListingStep1";
import ListingStep2 from "@/components/listing/ListingStep2";
import ListingStep3 from "@/components/listing/ListingStep3";
import ListingStep4 from "@/components/listing/ListingStep4";
import ListingStep5 from "@/components/listing/ListingStep5";
import PublishChecklist from "@/components/listing/PublishChecklist";
import PublishSuccess from "@/components/listing/PublishSuccess";
import TenantIdVerification from "@/components/TenantIdVerification";
import { ListingFormData, defaultListingForm } from "@/types/listing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

const STEPS = ["Property Basics", "Photos & Description", "Pricing & Availability", "House Rules", "Review & Submit"];

const CreateListingPage = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingFormData>(defaultListingForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editId || null);
  const [idVerified, setIdVerified] = useState<boolean | null>(null);

  // Check ID verification status
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id_verified").eq("id", user.id).single()
      .then(({ data }) => setIdVerified(data?.id_verified ?? false));
  }, [user]);

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", editId)
        .single();
      if (data) {
        setForm({
          address: data.address || "",
          unit_number: data.unit_number || "",
          property_type: (data.property_type as any) || "",
          bedrooms: data.bedrooms ?? "",
          bathrooms: data.bathrooms ?? "",
          sqft: data.sqft ?? "",
          photos: [],
          photoUrls: (data.photos as string[]) || [],
          headline: data.headline || "",
          description: data.description || "",
          monthly_rent: data.monthly_rent ?? "",
          security_deposit: data.security_deposit ?? "",
          available_from: data.available_from || "",
          available_until: data.available_until || "",
          min_duration: data.min_duration || 1,
          amenities: (data.amenities as string[]) || [],
          house_rules: data.house_rules || "",
          guest_policy: (data.guest_policy as any) || "",
        });
      }
    };
    load();
  }, [editId]);

  const onChange = (partial: Partial<ListingFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    const keys = Object.keys(partial);
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.address.trim()) e.address = "Address is required";
      if (!form.property_type) e.property_type = "Property type is required";
      if (form.bedrooms === "") e.bedrooms = "Required";
      if (form.bathrooms === "") e.bathrooms = "Required";
    } else if (s === 1) {
      const totalPhotos = form.photoUrls.length + form.photos.length;
      if (totalPhotos < 3) e.photos = `At least 3 photos required (${totalPhotos} uploaded)`;
      if (!form.headline.trim()) e.headline = "Headline is required";
      if (!form.description.trim()) e.description = "Description is required";
    } else if (s === 2) {
      if (form.monthly_rent === "" || Number(form.monthly_rent) <= 0) e.monthly_rent = "Enter a valid rent amount";
      if (form.security_deposit === "" || Number(form.security_deposit) < 0) e.security_deposit = "Enter a valid deposit";
      if (!form.available_from) e.available_from = "Start date is required";
      if (!form.available_until) e.available_until = "End date is required";
      if (form.available_from && form.available_until && form.available_until <= form.available_from)
        e.available_until = "Must be after start date";
    } else if (s === 3) {
      if (!form.guest_policy) e.guest_policy = "Guest policy is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadPhotos = async (listingId: string): Promise<string[]> => {
    const urls: string[] = [...form.photoUrls];
    for (const file of form.photos) {
      const ext = file.name.split(".").pop();
      const path = `${listingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("listing-photos").upload(path, file);
      if (error) { console.error("Upload error:", error); continue; }
      const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const saveDraft = async () => {
    if (!user) return;
    const payload = {
      tenant_id: user.id,
      address: form.address || null,
      unit_number: form.unit_number || null,
      property_type: form.property_type || null,
      bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
      bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
      sqft: form.sqft === "" ? null : Number(form.sqft),
      headline: form.headline || null,
      description: form.description || null,
      monthly_rent: form.monthly_rent === "" ? null : Number(form.monthly_rent),
      security_deposit: form.security_deposit === "" ? null : Number(form.security_deposit),
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      min_duration: form.min_duration,
      amenities: form.amenities,
      house_rules: form.house_rules || null,
      guest_policy: form.guest_policy || null,
      status: "draft" as const,
    };

    if (draftId) {
      let photos = form.photoUrls;
      if (form.photos.length > 0) photos = await uploadPhotos(draftId);
      await supabase.from("listings").update({ ...payload, photos }).eq("id", draftId);
    } else {
      const { data } = await supabase.from("listings").insert(payload).select("id").single();
      if (data) {
        setDraftId(data.id);
        if (form.photos.length > 0) {
          const photos = await uploadPhotos(data.id);
          await supabase.from("listings").update({ photos }).eq("id", data.id);
        }
      }
    }
  };

  const nextStep = async () => {
    if (!validateStep(step)) return;
    await saveDraft();
    setStep((s) => s + 1);
  };

  // Publish checklist
  const checklist = PublishChecklist({ data: form, onGoToStep: setStep });

  const handlePublish = async () => {
    if (!confirmed || !user || !checklist.allDone) return;
    setLoading(true);
    try {
      const id = draftId || crypto.randomUUID();
      let photos = form.photoUrls;
      if (form.photos.length > 0) photos = await uploadPhotos(id);

      const payload = {
        tenant_id: user.id,
        address: form.address,
        unit_number: form.unit_number || null,
        property_type: form.property_type || null,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sqft: form.sqft === "" ? null : Number(form.sqft),
        headline: form.headline,
        description: form.description,
        monthly_rent: Number(form.monthly_rent),
        security_deposit: Number(form.security_deposit),
        available_from: form.available_from,
        available_until: form.available_until,
        min_duration: form.min_duration,
        amenities: form.amenities,
        house_rules: form.house_rules || null,
        guest_policy: form.guest_policy || null,
        photos,
        status: "active" as const,
        published_at: new Date().toISOString(),
      };

      if (draftId) {
        const { error } = await supabase.from("listings").update(payload).eq("id", draftId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert({ ...payload, id }).select("id").single();
        if (error) throw error;
        setDraftId(id);
      }

      setPublished(true);

      // Send listing-live email notification
      const publishedId = draftId || id;
      supabase.functions.invoke("send-notification-email", {
        body: {
          to: user.email,
          subject: `Your listing "${form.headline}" is live on SubIn!`,
          type: "listing_live",
          data: {
            listing_title: form.headline,
            action_url: `${window.location.origin}/listings`,
          },
        },
      }).catch(() => {});

      // Notify BBG manager portal
      const BBG_MANAGER_USER_ID = "370d6445-15bc-4802-8626-1507c38fbdd4";
      supabase.from("notifications").insert({
        user_id: BBG_MANAGER_USER_ID,
        title: "New Listing Published",
        message: `A new listing "${form.headline}" at ${form.address} has been published and needs review.`,
        type: "listing",
        link: "/manager",
      }).then(() => {});

    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err.message || "Failed to publish listing");
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    return (
      <PublishSuccess
        listingId={draftId || ""}
        headline={form.headline}
        onDashboard={() => navigate("/tenant/dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container max-w-2xl py-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{editId ? "Edit Listing" : "Create New Listing"}</h1>
        <p className="mb-6 text-muted-foreground">Fill in the details about your property</p>

        <Card className="mb-6 shadow-card">
          <CardContent className="py-6">
            <StepProgress steps={STEPS} currentStep={step} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            {step === 0 && <ListingStep1 data={form} onChange={onChange} errors={errors} />}
            {step === 1 && <ListingStep2 data={form} onChange={onChange} errors={errors} />}
            {step === 2 && <ListingStep3 data={form} onChange={onChange} errors={errors} />}
            {step === 3 && <ListingStep4 data={form} onChange={onChange} errors={errors} />}
            {step === 4 && (
              <>
                <ListingStep5 data={form} confirmed={confirmed} onConfirmChange={setConfirmed} onGoToStep={setStep} />
                <div className="mt-6">
                  {checklist.ChecklistUI}
                </div>
                {/* ID Verification gate — must verify before publishing */}
                {idVerified === false && (
                  <div className="mt-6">
                    <TenantIdVerification idVerified={false} onVerified={() => setIdVerified(true)} />
                  </div>
                )}
              </>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={() => step === 0 ? navigate(-1) : setStep((s) => s - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                {step === 0 ? "Cancel" : "Back"}
              </Button>
              {step < 4 ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={!confirmed || loading || !checklist.allDone || idVerified === false}
                  className="bg-primary text-primary-foreground"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Home className="mr-2 h-4 w-4" />
                      Publish Your Property
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateListingPage;
