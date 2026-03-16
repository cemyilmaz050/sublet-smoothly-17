import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Building2, Key, Home, Building, Landmark, Hotel, Lock, BedDouble, Check, CheckCircle, Loader2, Minus, Plus, MapPin, Wifi, Sofa, Snowflake, Flame, Car, PawPrint, WashingMachine, Tv, CookingPot, Dumbbell, ArrowUpDown, Accessibility, icons } from "lucide-react";
import TenantIdVerification from "@/components/TenantIdVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import CompletedStepBar from "./CompletedStepBar";
import CalendarRangePicker from "./CalendarRangePicker";
import PhotoUploader from "./PhotoUploader";
import { SubletFlowData, defaultFlowData, AMENITIES_OPTIONS } from "./types";

interface SubletFlowOverlayProps {
  open: boolean;
  onClose: () => void;
}

// Step IDs for each path
const PATH_A_STEPS = ["path-select", "mgmt-search", "mgmt-property", "mgmt-dates"] as const;
const PATH_B_STEPS = ["path-select", "own-type", "own-space", "own-location", "own-describe", "own-details", "own-amenities", "own-photos", "own-pricing", "own-dates", "own-rules", "own-review"] as const;

const SubletFlowOverlay = ({ open, onClose }: SubletFlowOverlayProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SubletFlowData>({ ...defaultFlowData });
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [mgmtSearch, setMgmtSearch] = useState("");
  const [mgmtResults, setMgmtResults] = useState<any[]>([]);
  const [catalogProperties, setCatalogProperties] = useState<any[]>([]);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [catalogUnits, setCatalogUnits] = useState<Record<string, any[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [idVerified, setIdVerified] = useState<boolean | null>(null);

  // Check ID verification on mount
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id_verified").eq("id", user.id).single()
      .then(({ data: p }) => setIdVerified(p?.id_verified ?? false));
  }, [user]);

  const update = useCallback((partial: Partial<SubletFlowData>) => setData((p) => ({ ...p, ...partial })), []);

  const steps = data.path === "management" ? PATH_A_STEPS : data.path === "own" ? PATH_B_STEPS : ["path-select"] as const;
  const totalSteps = steps.length;
  const progressPct = Math.min(100, ((activeStep + 1) / totalSteps) * 100);

  // Scroll to step when activeStep changes
  useEffect(() => {
    const stepId = steps[activeStep];
    if (stepId && stepRefs.current[stepId]) {
      setTimeout(() => {
        stepRefs.current[stepId]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [activeStep, steps]);

  // Search management groups
  useEffect(() => {
    if (!mgmtSearch.trim() || data.path !== "management") {
      setMgmtResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: results } = await supabase
        .from("property_managers_public")
        .select("*")
        .ilike("name", `%${mgmtSearch}%`)
        .limit(10);
      setMgmtResults(results || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [mgmtSearch, data.path]);

  // Load catalog properties when a management group is selected
  useEffect(() => {
    if (!data.managementGroupId) return;
    supabase
      .from("catalog_properties")
      .select("*")
      .eq("manager_id", data.managementGroupId)
      .then(({ data: props }) => setCatalogProperties(props || []));
  }, [data.managementGroupId]);

  // Load catalog units when a property is expanded
  const loadUnits = async (propertyId: string) => {
    if (catalogUnits[propertyId]) return;
    const { data: units } = await supabase
      .from("catalog_units")
      .select("*")
      .eq("property_id", propertyId);
    setCatalogUnits((prev) => ({ ...prev, [propertyId]: units || [] }));
  };

  const revealNext = () => {
    if (activeStep < totalSteps - 1) {
      setActiveStep((s) => s + 1);
    }
  };

  const editStep = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  const handleClose = () => {
    setData({ ...defaultFlowData });
    setActiveStep(0);
    setShowSuccess(false);
    setSaving(false);
    onClose();
  };

  const fireConfetti = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#7c3aed", "#a78bfa", "#c4b5fd", "#34d399", "#fbbf24"] });
  };

  // PUBLISH - Path A (managed)
  const publishPathA = async () => {
    if (!user) { toast.error("Please sign in first."); return; }
    setSaving(true);
    try {
      const payload: any = {
        tenant_id: user.id,
        path: "management",
        management_group_id: data.managementGroupId,
        catalog_unit_id: data.catalogUnitId,
        address: data.catalogPropertyAddress,
        unit_number: data.catalogUnitNumber,
        bedrooms: data.catalogUnitBedrooms || null,
        bathrooms: data.catalogUnitBathrooms || null,
        sqft: data.catalogUnitSqft || null,
        photos: data.catalogUnitPhotos,
        description: data.catalogUnitDescription || null,
        amenities: data.catalogUnitAmenities,
        available_from: data.availableFrom,
        available_until: data.availableUntil,
        min_duration: data.minDuration,
        source: "management_catalog",
        status: "pending" as const,
      };
      const { error } = await supabase.from("listings").insert(payload);
      if (error) throw error;

      // Send notification to BBG staff user if BBG is the management group
      const BBG_PM_ID = "d39b883c-0941-4620-96d6-ea588231b58e";
      const BBG_USER_ID = "370d6445-15bc-4802-8626-1507c38fbdd4";
      const notifUserId = data.managementGroupId === BBG_PM_ID ? BBG_USER_ID : data.managementGroupId;
      await supabase.from("notifications").insert({
        user_id: notifUserId,
        title: "New Sublet Request",
        message: `${user.user_metadata?.first_name || "A tenant"} submitted a sublet request for Unit ${data.catalogUnitNumber} at ${data.catalogPropertyAddress}`,
        type: "sublet_request",
        link: "/manager/listings",
      }).then(() => {});

      setSuccessMessage(`Your sublet request has been sent to ${data.managementGroupName}!`);
      setShowSuccess(true);
      fireConfetti();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish.");
    } finally {
      setSaving(false);
    }
  };

  // PUBLISH - Path B (own property)
  const publishPathB = async () => {
    if (!user) { toast.error("Please sign in first."); return; }
    setSaving(true);
    try {
      // Upload photos
      const uploadedUrls: string[] = [...data.photoUrls];
      for (const file of data.photos) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const propertyTypeMap: Record<string, string> = { house: "house", apartment: "apartment", condo: "condo", studio: "studio" };
      const guestPolicyMap: Record<string, string> = { no_guests: "no_guests", occasional: "occasional_guests", welcome: "guests_allowed" };

      const payload: any = {
        tenant_id: user.id,
        path: "own",
        space_type: data.spaceType || null,
        property_type: (propertyTypeMap[data.propertyType] || null) as any,
        address: `${data.address}${data.unitNumber ? `, ${data.unitNumber}` : ""}, ${data.city}, ${data.state} ${data.zip}, ${data.country}`,
        unit_number: data.unitNumber || null,
        headline: data.headline || null,
        description: data.description || null,
        bedrooms: data.bedrooms !== "" ? data.bedrooms : null,
        bathrooms: data.bathrooms !== "" ? data.bathrooms : null,
        sqft: data.sqft !== "" ? data.sqft : null,
        amenities: data.amenities,
        photos: uploadedUrls,
        monthly_rent: data.monthlyRent !== "" ? data.monthlyRent : null,
        security_deposit: data.securityDeposit !== "" ? data.securityDeposit : null,
        available_from: data.availableFrom,
        available_until: data.availableUntil,
        min_duration: data.minDuration,
        guest_policy: (guestPolicyMap[data.guestPolicy] || null) as any,
        house_rules: [
          data.houseRules.noSmoking && "No smoking",
          data.houseRules.noPets && "No pets",
          data.houseRules.noParties && "No parties or events",
          data.houseRules.noUnregisteredGuests && "No unregistered guests overnight",
          data.houseRules.quietHours && "Quiet hours after 10pm",
          data.customRules,
        ].filter(Boolean).join("; ") || null,
        status: "active" as const,
        published_at: new Date().toISOString(),
        source: "manual",
      };

      const { error } = await supabase.from("listings").insert(payload);
      if (error) throw error;

      setSuccessMessage("Your property is live!");
      setShowSuccess(true);
      fireConfetti();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Success screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
        <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="flex flex-col items-center gap-4 text-center px-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{successMessage}</h1>
          <p className="text-muted-foreground max-w-md">
            {data.path === "management"
              ? "Your property manager will review your request and get back to you shortly."
              : "Your listing is now visible to thousands of potential subtenants."}
          </p>
          <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
            <Button onClick={() => { handleClose(); navigate("/tenant/dashboard"); }}>Go to My Dashboard</Button>
            <Button variant="outline" onClick={handleClose}>Close</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isStepVisible = (stepIndex: number) => stepIndex <= activeStep;
  const isStepCompleted = (stepIndex: number) => stepIndex < activeStep;

  // Step renderers
  const renderStep1 = () => (
    <div ref={(el) => { stepRefs.current["path-select"] = el; }} className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Who manages your property?</h1>
        <p className="mt-2 text-muted-foreground">This determines how we set up your sublet listing</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { value: "management" as const, icon: <Building2 className="h-6 w-6" />, title: "Managed by a Management Group", subtitle: "Your building is managed by a property management company listed on our platform" },
          { value: "own" as const, icon: <Key className="h-6 w-6" />, title: "My Own Property", subtitle: "You own the property or manage it independently without a management company on our platform" },
        ].map((card) => (
          <button
            key={card.value}
            onClick={() => { update({ path: card.value }); setActiveStep(1); }}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-8 text-center transition-all ${
              data.path === card.value ? "border-primary bg-accent shadow-sm" : "border-border hover:border-primary/40 hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${data.path === card.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {card.icon}
            </div>
            <p className="text-base font-semibold text-foreground">{card.title}</p>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            {data.path === card.value && <Check className="h-5 w-5 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );

  // PATH A STEPS
  const renderPathAStep2 = () => (
    <div ref={(el) => { stepRefs.current["mgmt-search"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Choose Your Management Group</h2>
      <p className="text-muted-foreground text-sm">Search for your property management company</p>
      <div className="relative">
        <Input
          value={mgmtSearch}
          onChange={(e) => setMgmtSearch(e.target.value)}
          placeholder="Search for your management company..."
          className="pr-10"
        />
        {mgmtResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border bg-popover shadow-elevated max-h-64 overflow-y-auto">
            {mgmtResults.map((mgr: any) => (
              <button
                key={mgr.id}
                onClick={() => {
                  update({
                    managementGroupId: mgr.id,
                    managementGroupName: mgr.name,
                    managementGroupLogo: mgr.logo_url || "",
                  });
                  setMgmtSearch("");
                  setMgmtResults([]);
                  revealNext();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {mgr.logo_url ? <img src={mgr.logo_url} className="h-8 w-8 rounded" alt="" /> : <span className="text-xs font-bold text-primary">{mgr.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{mgr.name}</p>
                    {mgr.verified && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald"><CheckCircle className="h-3 w-3" />Verified</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{mgr.city}{mgr.state ? `, ${mgr.state}` : ""} · {mgr.properties_count || 0} properties</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {mgmtSearch.trim() && mgmtResults.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border bg-popover p-4 shadow-elevated">
            <p className="text-sm text-muted-foreground">No results found.</p>
            <button
              onClick={() => { update({ path: "own" }); setActiveStep(1); }}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              My management group is not on the platform →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPathAStep3 = () => (
    <div ref={(el) => { stepRefs.current["mgmt-property"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Select your property from {data.managementGroupName}'s catalog</h2>
      {catalogProperties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties found for this management group.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {catalogProperties.map((prop: any) => (
            <div key={prop.id} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => {
                  setExpandedPropertyId(expandedPropertyId === prop.id ? null : prop.id);
                  loadUnits(prop.id);
                }}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
                  {prop.photo_url ? <img src={prop.photo_url} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Building2 className="h-6 w-6 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{prop.name || prop.address}</p>
                  <p className="text-xs text-muted-foreground">{prop.address}</p>
                  <p className="text-xs text-muted-foreground">{prop.units_count || 0} units · {prop.property_type || "Property"}</p>
                </div>
              </button>
              {/* Expanded units */}
              {expandedPropertyId === prop.id && (
                <div className="border-t px-4 py-2 space-y-1">
                  {(catalogUnits[prop.id] || []).map((unit: any) => (
                    <button
                      key={unit.id}
                      onClick={() => {
                        update({
                          catalogPropertyId: prop.id,
                          catalogPropertyAddress: prop.address,
                          catalogPropertyPhoto: prop.photo_url || "",
                          catalogUnitId: unit.id,
                          catalogUnitNumber: unit.unit_number,
                          catalogUnitBedrooms: unit.bedrooms || 0,
                          catalogUnitBathrooms: unit.bathrooms || 0,
                          catalogUnitSqft: unit.sqft || 0,
                          catalogUnitPhotos: unit.photos || [],
                          catalogUnitDescription: unit.description || "",
                          catalogUnitAmenities: unit.amenities || [],
                        });
                        revealNext();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        data.catalogUnitId === unit.id ? "bg-accent border border-primary" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Unit {unit.unit_number}{unit.floor ? ` · Floor ${unit.floor}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{unit.bedrooms || "?"} bed · {unit.bathrooms || "?"} bath · {unit.sqft || "?"} sqft</p>
                      </div>
                      {data.catalogUnitId === unit.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                  {(catalogUnits[prop.id] || []).length === 0 && <p className="text-xs text-muted-foreground py-2">No units available.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPathAStep4 = () => (
    <div ref={(el) => { stepRefs.current["mgmt-dates"] = el; }} className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Set Your Sublet Period</h2>
      <CalendarRangePicker
        availableFrom={data.availableFrom}
        availableUntil={data.availableUntil}
        onSelect={(from, until) => update({ availableFrom: from, availableUntil: until })}
      />
      {renderDurationAndFlexibility()}

      {/* Final review card for Path A */}
      {data.availableFrom && data.availableUntil && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Review Your Sublet Request</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Management:</span> <span className="font-medium">{data.managementGroupName}</span></div>
            <div><span className="text-muted-foreground">Property:</span> <span className="font-medium">{data.catalogPropertyAddress}</span></div>
            <div><span className="text-muted-foreground">Unit:</span> <span className="font-medium">{data.catalogUnitNumber}</span></div>
            <div><span className="text-muted-foreground">Period:</span> <span className="font-medium">{data.availableFrom} → {data.availableUntil}</span></div>
          </div>
          <label className="flex items-start gap-2">
            <Checkbox checked={data.confirmPermission} onCheckedChange={(v) => update({ confirmPermission: !!v })} className="mt-0.5" />
            <span className="text-sm text-foreground">I confirm I have permission from my property manager to sublet this unit during this period</span>
          </label>
          <Button
            onClick={publishPathA}
            disabled={saving || !data.confirmPermission}
            className="w-full"
          >
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><Home className="mr-2 h-4 w-4" /> Publish Property</>}
          </Button>
        </div>
      )}
    </div>
  );

  // PATH B STEPS
  const renderPathBStep2 = () => (
    <div ref={(el) => { stepRefs.current["own-type"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">What type of property is it?</h2>
      <p className="text-sm text-muted-foreground">Choose the option that best describes your place</p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { value: "house", icon: <Home className="h-6 w-6" />, label: "House" },
          { value: "apartment", icon: <Building className="h-6 w-6" />, label: "Apartment" },
          { value: "condo", icon: <Landmark className="h-6 w-6" />, label: "Condo" },
          { value: "studio", icon: <Hotel className="h-6 w-6" />, label: "Studio" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => { update({ propertyType: opt.value }); revealNext(); }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all ${
              data.propertyType === opt.value ? "border-primary bg-accent" : "border-border hover:border-primary/40"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${data.propertyType === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {opt.icon}
            </div>
            <span className="text-sm font-semibold text-foreground">{opt.label}</span>
            {data.propertyType === opt.value && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPathBStep3 = () => (
    <div ref={(el) => { stepRefs.current["own-space"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">What type of space will guests have?</h2>
      <p className="text-sm text-muted-foreground">This helps potential subtenants understand exactly what they're getting</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { value: "entire", icon: <Home className="h-5 w-5" />, label: "Entire Place", subtitle: "Guests have the whole place to themselves" },
          { value: "private", icon: <Lock className="h-5 w-5" />, label: "Private Room", subtitle: "Their own room, shared common areas" },
          { value: "shared", icon: <BedDouble className="h-5 w-5" />, label: "Shared Room", subtitle: "Shared sleeping space with others" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => { update({ spaceType: opt.value }); revealNext(); }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition-all ${
              data.spaceType === opt.value ? "border-primary bg-accent" : "border-border hover:border-primary/40"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${data.spaceType === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {opt.icon}
            </div>
            <p className="text-sm font-semibold text-foreground">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPathBStep4 = () => (
    <div ref={(el) => { stepRefs.current["own-location"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Where is your place located?</h2>
      <p className="text-sm text-muted-foreground">Your exact address is only shared with confirmed subtenants</p>
      <div className="space-y-3">
        <div>
          <Label>Street Address</Label>
          <Input value={data.address} onChange={(e) => update({ address: e.target.value })} placeholder="123 Main St" />
        </div>
        <div>
          <Label>Apt / Unit (optional)</Label>
          <Input value={data.unitNumber} onChange={(e) => update({ unitNumber: e.target.value })} placeholder="Apt 4B" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>City</Label><Input value={data.city} onChange={(e) => update({ city: e.target.value })} placeholder="Boston" /></div>
          <div><Label>State</Label><Input value={data.state} onChange={(e) => update({ state: e.target.value })} placeholder="MA" /></div>
          <div><Label>Zip</Label><Input value={data.zip} onChange={(e) => update({ zip: e.target.value })} placeholder="02101" /></div>
        </div>
        <div><Label>Country</Label><Input value={data.country} onChange={(e) => update({ country: e.target.value })} /></div>
        {data.address && data.city && (
          <>
            <div className="rounded-xl border bg-muted/30 p-6 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Map preview: {data.address}, {data.city}{data.state ? `, ${data.state}` : ""}</p>
            </div>
            <Button variant="outline" size="sm" onClick={revealNext}>Confirm Location & Continue</Button>
          </>
        )}
      </div>
    </div>
  );

  const renderPathBStep5 = () => (
    <div ref={(el) => { stepRefs.current["own-describe"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Describe your place</h2>
      <div className="space-y-3">
        <div>
          <Label>Listing Headline</Label>
          <Input value={data.headline} onChange={(e) => update({ headline: e.target.value.slice(0, 60) })} placeholder="Bright 2BR in Downtown Boston" maxLength={60} />
          <p className="mt-1 text-xs text-muted-foreground text-right">{data.headline.length}/60</p>
        </div>
        <div>
          <Label>Full Description</Label>
          <Textarea value={data.description} onChange={(e) => update({ description: e.target.value.slice(0, 500) })} placeholder="Describe your space, neighborhood, and what makes it special..." rows={4} maxLength={500} />
          <p className="mt-1 text-xs text-muted-foreground text-right">{data.description.length}/500</p>
        </div>
        {data.headline.trim() && data.description.trim() && (
          <Button variant="outline" size="sm" onClick={revealNext}>Continue</Button>
        )}
      </div>
    </div>
  );

  const NumberStepper = ({ value, onChange, min = 0, max = 20, step = 1, label }: { value: number | ""; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string }) => (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, (Number(value) || 0) - step))} className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"><Minus className="h-4 w-4" /></button>
        <span className="w-8 text-center text-sm font-semibold">{value === "" ? "—" : value}</span>
        <button onClick={() => onChange(Math.min(max, (Number(value) || 0) + step))} className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );

  const renderPathBStep6 = () => (
    <div ref={(el) => { stepRefs.current["own-details"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Property details</h2>
      <div className="space-y-2">
        <NumberStepper label="Bedrooms" value={data.bedrooms} onChange={(v) => update({ bedrooms: v })} min={0} max={10} />
        <NumberStepper label="Bathrooms" value={data.bathrooms} onChange={(v) => update({ bathrooms: v })} min={0} max={10} step={0.5} />
        <div>
          <Label>Square footage</Label>
          <Input type="number" value={data.sqft} onChange={(e) => update({ sqft: e.target.value ? Number(e.target.value) : "" })} placeholder="750" />
        </div>
        <div>
          <Label>Floor number (optional)</Label>
          <Input type="number" value={data.floorNumber} onChange={(e) => update({ floorNumber: e.target.value ? Number(e.target.value) : "" })} placeholder="3" />
        </div>
        <NumberStepper label="Max occupants" value={data.maxOccupants} onChange={(v) => update({ maxOccupants: v })} min={1} max={20} />
      </div>
      {data.bedrooms !== "" && data.bathrooms !== "" && (
        <Button variant="outline" size="sm" onClick={revealNext}>Continue</Button>
      )}
    </div>
  );

  const renderPathBStep7 = () => (
    <div ref={(el) => { stepRefs.current["own-amenities"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Amenities</h2>
      <p className="text-sm text-muted-foreground">Select all that apply to your place</p>
      <div className="flex flex-wrap gap-2">
        {AMENITIES_OPTIONS.map((a) => {
          const selected = data.amenities.includes(a.label);
          const IconComp = (icons as any)[a.icon];
          return (
            <button
              key={a.label}
              onClick={() => update({ amenities: selected ? data.amenities.filter((x) => x !== a.label) : [...data.amenities, a.label] })}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
              }`}
            >
              {IconComp && <IconComp className="h-4 w-4" />} {a.label}
            </button>
          );
        })}
      </div>
      <button onClick={revealNext} className="text-sm font-medium text-primary hover:underline">Continue →</button>
    </div>
  );

  const renderPathBStep8 = () => {
    const total = data.photos.length + data.photoUrls.length;
    return (
      <div ref={(el) => { stepRefs.current["own-photos"] = el; }} className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Add some photos of your place</h2>
        <p className="text-sm text-muted-foreground">Listings with great photos get significantly more interest. Add at least 3 photos.</p>
        <PhotoUploader
          photos={data.photos}
          photoUrls={data.photoUrls}
          onPhotosChange={(p) => update({ photos: p })}
          onPhotoUrlsChange={(u) => update({ photoUrls: u })}
        />
        {total >= 3 && <Button variant="outline" size="sm" onClick={revealNext}>Continue</Button>}
      </div>
    );
  };

  const renderPathBStep9 = () => {
    const rent = Number(data.monthlyRent) || 0;
    const deposit = Number(data.securityDeposit) || 0;
    const fee = rent * 0.06;
    return (
      <div ref={(el) => { stepRefs.current["own-pricing"] = el; }} className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Pricing</h2>
        <div className="space-y-3">
          <div>
            <Label>Monthly Rent</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
              <Input type="number" value={data.monthlyRent} onChange={(e) => update({ monthlyRent: e.target.value ? Number(e.target.value) : "" })} className="pl-8 text-lg font-semibold" placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Security Deposit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
              <Input type="number" value={data.securityDeposit} onChange={(e) => update({ securityDeposit: e.target.value ? Number(e.target.value) : "" })} className="pl-8 text-lg font-semibold" placeholder="0" />
            </div>
          </div>
          {rent > 0 && (
            <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtenant pays</span><span className="font-semibold">${rent}/mo + ${deposit} deposit</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">You receive</span><span className="font-semibold text-emerald">${(rent - fee).toFixed(0)}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (6%)</span><span className="font-medium">${fee.toFixed(0)}</span></div>
            </div>
          )}
        </div>
        {data.monthlyRent !== "" && data.securityDeposit !== "" && (
          <Button variant="outline" size="sm" onClick={revealNext}>Continue</Button>
        )}
      </div>
    );
  };

  const renderPathBStep10 = () => (
    <div ref={(el) => { stepRefs.current["own-dates"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Set your sublet period</h2>
      <p className="text-sm text-muted-foreground">Set the period you'd like to make your place available</p>
      <CalendarRangePicker
        availableFrom={data.availableFrom}
        availableUntil={data.availableUntil}
        onSelect={(from, until) => update({ availableFrom: from, availableUntil: until })}
      />
      {renderDurationAndFlexibility()}
      {data.availableFrom && data.availableUntil && (
        <Button variant="outline" size="sm" onClick={revealNext}>Continue</Button>
      )}
    </div>
  );

  const renderPathBStep11 = () => (
    <div ref={(el) => { stepRefs.current["own-rules"] = el; }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">House Rules</h2>
      <div className="space-y-2">
        {[
          { key: "noSmoking" as const, label: "No smoking" },
          { key: "noPets" as const, label: "No pets" },
          { key: "noParties" as const, label: "No parties or events" },
          { key: "noUnregisteredGuests" as const, label: "No unregistered guests overnight" },
          { key: "quietHours" as const, label: "Quiet hours after 10pm" },
        ].map((rule) => (
          <div key={rule.key} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="text-sm font-medium text-foreground">{rule.label}</span>
            <Switch checked={data.houseRules[rule.key]} onCheckedChange={(v) => update({ houseRules: { ...data.houseRules, [rule.key]: v } })} />
          </div>
        ))}
      </div>
      <div>
        <Label>Any additional rules?</Label>
        <Textarea value={data.customRules} onChange={(e) => update({ customRules: e.target.value.slice(0, 300) })} maxLength={300} rows={2} placeholder="Any other rules or notes..." />
        <p className="mt-1 text-xs text-muted-foreground text-right">{data.customRules.length}/300</p>
      </div>
      <div>
        <Label>Guest Policy</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { value: "no_guests", label: "No guests allowed" },
            { value: "occasional", label: "Occasional guests OK" },
            { value: "welcome", label: "Guests welcome" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ guestPolicy: opt.value })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                data.guestPolicy === opt.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={revealNext} className="text-sm font-medium text-primary hover:underline">Continue to Review →</button>
    </div>
  );

  const renderPathBStep12 = () => {
    const total = data.photos.length + data.photoUrls.length;
    const allReady = !!data.propertyType && !!data.address && total >= 3 && data.monthlyRent !== "" && !!data.availableFrom && !!data.availableUntil && !!data.headline;

    return (
      <div ref={(el) => { stepRefs.current["own-review"] = el; }} className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Final Review & Publish</h2>

        <div className="rounded-xl border bg-card p-5 space-y-4 text-sm">
          <ReviewSection label="Property" value={`${data.propertyType} · ${data.spaceType}`} stepIndex={1} onEdit={editStep} />
          <ReviewSection label="Location" value={`${data.address}, ${data.city}, ${data.state} ${data.zip}`} stepIndex={3} onEdit={editStep} />
          <ReviewSection label="Headline" value={data.headline} stepIndex={4} onEdit={editStep} />
          <ReviewSection label="Details" value={`${data.bedrooms} bed · ${data.bathrooms} bath · ${data.sqft || "?"} sqft`} stepIndex={5} onEdit={editStep} />
          <ReviewSection label="Amenities" value={data.amenities.join(", ") || "None"} stepIndex={6} onEdit={editStep} />
          <ReviewSection label="Photos" value={`${total} photos`} stepIndex={7} onEdit={editStep} />
          <ReviewSection label="Pricing" value={`$${data.monthlyRent}/mo · $${data.securityDeposit} deposit`} stepIndex={8} onEdit={editStep} />
          <ReviewSection label="Dates" value={`${data.availableFrom} → ${data.availableUntil}`} stepIndex={9} onEdit={editStep} />
          <ReviewSection label="Rules" value={data.guestPolicy || "Not set"} stepIndex={10} onEdit={editStep} />
        </div>

        {!allReady && (
          <div className="flex items-center gap-2 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Some required fields are incomplete. Please review the sections above.
          </div>
        )}

        {/* Optional ID Verification — not required to publish */}
        {idVerified === false && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground mb-1">
              ✨ Verified hosts get 3x more inquiries
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Optional — verify your identity to earn a Verified badge and stand out. Takes 30 seconds.
            </p>
            <TenantIdVerification idVerified={false} onVerified={() => setIdVerified(true)} />
          </div>
        )}

        <label className="flex items-start gap-2">
          <Checkbox checked={data.confirmAccuracy} onCheckedChange={(v) => update({ confirmAccuracy: !!v })} className="mt-0.5" />
          <span className="text-sm text-foreground">I confirm all information is accurate and I agree to the platform sublet terms</span>
        </label>

        <Button onClick={publishPathB} disabled={saving || !allReady || !data.confirmAccuracy} className="w-full">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><Home className="mr-2 h-4 w-4" /> Publish Property</>}
        </Button>
      </div>
    );
  };

  const ReviewSection = ({ label, value, stepIndex, onEdit }: { label: string; value: string; stepIndex: number; onEdit: (s: number) => void }) => (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
      <button onClick={() => onEdit(stepIndex)} className="text-xs font-medium text-primary hover:underline shrink-0">Edit</button>
    </div>
  );

  const renderDurationAndFlexibility = () => (
    <>
      <div>
        <Label className="mb-2 block">Minimum sublet duration</Label>
        <div className="flex flex-wrap gap-2">
          {[{ value: 1, label: "1 month" }, { value: 2, label: "2 months" }, { value: 3, label: "3 months" }, { value: 6, label: "6 months" }, { value: 0, label: "Flexible" }].map((opt) => (
            <button key={opt.value} onClick={() => update({ minDuration: opt.value })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${data.minDuration === opt.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >{opt.label}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Move-in flexibility</Label>
        <div className="flex flex-wrap gap-2">
          {[{ value: "exact", label: "Exact dates only" }, { value: "week", label: "Flexible by a week" }, { value: "month", label: "Flexible by a month" }].map((opt) => (
            <button key={opt.value} onClick={() => update({ flexibility: opt.value })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${data.flexibility === opt.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >{opt.label}</button>
          ))}
        </div>
      </div>
    </>
  );

  // Summary text for completed steps
  const getSummary = (stepId: string): string => {
    switch (stepId) {
      case "path-select": return data.path === "management" ? "Managed by a Management Group" : "My Own Property";
      case "mgmt-search": return data.managementGroupName;
      case "mgmt-property": return `${data.catalogPropertyAddress} · Unit ${data.catalogUnitNumber}`;
      case "own-type": return data.propertyType;
      case "own-space": return data.spaceType;
      case "own-location": return `${data.address}, ${data.city}`;
      case "own-describe": return data.headline;
      case "own-details": return `${data.bedrooms} bed · ${data.bathrooms} bath`;
      case "own-amenities": return data.amenities.length > 0 ? `${data.amenities.length} selected` : "None";
      case "own-photos": return `${data.photos.length + data.photoUrls.length} photos`;
      case "own-pricing": return `$${data.monthlyRent}/mo`;
      case "own-dates": return `${data.availableFrom} → ${data.availableUntil}`;
      case "own-rules": return data.guestPolicy || "Set";
      default: return "";
    }
  };

  const getStepLabel = (stepId: string): string => {
    const labels: Record<string, string> = {
      "path-select": "Property Management",
      "mgmt-search": "Management Group",
      "mgmt-property": "Property & Unit",
      "mgmt-dates": "Sublet Period",
      "own-type": "Property Type",
      "own-space": "Space Type",
      "own-location": "Location",
      "own-describe": "Description",
      "own-details": "Property Details",
      "own-amenities": "Amenities",
      "own-photos": "Photos",
      "own-pricing": "Pricing",
      "own-dates": "Sublet Period",
      "own-rules": "House Rules",
      "own-review": "Review",
    };
    return labels[stepId] || "";
  };

  const renderStepContent = (stepId: string) => {
    switch (stepId) {
      case "path-select": return renderStep1();
      case "mgmt-search": return renderPathAStep2();
      case "mgmt-property": return renderPathAStep3();
      case "mgmt-dates": return renderPathAStep4();
      case "own-type": return renderPathBStep2();
      case "own-space": return renderPathBStep3();
      case "own-location": return renderPathBStep4();
      case "own-describe": return renderPathBStep5();
      case "own-details": return renderPathBStep6();
      case "own-amenities": return renderPathBStep7();
      case "own-photos": return renderPathBStep8();
      case "own-pricing": return renderPathBStep9();
      case "own-dates": return renderPathBStep10();
      case "own-rules": return renderPathBStep11();
      case "own-review": return renderPathBStep12();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 shrink-0">
        <button onClick={() => activeStep > 0 ? setActiveStep(activeStep - 1) : handleClose()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {activeStep > 0 ? "Back" : ""}
        </button>
        {/* Progress bar */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
          {steps.map((stepId, index) => {
            if (!isStepVisible(index)) return null;

            if (isStepCompleted(index)) {
              return (
                <motion.div key={stepId} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <CompletedStepBar
                    label={getStepLabel(stepId)}
                    summary={getSummary(stepId)}
                    onEdit={() => editStep(index)}
                  />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={stepId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {renderStepContent(stepId)}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubletFlowOverlay;
