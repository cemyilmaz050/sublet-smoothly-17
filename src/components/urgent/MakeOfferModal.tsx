import { useState, useEffect } from "react";
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
import { CalendarIcon, Zap, Loader2, Check, ShieldCheck, Home } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
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
    photos?: string[] | null;
    urgency_deadline?: string | null;
    available_from?: string | null;
    available_until?: string | null;
  };
  /** Pre-fill for counter-offer response */
  prefill?: {
    counterAmount: number;
    offerId: string;
    round: number;
    originalOffer: number;
  } | null;
}

type Step = "form" | "review" | "sent";

const MakeOfferModal = ({ open, onClose, listing, prefill }: Props) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const askingPrice = listing.asking_price || listing.monthly_rent || 0;

  const [step, setStep] = useState<Step>("form");

  const [offerAmount, setOfferAmount] = useState(prefill?.counterAmount || Math.round(askingPrice * 0.85));
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [duration, setDuration] = useState(3);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("");

  // Available date range
  const availFrom = listing.available_from ? new Date(listing.available_from) : new Date();
  const availUntil = listing.available_until ? new Date(listing.available_until) : undefined;
  const fullPeriodMonths = availUntil ? Math.max(1, differenceInMonths(availUntil, availFrom)) : undefined;

  const savings = askingPrice - offerAmount;
  const sliderMin = Math.round(askingPrice * 0.5);
  const sliderMax = askingPrice;

  // Countdown timer for sent screen
  useEffect(() => {
    if (step !== "sent" || !expiresAt) return;
    const update = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) { setCountdown("Expired"); return; }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${h}h ${m}m`);
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [step, expiresAt]);

  const handleSubmit = async () => {
    if (!user || !agreed) return;
    setSubmitting(true);
    try {
      if (prefill) {
        // This is a counter-response — accept or counter the offer
        const { error } = await supabase.from("offers" as any).update({
          offer_amount: offerAmount,
          status: "pending",
          round: prefill.round + 1,
        } as any).eq("id", prefill.offerId);
        if (error) throw error;

        // Insert counter_offer record
        await supabase.from("counter_offers" as any).insert({
          offer_id: prefill.offerId,
          made_by: user.id,
          amount: offerAmount,
          message: message || null,
        } as any);

        const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        setExpiresAt(exp);
      } else {
        // New offer
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

        const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        setExpiresAt(exp);

        // Notify tenant
        await supabase.from("notifications").insert({
          user_id: listing.tenant_id,
          title: "New offer received",
          message: `${user.user_metadata?.first_name || "A renter"} offered $${offerAmount.toLocaleString()}/mo for your listing at ${listing.address || listing.headline || "your property"}. Respond within 24 hours.`,
          type: "offer",
          link: "/tenant/dashboard",
        });
      }

      setStep("sent");
    } catch (err: any) {
      toast.error(err.message || "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setAgreed(false);
    setMessage("");
    setMoveInDate(undefined);
    setDuration(3);
    setOfferAmount(prefill?.counterAmount || Math.round(askingPrice * 0.85));
    onClose();
  };

  const renderContent = () => {
    if (step === "sent") {
      return (
        <div className="flex flex-col items-center py-8 text-center space-y-4 px-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Your offer has been sent</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            The subletter has 24 hours to respond. We'll notify you the moment they reply.
          </p>
          {countdown && (
            <p className="text-sm font-semibold text-primary">
              Offer expires in {countdown}
            </p>
          )}
          <div className="flex gap-3 w-full max-w-xs pt-2">
            <Button variant="outline" onClick={() => { handleClose(); window.location.href = "/listings"; }} className="flex-1 rounded-full">
              Browse more
            </Button>
            <Button onClick={() => { handleClose(); window.location.href = "/dashboard/subtenant"; }} className="flex-1 rounded-full">
              My Dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (step === "review") {
      return (
        <div className="space-y-5 px-1">
          {prefill && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              The subletter countered your ${prefill.originalOffer.toLocaleString()} offer with ${prefill.counterAmount.toLocaleString()}/mo
            </div>
          )}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Your offer</span><span className="font-bold">${offerAmount.toLocaleString()}/mo</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Duration</span><span className="font-semibold">{duration} month{duration !== 1 ? "s" : ""}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total you pay</span><span className="font-bold text-primary">${(offerAmount * duration).toLocaleString()}</span></div>
            {moveInDate && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Move-in</span><span className="font-semibold">{format(moveInDate, "MMM d, yyyy")}</span></div>}
            {message && <div className="pt-2 border-t"><p className="text-sm text-muted-foreground italic">"{message}"</p></div>}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your offer is not binding until the subletter accepts and both parties sign the agreement
          </p>

          <div className="flex items-start gap-3">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
            <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
              I confirm I am ready to move forward if this offer is accepted
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("form")} className="flex-1 rounded-full" size="lg">Back</Button>
            <Button onClick={handleSubmit} disabled={!agreed || submitting} className="flex-1 rounded-full" size="lg">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Zap className="mr-1 h-4 w-4" />Send Offer</>}
            </Button>
          </div>
        </div>
      );
    }

    // FORM step
    return (
      <div className="space-y-5 px-1">
        {/* Listing summary */}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          {listing.photos?.[0] ? (
            <img src={listing.photos[0]} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted shrink-0">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{listing.headline || listing.address || "Listing"}</p>
            {listing.address && listing.headline && <p className="text-xs text-muted-foreground truncate">{listing.address}</p>}
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm font-bold text-foreground">Asking: ${askingPrice.toLocaleString()}/mo</span>
              {listing.urgency_deadline && (
                <span className="text-xs text-amber-600">Needs filled by {format(new Date(listing.urgency_deadline), "MMM d")}</span>
              )}
            </div>
          </div>
        </div>

        {prefill && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            The subletter countered your ${prefill.originalOffer.toLocaleString()} offer with ${prefill.counterAmount.toLocaleString()}/mo
          </div>
        )}

        {/* Offer amount */}
        <div>
          <Label className="text-base font-semibold">Your monthly offer</Label>
          <Input
            type="number"
            inputMode="numeric"
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
          {savings > 0 ? (
            <p className="text-sm text-emerald-600 font-medium mt-2 text-center">
              You save ${savings.toLocaleString()}/mo vs asking price
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2 text-center">At asking price</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <Label>How long do you need it?</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[1, 2, 3].map((m) => (
              <button
                key={m}
                onClick={() => setDuration(m)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  duration === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-accent"
                )}
              >
                {m} month{m !== 1 ? "s" : ""}
              </button>
            ))}
            {fullPeriodMonths && fullPeriodMonths > 3 && (
              <button
                onClick={() => setDuration(fullPeriodMonths)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  duration === fullPeriodMonths
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-accent"
                )}
              >
                Full period ({fullPeriodMonths}mo)
              </button>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground mt-2">
            Total you would pay: ${(offerAmount * duration).toLocaleString()}
          </p>
        </div>

        {/* Move-in date */}
        <div>
          <Label>When can you move in?</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("mt-1.5 w-full justify-start text-left font-normal", !moveInDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {moveInDate ? format(moveInDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <Calendar
                mode="single"
                selected={moveInDate}
                onSelect={setMoveInDate}
                disabled={(d) => d < availFrom || (availUntil ? d > availUntil : false)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Message */}
        <div>
          <Label>Message to subletter (optional)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            maxLength={200}
            placeholder="e.g. I am a graduate student looking for a place while interning in Boston this summer"
            className="mt-1.5"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">{message.length}/200</p>
        </div>

        <Button onClick={() => setStep("review")} className="w-full rounded-full" size="lg" disabled={offerAmount < sliderMin}>
          Review Offer
        </Button>
      </div>
    );
  };

  const getTitle = () => {
    if (step === "sent") return "";
    if (step === "review") return "Review Your Offer";
    return prefill ? "Respond to Counter Offer" : "Make an Offer";
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>{getTitle()}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">{renderContent()}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
