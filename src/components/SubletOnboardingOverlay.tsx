import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Building2, Key, FileText, Home, Building, Landmark, Hotel, Users, Lock, BedDouble, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SubletOnboardingOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface OnboardingData {
  arrangement: string;
  propertyType: string;
  spaceType: string;
  address: string;
  unitNumber: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  availableFrom: string;
  availableUntil: string;
  minDuration: number;
  flexibility: string;
}

const defaultData: OnboardingData = {
  arrangement: "",
  propertyType: "",
  spaceType: "",
  address: "",
  unitNumber: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  availableFrom: "",
  availableUntil: "",
  minDuration: 1,
  flexibility: "exact",
};

const TOTAL_STEPS = 5;

const SubletOnboardingOverlay = ({ open, onClose }: SubletOnboardingOverlayProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const update = (partial: Partial<OnboardingData>) => setData((p) => ({ ...p, ...partial }));

  const canNext = () => {
    if (step === 0) return !!data.arrangement;
    if (step === 1) return !!data.propertyType;
    if (step === 2) return !!data.spaceType;
    if (step === 3) return !!data.address.trim() && !!data.city.trim();
    if (step === 4) return !!data.availableFrom && !!data.availableUntil;
    return false;
  };

  const handleFinish = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    setSaving(true);
    try {
      const propertyTypeMap: Record<string, string> = { house: "house", apartment: "apartment", condo: "condo", studio: "studio" };
      const payload = {
        tenant_id: user.id,
        address: `${data.address}${data.unitNumber ? `, ${data.unitNumber}` : ""}, ${data.city}, ${data.state} ${data.zip}, ${data.country}`,
        unit_number: data.unitNumber || null,
        property_type: (propertyTypeMap[data.propertyType] || null) as any,
        available_from: data.availableFrom,
        available_until: data.availableUntil,
        min_duration: data.minDuration,
        status: "draft" as const,
      };
      const { data: inserted, error } = await supabase.from("listings").insert(payload).select("id").single();
      if (error) throw error;
      toast.success("Draft saved! Complete your listing.");
      onClose();
      navigate(`/listings/edit/${inserted.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setData(defaultData);
    onClose();
  };

  // Date range display
  const formatRange = () => {
    if (!data.availableFrom || !data.availableUntil) return "";
    const from = new Date(data.availableFrom);
    const until = new Date(data.availableUntil);
    const months = Math.max(1, Math.round((until.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return `Available from ${from.toLocaleDateString("en-US", { month: "long", day: "numeric" })} to ${until.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${months} month${months !== 1 ? "s" : ""}`;
  };

  // Generate calendar days for a month
  const renderMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const fromDate = data.availableFrom ? new Date(data.availableFrom) : null;
    const untilDate = data.availableUntil ? new Date(data.availableUntil) : null;

    const handleDayClick = (day: number) => {
      const clicked = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (!data.availableFrom || (data.availableFrom && data.availableUntil)) {
        update({ availableFrom: clicked, availableUntil: "" });
      } else {
        if (clicked < data.availableFrom) {
          update({ availableFrom: clicked, availableUntil: "" });
        } else {
          update({ availableUntil: clicked });
        }
      }
    };

    const isInRange = (day: number) => {
      if (!fromDate || !untilDate) return false;
      const d = new Date(year, month, day);
      return d > fromDate && d < untilDate;
    };
    const isStart = (day: number) => fromDate && year === fromDate.getFullYear() && month === fromDate.getMonth() && day === fromDate.getDate();
    const isEnd = (day: number) => untilDate && year === untilDate.getFullYear() && month === untilDate.getMonth() && day === untilDate.getDate();

    return (
      <div className="flex-1">
        <p className="mb-3 text-center text-sm font-semibold text-foreground">{monthName}</p>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-1 text-muted-foreground font-medium">{d}</div>
          ))}
          {days.map((day, i) => (
            <div key={i}>
              {day ? (
                <button
                  onClick={() => handleDayClick(day)}
                  className={`w-full rounded-md py-1.5 text-sm transition-colors
                    ${isStart(day) || isEnd(day) ? "bg-primary text-primary-foreground font-semibold" : ""}
                    ${isInRange(day) ? "bg-accent text-accent-foreground" : ""}
                    ${!isStart(day) && !isEnd(day) && !isInRange(day) ? "hover:bg-muted" : ""}
                  `}
                >
                  {day}
                </button>
              ) : <div />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const SelectCard = ({ selected, onClick, icon, label, subtitle }: { selected: boolean; onClick: () => void; icon: React.ReactNode; label: string; subtitle?: string }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition-all ${
        selected ? "border-primary bg-accent shadow-sm" : "border-border hover:border-primary/40 hover:bg-accent/50"
      }`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {selected && <Check className="h-4 w-4 text-primary" />}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-background"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <button onClick={() => step > 0 ? setStep(step - 1) : handleClose()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {step > 0 ? "Back" : ""}
          </button>
          {/* Progress */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl"
            >
              {/* Frame 1 */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
                      <Home className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Tell us a bit more about your place</h1>
                    <p className="mt-2 text-muted-foreground">We'll help you set up your sublet listing in just a few steps. It only takes a few minutes.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <SelectCard selected={data.arrangement === "manager"} onClick={() => update({ arrangement: "manager" })} icon={<Building2 className="h-5 w-5" />} label="I have a property manager" />
                    <SelectCard selected={data.arrangement === "owner"} onClick={() => update({ arrangement: "owner" })} icon={<Key className="h-5 w-5" />} label="I own the property" />
                    <SelectCard selected={data.arrangement === "other"} onClick={() => update({ arrangement: "other" })} icon={<FileText className="h-5 w-5" />} label="Other arrangement" />
                  </div>
                </div>
              )}

              {/* Frame 2 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">What type of property is it?</h1>
                    <p className="mt-2 text-muted-foreground">Choose the option that best describes your place</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <SelectCard selected={data.propertyType === "house"} onClick={() => update({ propertyType: "house" })} icon={<Home className="h-5 w-5" />} label="House" />
                    <SelectCard selected={data.propertyType === "apartment"} onClick={() => update({ propertyType: "apartment" })} icon={<Building className="h-5 w-5" />} label="Apartment" />
                    <SelectCard selected={data.propertyType === "condo"} onClick={() => update({ propertyType: "condo" })} icon={<Landmark className="h-5 w-5" />} label="Condo" />
                    <SelectCard selected={data.propertyType === "studio"} onClick={() => update({ propertyType: "studio" })} icon={<Hotel className="h-5 w-5" />} label="Studio" />
                  </div>
                </div>
              )}

              {/* Frame 3 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">What type of space will guests have?</h1>
                    <p className="mt-2 text-muted-foreground">This helps potential subtenants understand exactly what they're getting</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectCard selected={data.spaceType === "entire"} onClick={() => update({ spaceType: "entire" })} icon={<Home className="h-5 w-5" />} label="Entire Place" subtitle="Guests have the whole place to themselves" />
                    <SelectCard selected={data.spaceType === "private"} onClick={() => update({ spaceType: "private" })} icon={<Lock className="h-5 w-5" />} label="Private Room" subtitle="Their own room, shared common areas" />
                    <SelectCard selected={data.spaceType === "shared"} onClick={() => update({ spaceType: "shared" })} icon={<BedDouble className="h-5 w-5" />} label="Shared Room" subtitle="Shared sleeping space with others" />
                  </div>
                </div>
              )}

              {/* Frame 4 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Where is your place located?</h1>
                    <p className="mt-2 text-muted-foreground">Your exact address is only shared with confirmed subtenants</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Street Address</Label>
                      <Input value={data.address} onChange={(e) => update({ address: e.target.value })} placeholder="123 Main St" />
                    </div>
                    <div>
                      <Label>Apt / Unit (optional)</Label>
                      <Input value={data.unitNumber} onChange={(e) => update({ unitNumber: e.target.value })} placeholder="Apt 4B" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>City</Label>
                        <Input value={data.city} onChange={(e) => update({ city: e.target.value })} placeholder="New York" />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input value={data.state} onChange={(e) => update({ state: e.target.value })} placeholder="NY" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Zip Code</Label>
                        <Input value={data.zip} onChange={(e) => update({ zip: e.target.value })} placeholder="10001" />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input value={data.country} onChange={(e) => update({ country: e.target.value })} />
                      </div>
                    </div>
                    {/* Map placeholder */}
                    {data.address && data.city && (
                      <div className="rounded-xl border bg-muted/30 p-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Map preview will appear here</p>
                        <p className="mt-1 text-xs text-muted-foreground">{data.address}, {data.city}{data.state ? `, ${data.state}` : ""}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Frame 5 */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">When do you want to sublet your place?</h1>
                    <p className="mt-2 text-muted-foreground">Set the period you'd like to make your place available</p>
                  </div>

                  {/* Calendar */}
                  <div className="flex gap-6 overflow-x-auto">
                    {renderMonth(now)}
                    {renderMonth(nextMonth)}
                  </div>

                  {formatRange() && (
                    <p className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-primary">{formatRange()}</p>
                  )}

                  {/* Min duration */}
                  <div>
                    <Label className="mb-2 block">Minimum sublet duration</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 1, label: "1 month" },
                        { value: 2, label: "2 months" },
                        { value: 3, label: "3 months" },
                        { value: 6, label: "6 months" },
                        { value: 0, label: "Flexible" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => update({ minDuration: opt.value })}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                            data.minDuration === opt.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flexibility */}
                  <div>
                    <Label className="mb-2 block">Move-in flexibility</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "exact", label: "Exact dates only" },
                        { value: "week", label: "Flexible by a week" },
                        { value: "month", label: "Flexible by a month" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => update({ flexibility: opt.value })}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                            data.flexibility === opt.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <p className="text-xs text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</p>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canNext() || saving}>
                {saving ? "Saving..." : "Continue to Full Listing"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubletOnboardingOverlay;
