import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  Clock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useRenterVerification } from "@/hooks/useRenterVerification";
import CancellationPolicy from "@/components/CancellationPolicy";
import RenterVerificationGate from "@/components/RenterVerificationGate";
import VerificationSuccessScreen from "@/components/VerificationSuccessScreen";

interface SecureThisPlaceProps {
  listing: {
    id: string;
    headline: string | null;
    monthly_rent: number | null;
    tenant_id: string;
  };
}

const PLATFORM_FEE_PERCENT = 6;
const DEPOSIT_MONTHS = 1;

const SecureThisPlace = ({ listing }: SecureThisPlaceProps) => {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const { isFullyVerified } = useRenterVerification();
  const [tenantProfile, setTenantProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
  } | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState<Date | undefined>();
  const [schedulingTime, setSchedulingTime] = useState("10:00");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [scheduleSent, setScheduleSent] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Verification gate state
  const [showGate, setShowGate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingAction, setPendingAction] = useState<"schedule" | "payment" | null>(null);

  useEffect(() => {
    if (!listing.tenant_id) return;
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", listing.tenant_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setTenantProfile(data); });
  }, [listing.tenant_id]);

  const monthlyRent = listing.monthly_rent ?? 0;
  const weeklyRent = Math.round(monthlyRent / 4);
  const depositAmount = monthlyRent * DEPOSIT_MONTHS;
  const platformFee = Math.round(monthlyRent * (PLATFORM_FEE_PERCENT / 100));
  const totalDue = depositAmount + platformFee;

  const withAuth = (action: () => void) => {
    if (!user) {
      requireAuth(action);
      return;
    }
    action();
  };

  const withVerification = (action: "schedule" | "payment") => {
    withAuth(() => {
      if (!isFullyVerified) {
        setPendingAction(action);
        setShowGate(true);
        return;
      }
      if (action === "schedule") setShowScheduleModal(true);
      else setShowPaymentModal(true);
    });
  };

  const handleVerified = () => {
    setShowGate(false);
    setShowSuccess(true);
  };

  const handleSuccessDismiss = () => {
    setShowSuccess(false);
    if (pendingAction === "schedule") setShowScheduleModal(true);
    else if (pendingAction === "payment") setShowPaymentModal(true);
    setPendingAction(null);
  };

  const handleScheduleClick = () => {
    withVerification("schedule");
  };

  const handlePaymentClick = () => {
    withVerification("payment");
  };

  const handleScheduleSubmit = async () => {
    if (!user) return;
    if (!schedulingDate) { toast.error("Pick a date first!"); return; }

    setSubmittingSchedule(true);

    const { data: existing } = await supabase
      .from("conversations").select("id")
      .eq("listing_id", listing.id)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .maybeSingle();

    let convoId = existing?.id;

    if (!convoId) {
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ participant_1: user.id, participant_2: listing.tenant_id, listing_id: listing.id })
        .select("id").single();
      if (error || !newConvo) { toast.error("Couldn't start a conversation. Try again!"); setSubmittingSchedule(false); return; }
      convoId = newConvo.id;
    }

    const dateStr = format(schedulingDate, "EEEE, MMMM d, yyyy");
    const content = `📅 Meeting Request\n\nHey! I'd love to come check out the place on ${dateStr} at ${schedulingTime}.${scheduleMessage ? `\n\n${scheduleMessage}` : ""}`;

    await supabase.from("meetings" as any).insert({
      listing_id: listing.id,
      requester_id: user.id,
      host_id: listing.tenant_id,
      conversation_id: convoId,
      meeting_date: format(schedulingDate, "yyyy-MM-dd"),
      meeting_time: schedulingTime,
      message: scheduleMessage || null,
      status: "pending",
    });

    await supabase.from("messages").insert({ conversation_id: convoId, sender_id: user.id, content });
    await supabase.from("notifications").insert({
      user_id: listing.tenant_id, title: "Someone wants to check out your place! 📅",
      message: `They want to visit "${listing.headline || "your apartment"}" on ${dateStr} at ${schedulingTime}`,
      type: "meeting", link: "/messages",
    });

    supabase.functions.invoke("send-notification-email", {
      body: {
        to: listing.tenant_id,
        subject: `Someone wants to check out ${listing.headline || "your listing"}`,
        type: "meeting_request",
        data: {
          listing_title: listing.headline || "Your apartment",
          meeting_date: dateStr,
          meeting_time: schedulingTime,
          message: scheduleMessage,
          action_url: `${window.location.origin}/messages`,
        },
      },
    }).catch(() => {});

    setSubmittingSchedule(false);
    setScheduleSent(true);
    toast.success("Meeting request sent!");
  };

  const handleSecureNow = async () => {
    if (!user) return;
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          listingId: listing.id,
          depositAmount: depositAmount,
          platformFee: platformFee,
          totalAmount: totalDue,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Oops! Payment setup didn't work. Give it another shot.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const tenantName = tenantProfile?.first_name || "Host";
  const tenantInitial = tenantName.charAt(0).toUpperCase();

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  ];

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base sm:text-lg shrink-0">
          {tenantInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Listed by {tenantName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" /> Usually responds within a few hours
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-xs border-emerald/30 text-emerald shrink-0">
          <ShieldCheck className="h-3 w-3" /> Verified
        </Badge>
      </div>

      <div className="h-px bg-border" />
      
      {monthlyRent > 0 && (
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">${monthlyRent.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-muted-foreground">~${weeklyRent.toLocaleString()}/week</p>
          {monthlyRent < 2000 && (
            <p className="mt-1 text-xs text-emerald font-medium">Cheaper than a Boston hotel for the summer</p>
          )}
        </div>
      )}

      <Button variant="outline" className="w-full justify-start gap-2 h-12 text-sm" onClick={handleScheduleClick}>
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <div className="text-left min-w-0">
          <span className="font-semibold">Come check it out</span>
          <span className="block text-xs text-muted-foreground truncate">Visit the apartment or meet the host</span>
        </div>
      </Button>

      <Button className="w-full justify-start gap-2 h-12 text-sm" onClick={handlePaymentClick}>
        <Lock className="h-4 w-4 shrink-0" />
        <div className="text-left min-w-0">
          <span className="font-semibold">Lock it in</span>
          <span className="block text-xs text-primary-foreground/80 truncate">Pay deposit to reserve this place</span>
        </div>
      </Button>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald shrink-0" />
        Your deposit is protected until move-in is confirmed.
      </p>

      {/* Verification Gate */}
      <RenterVerificationGate open={showGate} onOpenChange={setShowGate} onVerified={handleVerified} action={pendingAction || undefined} />
      <VerificationSuccessScreen open={showSuccess} onClose={handleSuccessDismiss} />

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={(open) => { setShowScheduleModal(open); if (!open) { setScheduleSent(false); setSchedulingDate(undefined); setScheduleMessage(""); } }}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Come check it out 👀</DialogTitle>
            <DialogDescription>Pick a day and time to visit {listing.headline || "this place"}.</DialogDescription>
          </DialogHeader>
          {scheduleSent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-emerald" />
              <p className="text-sm font-semibold text-foreground">Request sent! 🎉</p>
              <p className="text-xs text-muted-foreground text-center">{tenantName} will get back to you soon.</p>
              <Button variant="outline" className="h-12 min-w-[120px]" onClick={() => setShowScheduleModal(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !schedulingDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {schedulingDate ? format(schedulingDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={schedulingDate} onSelect={setSchedulingDate} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Time</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {timeSlots.map((t) => (
                    <Button key={t} variant={schedulingTime === t ? "default" : "outline"} size="sm" className="text-xs h-11 sm:h-8" onClick={() => setSchedulingTime(t)}>{t}</Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Say hi 👋 <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea placeholder="Hey! I'm a BU student looking for a summer sublet..." value={scheduleMessage} onChange={(e) => setScheduleMessage(e.target.value)} rows={3} className="resize-none text-base" />
              </div>
              <Button className="w-full h-12" onClick={handleScheduleSubmit} disabled={submittingSchedule || !schedulingDate}>
                {submittingSchedule ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Sending...</> : <><CalendarDays className="mr-1 h-4 w-4" /> Send Request</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-sm max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lock it in 🔒</DialogTitle>
            <DialogDescription>Reserve {listing.headline || "this place"} with a deposit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security Deposit ({DEPOSIT_MONTHS} mo)</span>
                <span className="font-semibold text-foreground">${depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span className="font-semibold text-foreground">${platformFee.toLocaleString()}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Due Today</span>
                <span className="text-lg font-bold text-primary">${totalDue.toLocaleString()}</span>
              </div>
            </div>

            <CancellationPolicy compact />

            <div className="flex items-start gap-2 rounded-lg bg-emerald/10 p-3">
              <ShieldCheck className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
              <p className="text-xs text-emerald leading-relaxed">Your deposit is fully protected. If move-in isn't confirmed, you get a full refund.</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Visa</span><span>•</span><span>Mastercard</span><span>•</span><span>Apple Pay</span><span>•</span><span>Google Pay</span>
            </div>

            <Button className="w-full h-[52px] text-base font-semibold" onClick={handleSecureNow} disabled={paymentLoading}>
              {paymentLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Lock className="mr-1.5 h-4 w-4" />
              )}
              {paymentLoading ? "Processing..." : `Pay $${totalDue.toLocaleString()} & Lock It In`}
            </Button>
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Secure checkout powered by Stripe
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecureThisPlace;
