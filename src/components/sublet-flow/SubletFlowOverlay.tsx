import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Building2, Key, FileText, Home, Building, Landmark, Hotel, Lock, BedDouble, Users, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CalendarRangePicker from "./CalendarRangePicker";
import { SubletFlowData, defaultFlowData } from "./types";

interface SubletFlowOverlayProps {
  open: boolean;
  onClose: () => void;
}

const FRAME_TITLES = [
  "Tell us a bit more about your place",
  "What type of property is it?",
  "What type of space will guests have?",
  "Where is your place located?",
  "When do you want to sublet your place?",
];

const SubletFlowOverlay = ({ open, onClose }: SubletFlowOverlayProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [frame, setFrame] = useState(0);
  const [data, setData] = useState<SubletFlowData>({ ...defaultFlowData });
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  const update = (partial: Partial<SubletFlowData>) => setData((p) => ({ ...p, ...partial }));

  const canNext = (): boolean => {
    switch (frame) {
      case 0: return !!data.arrangement;
      case 1: return !!data.propertyType;
      case 2: return !!data.spaceType;
      case 3: return !!data.address.trim() && !!data.city.trim();
      case 4: return !!data.availableFrom && !!data.availableUntil;
      default: return false;
    }
  };

  const goNext = () => {
    if (frame < 4) {
      setDirection(1);
      setFrame(frame + 1);
    }
  };

  const goBack = () => {
    if (frame > 0) {
      setDirection(-1);
      setFrame(frame - 1);
    }
  };

  const handleClose = () => {
    setData({ ...defaultFlowData });
    setFrame(0);
    onClose();
  };

  const handleFinish = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    setSaving(true);
    try {
      const fullAddress = [
        data.address,
        data.unitNumber && `${data.unitNumber}`,
        data.city,
        data.state,
        data.zip,
        data.country,
      ].filter(Boolean).join(", ");

      const payload: Record<string, any> = {
        tenant_id: user.id,
        status: "draft",
        path: data.arrangement === "manager" ? "management" : "own",
        property_type: data.propertyType || null,
        space_type: data.spaceType || null,
        address: fullAddress,
        unit_number: data.unitNumber || null,
        latitude: data.latitude,
        longitude: data.longitude,
        available_from: data.availableFrom || null,
        available_until: data.availableUntil || null,
        min_duration: data.minDuration,
        move_in_flexibility: data.moveInFlexibility,
        source: "manual",
      };

      const { data: listing, error } = await supabase
        .from("listings")
        .insert(payload as any)
        .select("id")
        .single();

      if (error) throw error;

      handleClose();
      navigate(`/listings/edit/${listing.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const progressPct = ((frame + 1) / 5) * 100;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 shrink-0">
        <button
          onClick={frame > 0 ? goBack : handleClose}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {frame > 0 ? "Back" : ""}
        </button>
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">Step {frame + 1} of 5</p>
        </div>
        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center">
        <div className="w-full max-w-xl px-4 py-8 sm:py-12">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={frame}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {frame === 0 && <Frame1 data={data} update={update} />}
              {frame === 1 && <Frame2 data={data} update={update} />}
              {frame === 2 && <Frame3 data={data} update={update} />}
              {frame === 3 && <Frame4 data={data} update={update} />}
              {frame === 4 && <Frame5 data={data} update={update} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-4 sm:px-6 shrink-0">
        <div className="mx-auto flex max-w-xl items-center justify-end">
          {frame < 4 ? (
            <Button onClick={goNext} disabled={!canNext()} size="lg">
              Next
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!canNext() || saving} size="lg">
              {saving ? "Saving…" : "Continue to Full Listing"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Frame 1: Arrangement ─── */
function Frame1({ data, update }: { data: SubletFlowData; update: (p: Partial<SubletFlowData>) => void }) {
  const cards = [
    { value: "manager" as const, icon: <Building2 className="h-7 w-7" />, emoji: "🏢", label: "I have a property manager", desc: "Your building is managed by a property management company" },
    { value: "owner" as const, icon: <Key className="h-7 w-7" />, emoji: "🔑", label: "I own the property", desc: "You own the property or manage it independently" },
    { value: "other" as const, icon: <FileText className="h-7 w-7" />, emoji: "📄", label: "Other arrangement", desc: "Another type of rental or living arrangement" },
  ];

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
        <Home className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Tell us a bit more about your place</h1>
        <p className="mt-2 text-muted-foreground">We'll help you set up your sublet listing in just a few steps. It only takes a few minutes.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
        {cards.map((c) => (
          <button
            key={c.value}
            onClick={() => update({ arrangement: c.value })}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
              data.arrangement === c.value
                ? "border-primary bg-accent shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
              data.arrangement === c.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {c.emoji}
            </div>
            <p className="text-sm font-semibold text-foreground">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Frame 2: Property Type ─── */
function Frame2({ data, update }: { data: SubletFlowData; update: (p: Partial<SubletFlowData>) => void }) {
  const types = [
    { value: "house" as const, emoji: "🏠", label: "House" },
    { value: "apartment" as const, emoji: "🏢", label: "Apartment" },
    { value: "condo" as const, emoji: "🏙️", label: "Condo" },
    { value: "studio" as const, emoji: "🏡", label: "Studio" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">What type of property is it?</h1>
        <p className="mt-2 text-muted-foreground">Choose the option that best describes your place</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => update({ propertyType: t.value })}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-8 transition-all ${
              data.propertyType === t.value
                ? "border-primary bg-accent shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-accent/50"
            }`}
          >
            <span className="text-4xl">{t.emoji}</span>
            <span className="text-sm font-semibold text-foreground">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Frame 3: Space Type ─── */
function Frame3({ data, update }: { data: SubletFlowData; update: (p: Partial<SubletFlowData>) => void }) {
  const spaces = [
    { value: "entire" as const, icon: <Home className="h-6 w-6" />, label: "Entire Place", desc: "Guests have the whole apartment or house to themselves" },
    { value: "private" as const, icon: <Lock className="h-6 w-6" />, label: "Private Room", desc: "Guests have their own room in a place where others may also be living" },
    { value: "shared" as const, icon: <BedDouble className="h-6 w-6" />, label: "Shared Room", desc: "Guests sleep in a shared space with others" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">What type of space will guests have?</h1>
        <p className="mt-2 text-muted-foreground">This helps potential subtenants understand exactly what they're getting</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {spaces.map((s) => (
          <button
            key={s.value}
            onClick={() => update({ spaceType: s.value })}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
              data.spaceType === s.value
                ? "border-primary bg-accent shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              data.spaceType === s.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s.icon}
            </div>
            <p className="text-sm font-semibold text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Frame 4: Location ─── */
function Frame4({ data, update }: { data: SubletFlowData; update: (p: Partial<SubletFlowData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Where is your place located?</h1>
        <p className="mt-2 text-muted-foreground">Your exact address is only shared with confirmed subtenants</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Street Address</Label>
          <Input
            value={data.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="123 Main St"
          />
        </div>
        <div>
          <Label>Apt / Unit number (optional)</Label>
          <Input
            value={data.unitNumber}
            onChange={(e) => update({ unitNumber: e.target.value })}
            placeholder="Apt 4B"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>City</Label>
            <Input value={data.city} onChange={(e) => update({ city: e.target.value })} placeholder="Boston" />
          </div>
          <div>
            <Label>State</Label>
            <Input value={data.state} onChange={(e) => update({ state: e.target.value })} placeholder="MA" />
          </div>
          <div>
            <Label>Zip Code</Label>
            <Input value={data.zip} onChange={(e) => update({ zip: e.target.value })} placeholder="02101" />
          </div>
        </div>
        <div>
          <Label>Country</Label>
          <Input value={data.country} onChange={(e) => update({ country: e.target.value })} />
        </div>

        {data.address && data.city && (
          <div className="rounded-xl border bg-muted/30 p-6 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {data.address}{data.unitNumber ? `, ${data.unitNumber}` : ""}, {data.city}{data.state ? `, ${data.state}` : ""} {data.zip}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              We'll place a pin on the map for your listing. You can adjust it later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Frame 5: Dates ─── */
function Frame5({ data, update }: { data: SubletFlowData; update: (p: Partial<SubletFlowData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">When do you want to sublet your place?</h1>
        <p className="mt-2 text-muted-foreground">Set the period you'd like to make your place available</p>
      </div>

      <CalendarRangePicker
        availableFrom={data.availableFrom}
        availableUntil={data.availableUntil}
        onSelect={(from, until) => update({ availableFrom: from, availableUntil: until })}
      />

      <div className="space-y-4">
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
                  data.minDuration === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Move-in flexibility</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "exact" as const, label: "Exact dates only" },
              { value: "week" as const, label: "Flexible by a week" },
              { value: "month" as const, label: "Flexible by a month" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => update({ moveInFlexibility: opt.value })}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  data.moveInFlexibility === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubletFlowOverlay;
