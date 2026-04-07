import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, CalendarIcon, Home, Building2, Landmark, SquareStack, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import UniversalPhotoUploader from "@/components/UniversalPhotoUploader";
import UrgentToggle from "@/components/urgent/UrgentToggle";
import { ListingFormData, defaultListingForm } from "@/types/listing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TOTAL_STEPS = 6;

const CreateListingPage = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingFormData>(defaultListingForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editId || null);

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", editId).single();
      if (data) {
        setForm({
          address: data.address || "",
          unit_number: data.unit_number || "",
          property_type: (data.property_type as any) || "",
          bedrooms: data.bedrooms ?? "",
          bathrooms: data.bathrooms ?? "",
          sqft: data.sqft ?? "",
          management_type: data.management_group_id ? "bbg" : "self",
          photos: [],
          photoUrls: (data.photos as string[]) || [],
          headline: data.headline || "",
          description: data.description || "",
          monthly_rent: data.monthly_rent ?? "",
          security_deposit: data.security_deposit ?? "",
          available_from: data.available_from || "",
          available_until: data.available_until || "",
          min_duration: data.min_duration || 1,
          is_urgent: (data as any).is_urgent || false,
          asking_price: (data as any).asking_price ?? "",
          minimum_price: (data as any).minimum_price ?? "",
          urgency_deadline: (data as any).urgency_deadline || "",
          urgency_reason: (data as any).urgency_reason || "",
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
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(partial).forEach((k) => delete next[k]);
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0 && !form.property_type) e.property_type = "Please select a property type";
    if (s === 1 && form.photoUrls.length < 3) e.photos = `Add at least 3 photos (${form.photoUrls.length} uploaded)`;
    if (s === 2) {
      if (!form.headline.trim()) e.headline = "Please add a headline";
      if (!form.description.trim()) e.description = "Please add a description";
    }
    if (s === 3) {
      if (form.monthly_rent === "" || Number(form.monthly_rent) <= 0) e.monthly_rent = "Please enter a valid rent amount";
      if (form.security_deposit === "" || Number(form.security_deposit) < 0) e.security_deposit = "Please enter a valid deposit";
    }
    if (s === 4) {
      if (!form.available_from) e.available_from = "Please select a start date";
      if (!form.available_until) e.available_until = "Please select an end date";
      if (form.available_from && form.available_until && form.available_until <= form.available_from)
        e.available_until = "End date must be after start date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveDraft = async () => {
    if (!user) return;
    const BBG_PM_ID = "d39b883c-0941-4620-96d6-ea588231b58e";
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
      management_group_id: form.management_type === "bbg" ? BBG_PM_ID : null,
      photos: form.photoUrls,
      is_urgent: form.is_urgent,
      asking_price: form.is_urgent && form.asking_price !== "" ? Number(form.asking_price) : null,
      minimum_price: form.is_urgent && form.minimum_price !== "" ? Number(form.minimum_price) : null,
      urgency_deadline: form.is_urgent && form.urgency_deadline ? form.urgency_deadline : null,
      urgency_reason: form.is_urgent && form.urgency_reason ? form.urgency_reason : null,
    } as any;

    if (draftId) {
      await supabase.from("listings").update(payload).eq("id", draftId);
    } else {
      const { data } = await supabase.from("listings").insert(payload).select("id").single();
      if (data) setDraftId(data.id);
    }
  };

  const nextStep = async () => {
    if (!validateStep(step)) return;
    await saveDraft();
    setStep((s) => s + 1);
  };

  const handlePublish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const id = draftId || crypto.randomUUID();
      const BBG_PM_ID = "d39b883c-0941-4620-96d6-ea588231b58e";
      const isManaged = form.management_type === "bbg";
      const newStatus = isManaged ? "pending" : "active";

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
        photos: form.photoUrls,
        status: newStatus as any,
        published_at: isManaged ? null : new Date().toISOString(),
        management_group_id: isManaged ? BBG_PM_ID : null,
        is_urgent: form.is_urgent,
        asking_price: form.is_urgent && form.asking_price !== "" ? Number(form.asking_price) : null,
        minimum_price: form.is_urgent && form.minimum_price !== "" ? Number(form.minimum_price) : null,
        urgency_deadline: form.is_urgent && form.urgency_deadline ? form.urgency_deadline : null,
        urgency_reason: form.is_urgent && form.urgency_reason ? form.urgency_reason : null,
      } as any;

      if (draftId) {
        const { error } = await supabase.from("listings").update(payload).eq("id", draftId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert({ ...payload, id }).select("id").single();
        if (error) throw error;
        setDraftId(id);
      }
      setPublished(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish listing");
    } finally {
      setLoading(false);
    }
  };

  // Published success screen
  if (published) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-[560px] w-full text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-[28px] font-bold text-foreground">Your listing is live</h1>
          <p className="text-[15px] text-muted-foreground">
            {form.headline || "Your apartment"} is now visible to renters. You will be notified when someone is interested.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button className="rounded-full h-12 px-8 text-[15px]" onClick={() => navigate("/tenant/dashboard")}>
              Go to dashboard
            </Button>
            <Button variant="outline" className="rounded-full h-12 px-8 text-[15px]" onClick={() => navigate("/listings")}>
              View listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fromDate = form.available_from ? new Date(form.available_from) : undefined;
  const untilDate = form.available_until ? new Date(form.available_until) : undefined;

  const propertyTypes = [
    { value: "house", label: "House", icon: Home },
    { value: "apartment", label: "Apartment", icon: Building2 },
    { value: "condo", label: "Condo", icon: Landmark },
    { value: "studio", label: "Studio", icon: SquareStack },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-[560px] mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-[15px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <span className="text-[13px] text-muted-foreground">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[560px] mx-auto px-4 py-8 pb-28">

        {/* Step 1: Property Type */}
        {step === 0 && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold text-foreground text-center">What type of place is it?</h1>
            <div className="grid grid-cols-2 gap-4">
              {propertyTypes.map((t) => {
                const Icon = t.icon;
                const selected = form.property_type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => onChange({ property_type: t.value as any })}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 transition-all min-h-[120px]",
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon className={cn("h-8 w-8", selected ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                    <span className={cn("text-[15px] font-medium", selected ? "text-primary" : "text-foreground")}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.property_type && <p className="text-[13px] text-destructive text-center">{errors.property_type}</p>}

            {/* Additional fields for address and rooms */}
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[15px]">Address</Label>
                <Input
                  placeholder="123 Main St, Boston"
                  className="mt-1.5 h-12 text-[16px] rounded-xl"
                  value={form.address}
                  onChange={(e) => onChange({ address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[13px]">Beds</Label>
                  <Input type="number" min={0} className="mt-1 h-12 text-[16px] rounded-xl" value={form.bedrooms} onChange={(e) => onChange({ bedrooms: e.target.value ? Number(e.target.value) : "" })} />
                </div>
                <div>
                  <Label className="text-[13px]">Baths</Label>
                  <Input type="number" min={0} step={0.5} className="mt-1 h-12 text-[16px] rounded-xl" value={form.bathrooms} onChange={(e) => onChange({ bathrooms: e.target.value ? Number(e.target.value) : "" })} />
                </div>
                <div>
                  <Label className="text-[13px]">Sq ft</Label>
                  <Input type="number" min={0} className="mt-1 h-12 text-[16px] rounded-xl" value={form.sqft} onChange={(e) => onChange({ sqft: e.target.value ? Number(e.target.value) : "" })} placeholder="Optional" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold text-foreground text-center">Add photos of your place</h1>
            <p className="text-[15px] text-muted-foreground text-center">Upload at least 3 photos. The first photo will be the cover.</p>
            <UniversalPhotoUploader
              photoUrls={form.photoUrls}
              onPhotoUrlsChange={(urls) => onChange({ photoUrls: urls })}
              bucket="listing-photos"
              storagePath={`listings/${draftId || crypto.randomUUID()}`}
              maxPhotos={15}
              minPhotos={3}
              showCoverBadge
            />
            {errors.photos && <p className="text-[13px] text-destructive text-center">{errors.photos}</p>}
          </div>
        )}

        {/* Step 3: Describe */}
        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold text-foreground text-center">Describe your place</h1>
            <div className="space-y-4">
              <div>
                <Label className="text-[15px]">Headline</Label>
                <Input
                  placeholder="e.g. Sunny 2BR in Back Bay with parking"
                  className="mt-1.5 h-12 text-[16px] rounded-xl"
                  value={form.headline}
                  onChange={(e) => onChange({ headline: e.target.value })}
                />
                {errors.headline && <p className="text-[13px] text-destructive mt-1">{errors.headline}</p>}
              </div>
              <div>
                <Label className="text-[15px]">Description</Label>
                <Textarea
                  placeholder="Tell renters what makes your place special..."
                  className="mt-1.5 min-h-[160px] text-[16px] rounded-xl"
                  value={form.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                />
                {errors.description && <p className="text-[13px] text-destructive mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Price */}
        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold text-foreground text-center">Set your price</h1>
            <div className="space-y-4">
              <div>
                <Label className="text-[15px]">Monthly rent ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="2000"
                  className="mt-1.5 h-14 text-[24px] font-bold text-center rounded-xl"
                  value={form.monthly_rent}
                  onChange={(e) => onChange({ monthly_rent: e.target.value ? Number(e.target.value) : "" })}
                />
                {errors.monthly_rent && <p className="text-[13px] text-destructive mt-1 text-center">{errors.monthly_rent}</p>}
              </div>
              <div>
                <Label className="text-[15px]">Security deposit ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="2000"
                  className="mt-1.5 h-12 text-[16px] rounded-xl"
                  value={form.security_deposit}
                  onChange={(e) => onChange({ security_deposit: e.target.value ? Number(e.target.value) : "" })}
                />
                {errors.security_deposit && <p className="text-[13px] text-destructive mt-1">{errors.security_deposit}</p>}
              </div>

              {/* Urgent toggle */}
              <div className="pt-4">
                <UrgentToggle data={form} onChange={onChange} errors={errors} />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Availability */}
        {step === 4 && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold text-foreground text-center">When is it available?</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[15px]">Available from</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1.5 h-12 text-[16px] rounded-xl justify-start", !fromDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={(d) => d && onChange({ available_from: format(d, "yyyy-MM-dd") })}
                      disabled={(d) => d < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.available_from && <p className="text-[13px] text-destructive mt-1">{errors.available_from}</p>}
              </div>
              <div>
                <Label className="text-[15px]">Available until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1.5 h-12 text-[16px] rounded-xl justify-start", !untilDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {untilDate ? format(untilDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={untilDate}
                      onSelect={(d) => d && onChange({ available_until: format(d, "yyyy-MM-dd") })}
                      disabled={(d) => d < (fromDate || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.available_until && <p className="text-[13px] text-destructive mt-1">{errors.available_until}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review & Publish */}
        {step === 5 && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold text-foreground text-center">Review and publish</h1>
            <p className="text-[15px] text-muted-foreground text-center">Make sure everything looks good before publishing.</p>

            <div className="space-y-4">
              {/* Photo preview */}
              {form.photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden">
                  {form.photoUrls.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <ReviewRow label="Type" value={form.property_type || "Not set"} onEdit={() => setStep(0)} />
                <ReviewRow label="Address" value={form.address || "Not set"} onEdit={() => setStep(0)} />
                <ReviewRow label="Layout" value={`${form.bedrooms || 0} bed, ${form.bathrooms || 0} bath${form.sqft ? `, ${form.sqft} sq ft` : ""}`} onEdit={() => setStep(0)} />
                <ReviewRow label="Headline" value={form.headline || "Not set"} onEdit={() => setStep(2)} />
                <ReviewRow label="Rent" value={form.monthly_rent ? `$${Number(form.monthly_rent).toLocaleString()}/mo` : "Not set"} onEdit={() => setStep(3)} />
                <ReviewRow label="Deposit" value={form.security_deposit ? `$${Number(form.security_deposit).toLocaleString()}` : "Not set"} onEdit={() => setStep(3)} />
                <ReviewRow label="Dates" value={form.available_from && form.available_until ? `${format(new Date(form.available_from), "MMM d")} - ${format(new Date(form.available_until), "MMM d, yyyy")}` : "Not set"} onEdit={() => setStep(4)} />
                {form.is_urgent && (
                  <ReviewRow label="Urgent" value={`Asking $${Number(form.asking_price).toLocaleString()}/mo`} onEdit={() => setStep(3)} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="max-w-[560px] mx-auto px-4 py-3">
          {step < 5 ? (
            <Button className="w-full rounded-full h-12 text-[15px]" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button
              className="w-full rounded-full h-12 text-[15px]"
              onClick={handlePublish}
              disabled={loading}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</> : "Publish listing"}
            </Button>
          )}
        </div>
      </div>

      {/* Delete section for edit mode */}
      {editId && step === 5 && (
        <div className="max-w-[560px] mx-auto px-4 pb-32">
          <DeleteListingSection listingId={editId} headline={form.headline || form.address || "this listing"} />
        </div>
      )}
    </div>
  );
};

const ReviewRow = ({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <div className="min-w-0">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-[15px] text-foreground truncate">{value}</p>
    </div>
    <button onClick={onEdit} className="text-[13px] text-primary hover:underline shrink-0 ml-4">Edit</button>
  </div>
);

const DeleteListingSection = ({ listingId, headline }: { listingId: string; headline: string }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data: activeBookings } = await supabase.from("bookings").select("id").eq("listing_id", listingId).in("status", ["confirmed"]);
      if (activeBookings && activeBookings.length > 0) {
        toast.error("You have an active booking. Please resolve it before deleting.");
        setDeleting(false);
        setOpen(false);
        return;
      }
      const { error } = await supabase.functions.invoke("delete-listing", { body: { listingId } });
      if (error) throw error;
      toast.success("Listing deleted.");
      navigate("/tenant/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete listing.");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="mt-8 pt-6 border-t">
        <Button variant="outline" className="w-full rounded-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete listing
        </Button>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All applications and messages will be removed.
              <span className="mt-2 block font-medium text-foreground">"{headline}"</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateListingPage;
