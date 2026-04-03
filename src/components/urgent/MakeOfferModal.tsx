import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Zap, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  open: boolean;
  onClose: () => void;
  listing: {
    id: string;
    headline: string | null;
    address: string | null;
    asking_price?: number | null;
    monthly_rent?: number | null;
    tenant_id: string;
  };
}

const MakeOfferModal = ({ open, onClose, listing }: Props) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const askingPrice = listing.asking_price || listing.monthly_rent || 0;

  const [step, setStep] = useState<1 | 2>(1);
  const [offerAmount, setOfferAmount] = useState(Math.round(askingPrice * 0.85));
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [duration, setDuration] = useState(3);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const savings = askingPrice - offerAmount;
  const sliderMin = Math.round(askingPrice * 0.5);
  const sliderMax = askingPrice;

  const handleSubmit = async () => {
    if (!user || !agreed) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("offers" as any).insert({
        listing_id: listing.id,
        subtenant_id: user.id,
        offer_amount: offerAmount,
        asking_amount: askingPrice,
        message: message || null,
        move_in_date: moveInDate ? format(moveInDate, "yyyy-MM-dd") : null,
        duration_months: duration,
        status: "pending",
      } as any);
      if (error) throw error;

      // Notify tenant
      await supabase.from("notifications").insert({
        user_id: listing.tenant_id,
        title: "New offer received!",
        message: `Someone offered $${offerAmount.toLocaleString()}/mo for your listing at ${listing.address || listing.headline || "your property"}`,
        type: "offer",
        link: "/tenant/dashboard",
      });

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSubmitted(false);
    setAgreed(false);
    onClose();
  };

  const content = submitted ? (
    <div className="flex flex-col items-center py-8 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Check className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-xl font-bold text-foreground">Your offer has been sent!</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        The tenant has 24 hours to respond. We'll notify you when they do.
      </p>
      <Button onClick={handleClose} className="rounded-full mt-4">Done</Button>
    </div>
  ) : step === 1 ? (
    <div className="space-y-5 px-1">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Asking: <span className="font-semibold text-foreground">${askingPrice.toLocaleString()}/mo</span></p>
      </div>

      <div>
        <Label className="text-base font-semibold">Your offer per month</Label>
        <Input
          type="number"
          value={offerAmount}
          onChange={(e) => setOfferAmount(Math.max(sliderMin, Math.min(sliderMax, Number(e.target.value) || 0)))}
          className="mt-2 text-center text-2xl font-bold h-14"
        />
        <Slider
          value={[offerAmount]}
          min={sliderMin}
          max={sliderMax}
          step={25}
          onValueChange={([v]) => setOfferAmount(v)}
          className="mt-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>${sliderMin.toLocaleString()}</span>
          <span>${sliderMax.toLocaleString()}</span>
        </div>
        {savings > 0 && (
          <p className="text-sm text-emerald-600 font-medium mt-2 text-center">
            You save ${savings.toLocaleString()}/mo vs asking price
          </p>
        )}
      </div>

      <div>
        <Label>Move-in date preference</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("mt-1.5 w-full justify-start text-left font-normal", !moveInDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {moveInDate ? format(moveInDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start">
            <Calendar mode="single" selected={moveInDate} onSelect={setMoveInDate} disabled={(d) => d < new Date()} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Duration (months)</Label>
        <Input type="number" min={1} max={12} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 1)} className="mt-1.5" />
      </div>

      <div>
        <Label>Add a note (optional)</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 200))} maxLength={200} placeholder="Tell the tenant about yourself..." className="mt-1.5" rows={3} />
        <p className="text-xs text-muted-foreground mt-1">{message.length}/200</p>
      </div>

      <Button onClick={() => setStep(2)} className="w-full rounded-full bg-primary" size="lg" disabled={offerAmount < sliderMin}>
        Review Offer
      </Button>
    </div>
  ) : (
    <div className="space-y-5 px-1">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Your offer</span><span className="font-bold">${offerAmount.toLocaleString()}/mo</span></div>
        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Duration</span><span className="font-semibold">{duration} month{duration !== 1 ? "s" : ""}</span></div>
        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total you pay</span><span className="font-bold text-primary">${(offerAmount * duration).toLocaleString()}</span></div>
        {moveInDate && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Move-in</span><span className="font-semibold">{format(moveInDate, "MMM d, yyyy")}</span></div>}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id="agree" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
        <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
          I understand this is a non-binding offer until the tenant accepts
        </label>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full" size="lg">Back</Button>
        <Button onClick={handleSubmit} disabled={!agreed || submitting} className="flex-1 rounded-full" size="lg">
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Zap className="mr-1 h-4 w-4" />Send Offer</>}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{submitted ? "" : step === 1 ? "Make an Offer" : "Review Your Offer"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{submitted ? "" : step === 1 ? "Make an Offer" : "Review Your Offer"}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
