import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface RenterApplicationFormProps {
  onComplete: () => void;
  onBack: () => void;
}

interface FormData {
  fullName: string;
  currentAddress: string;
  universityOrEmployer: string;
  reasonForSubletting: string;
  intendedStartDate: string;
  intendedEndDate: string;
  incomeOrFunding: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hasPets: boolean;
  petDetails: string;
  priorEvictions: boolean;
  evictionDetails: string;
}

const TOTAL_SCREENS = 5;

const RenterApplicationForm = ({ onComplete, onBack }: RenterApplicationFormProps) => {
  const { user } = useAuth();
  const [screen, setScreen] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    currentAddress: "",
    universityOrEmployer: "",
    reasonForSubletting: "",
    intendedStartDate: "",
    intendedEndDate: "",
    incomeOrFunding: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    hasPets: false,
    petDetails: "",
    priorEvictions: false,
    evictionDetails: "",
  });

  const update = (partial: Partial<FormData>) => setFormData((p) => ({ ...p, ...partial }));

  const canNext = () => {
    switch (screen) {
      case 0: return formData.fullName.trim() && formData.currentAddress.trim();
      case 1: return formData.universityOrEmployer.trim() && formData.reasonForSubletting.trim();
      case 2: return formData.intendedStartDate && formData.intendedEndDate && formData.incomeOrFunding.trim();
      case 3: return formData.emergencyContactName.trim() && formData.emergencyContactPhone.trim();
      case 4: return true; // pets/evictions always valid
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("renter_applications" as any).insert({
        renter_id: user.id,
        full_name: formData.fullName.trim(),
        current_address: formData.currentAddress.trim(),
        university_or_employer: formData.universityOrEmployer.trim(),
        reason_for_subletting: formData.reasonForSubletting.trim(),
        intended_start_date: formData.intendedStartDate,
        intended_end_date: formData.intendedEndDate,
        income_or_funding: formData.incomeOrFunding.trim(),
        emergency_contact_name: formData.emergencyContactName.trim(),
        emergency_contact_phone: formData.emergencyContactPhone.trim(),
        has_pets: formData.hasPets,
        pet_details: formData.hasPets ? formData.petDetails.trim() || null : null,
        prior_evictions: formData.priorEvictions,
        eviction_details: formData.priorEvictions ? formData.evictionDetails.trim() || null : null,
      });
      if (error) throw error;

      // Mark application as complete on profile
      await supabase.from("profiles").update({ application_complete: true } as any).eq("id", user.id);

      toast.success("Application submitted! ✅");
      onComplete();
    } catch (err: any) {
      if (err.code === "23505") {
        // Already submitted — just mark complete
        await supabase.from("profiles").update({ application_complete: true } as any).eq("id", user.id);
        toast.success("Application already on file! ✅");
        onComplete();
      } else {
        toast.error(err.message || "Something went wrong. Try again!");
      }
    } finally {
      setSaving(false);
    }
  };

  const screenContent = () => {
    switch (screen) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold text-foreground">Let's start with the basics</p>
              <p className="text-xs text-muted-foreground">Protect yourself and your future home</p>
            </div>
            <div>
              <Label>Full Legal Name</Label>
              <Input value={formData.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder="Jane Doe" className="mt-1" />
            </div>
            <div>
              <Label>Current Address</Label>
              <Input value={formData.currentAddress} onChange={(e) => update({ currentAddress: e.target.value })} placeholder="123 Main St, Boston, MA" className="mt-1" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold text-foreground">Tell us about you</p>
              <p className="text-xs text-muted-foreground">This helps hosts understand who you are</p>
            </div>
            <div>
              <Label>University or Employer</Label>
              <Input value={formData.universityOrEmployer} onChange={(e) => update({ universityOrEmployer: e.target.value })} placeholder="Boston University" className="mt-1" />
            </div>
            <div>
              <Label>Why are you looking for a sublet?</Label>
              <Textarea value={formData.reasonForSubletting} onChange={(e) => update({ reasonForSubletting: e.target.value })} placeholder="Summer internship, study abroad return, etc." rows={3} className="mt-1 resize-none" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold text-foreground">Dates & funding</p>
              <p className="text-xs text-muted-foreground">When do you need the place?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Move-in Date</Label>
                <Input type="date" value={formData.intendedStartDate} onChange={(e) => update({ intendedStartDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Move-out Date</Label>
                <Input type="date" value={formData.intendedEndDate} onChange={(e) => update({ intendedEndDate: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Income or Funding Source</Label>
              <Input value={formData.incomeOrFunding} onChange={(e) => update({ incomeOrFunding: e.target.value })} placeholder="Internship salary, parents, financial aid..." className="mt-1" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold text-foreground">Emergency contact</p>
              <p className="text-xs text-muted-foreground">Someone we can reach in case of an emergency</p>
            </div>
            <div>
              <Label>Emergency Contact Name</Label>
              <Input value={formData.emergencyContactName} onChange={(e) => update({ emergencyContactName: e.target.value })} placeholder="Parent or guardian name" className="mt-1" />
            </div>
            <div>
              <Label>Emergency Contact Phone</Label>
              <Input value={formData.emergencyContactPhone} onChange={(e) => update({ emergencyContactPhone: e.target.value })} placeholder="(555) 123-4567" className="mt-1" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold text-foreground">Almost done!</p>
              <p className="text-xs text-muted-foreground">Just a couple more things</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Do you have any pets?</p>
                <p className="text-xs text-muted-foreground">Let the host know upfront</p>
              </div>
              <Switch checked={formData.hasPets} onCheckedChange={(v) => update({ hasPets: v })} />
            </div>
            {formData.hasPets && (
              <div>
                <Label>Pet Details</Label>
                <Input value={formData.petDetails} onChange={(e) => update({ petDetails: e.target.value })} placeholder="One small dog, 15 lbs" className="mt-1" />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Any prior evictions?</p>
                <p className="text-xs text-muted-foreground">Honesty builds trust</p>
              </div>
              <Switch checked={formData.priorEvictions} onCheckedChange={(v) => update({ priorEvictions: v })} />
            </div>
            {formData.priorEvictions && (
              <div>
                <Label>Please explain briefly</Label>
                <Textarea value={formData.evictionDetails} onChange={(e) => update({ evictionDetails: e.target.value })} rows={2} className="mt-1 resize-none" placeholder="Brief explanation..." />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Step 2: Renter Application
        </DialogTitle>
        <DialogDescription>
          {screen + 1} of {TOTAL_SCREENS} • Takes about 2 minutes
        </DialogDescription>
      </DialogHeader>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
          <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= screen ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          {screenContent()}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={screen === 0 ? onBack : () => setScreen(screen - 1)}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          {screen === 0 ? "Back" : "Previous"}
        </Button>
        <div className="flex-1" />
        {screen < TOTAL_SCREENS - 1 ? (
          <Button size="sm" onClick={() => setScreen(screen + 1)} disabled={!canNext()}>
            Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={saving || !canNext()}>
            {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
            {saving ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </div>
    </>
  );
};

export default RenterApplicationForm;
