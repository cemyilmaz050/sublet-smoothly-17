import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check, Loader2, Send, MapPin, Calendar, DollarSign, Camera, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import CalendarRangePicker from "@/components/sublet-flow/CalendarRangePicker";
import UniversalPhotoUploader from "@/components/UniversalPhotoUploader";

interface FriendSubletFlowProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = ["friend", "property", "details", "send"] as const;
type Step = typeof STEPS[number];

const FriendSubletFlow = ({ open, onClose }: FriendSubletFlowProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Friend details
  const [friendEmail, setFriendEmail] = useState("");
  const [friendName, setFriendName] = useState("");

  // Property details
  const [address, setAddress] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const currentStep = STEPS[step];
  const progressPct = ((step + 1) / STEPS.length) * 100;

  const userName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Someone";

  const canProceed = () => {
    switch (currentStep) {
      case "friend":
        return friendEmail.trim().length > 0 && friendEmail.includes("@");
      case "property":
        return address.trim().length > 0;
      case "details":
        return monthlyRent && availableFrom && availableUntil;
      case "send":
        return true;
      default:
        return false;
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const back = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleClose = () => {
    setStep(0);
    setFriendEmail("");
    setFriendName("");
    setAddress("");
    setUnitNumber("");
    setMonthlyRent("");
    setSecurityDeposit("");
    setAvailableFrom("");
    setAvailableUntil("");
    setDescription("");
    setPhotoUrls([]);
    setSent(false);
    setSending(false);
    onClose();
  };

  const handleSend = async () => {
    if (!user) { toast.error("Please sign in first."); return; }
    setSending(true);

    try {
      // 1. Create draft listing
      const { data: listing, error: listingErr } = await supabase.from("listings").insert({
        tenant_id: user.id,
        address: `${address}${unitNumber ? `, ${unitNumber}` : ""}`,
        unit_number: unitNumber || null,
        monthly_rent: parseFloat(monthlyRent) || null,
        security_deposit: parseFloat(securityDeposit) || null,
        available_from: availableFrom,
        available_until: availableUntil,
        description: description || null,
        photos: photoUrls,
        status: "draft" as const,
        source: "friend_sublet",
        path: "own",
      }).select("id").single();

      if (listingErr) throw listingErr;

      // 2. Create friend invite
      const { data: invite, error: inviteErr } = await (supabase.from("friend_sublet_invites" as any).insert({
        inviter_id: user.id,
        friend_email: friendEmail.trim().toLowerCase(),
        friend_name: friendName || null,
        listing_id: listing.id,
        monthly_rent: parseFloat(monthlyRent) || null,
        deposit_amount: parseFloat(securityDeposit) || null,
        address: `${address}${unitNumber ? `, ${unitNumber}` : ""}`,
        available_from: availableFrom,
        available_until: availableUntil,
        photo_url: photoUrls[0] || null,
      }).select("token").single() as any);

      if (inviteErr) throw inviteErr;

      // 3. Send invite email via edge function
      const { error: emailErr } = await supabase.functions.invoke("send-friend-invite", {
        body: {
          invite_token: invite.token,
          friend_email: friendEmail.trim().toLowerCase(),
          friend_name: friendName || null,
          inviter_name: userName,
          address: `${address}${unitNumber ? `, ${unitNumber}` : ""}`,
          monthly_rent: monthlyRent,
          available_from: availableFrom,
          available_until: availableUntil,
        },
      });

      if (emailErr) {
        console.error("Email send error:", emailErr);
        // Don't block — invite was created, they can share the link
      }

      setSent(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#7c3aed", "#a78bfa", "#c4b5fd", "#34d399", "#fbbf24"] });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  // Success screen
  if (sent) {
    const inviteLink = `${window.location.origin}/invite/friend`;
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
        <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Invite sent!</h1>
          <p className="text-muted-foreground">
            We sent {friendName || friendEmail} a link to confirm. They can set everything up in under 3 minutes.
          </p>
          <div className="w-full rounded-xl border bg-muted/30 p-4 text-left space-y-1">
            <p className="text-xs font-medium text-muted-foreground">What happens next</p>
            <p className="text-sm text-foreground">Your friend signs in with Google, confirms the details, and pays the deposit — all from one page.</p>
          </div>
          <div className="flex flex-col gap-2 mt-4 w-full">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 shrink-0">
        <button onClick={() => step > 0 ? back() : handleClose()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "Back" : ""}
        </button>
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

              {currentStep === "friend" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Who's taking over your place?</h1>
                    <p className="text-muted-foreground">We'll send them a link — they can confirm in under 3 minutes</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="friend-name">Their name (optional)</Label>
                      <Input id="friend-name" value={friendName} onChange={e => setFriendName(e.target.value)} placeholder="e.g. Jordan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="friend-email">Their email address</Label>
                      <Input id="friend-email" type="email" value={friendEmail} onChange={e => setFriendEmail(e.target.value)} placeholder="friend@email.com" />
                    </div>
                  </div>
                  <Button onClick={next} disabled={!canProceed()} className="w-full" size="lg">
                    Continue
                  </Button>
                </div>
              )}

              {currentStep === "property" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Where's the place?</h1>
                    <p className="text-muted-foreground">Just the basics — keep it quick</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Boston, MA" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit/Apt number (optional)</Label>
                      <Input value={unitNumber} onChange={e => setUnitNumber(e.target.value)} placeholder="e.g. 4B" />
                    </div>
                    <div className="space-y-2">
                      <Label>Add a photo (optional but recommended)</Label>
                      <UniversalPhotoUploader
                        maxPhotos={5}
                        photoUrls={photoUrls}
                        onPhotoUrlsChange={setPhotoUrls}
                        bucket="listing-photos"
                        storagePath={`friend-sublet/${user?.id || "anon"}`}
                      />
                    </div>
                  </div>
                  <Button onClick={next} disabled={!canProceed()} className="w-full" size="lg">
                    Continue
                  </Button>
                </div>
              )}

              {currentStep === "details" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <DollarSign className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Rent & dates</h1>
                    <p className="text-muted-foreground">Set the terms for your friend</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Monthly rent</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input value={monthlyRent} onChange={e => setMonthlyRent(e.target.value.replace(/[^0-9.]/g, ""))} className="pl-7" placeholder="2,000" inputMode="decimal" />
                      </div>
                      {monthlyRent && (
                        <p className="text-xs text-muted-foreground">≈ ${(parseFloat(monthlyRent) / 4).toFixed(0)}/week</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Security deposit (optional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value.replace(/[^0-9.]/g, ""))} className="pl-7" placeholder="1,000" inputMode="decimal" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>When are they moving in and out?</Label>
                      <CalendarRangePicker
                        availableFrom={availableFrom}
                        availableUntil={availableUntil}
                        onSelect={(from, until) => { setAvailableFrom(from); setAvailableUntil(until); }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Any notes for your friend? (optional)</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. WiFi password is on the fridge, parking spot is #12" rows={3} />
                    </div>
                  </div>
                  <Button onClick={next} disabled={!canProceed()} className="w-full" size="lg">
                    Review & send
                  </Button>
                </div>
              )}

              {currentStep === "send" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Send className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Ready to send</h1>
                    <p className="text-muted-foreground">
                      {friendName || "Your friend"} will get an email with everything they need
                    </p>
                  </div>

                  {/* Summary card */}
                  <div className="rounded-2xl border bg-card p-5 space-y-4">
                    {photoUrls[0] && (
                      <img src={photoUrls[0]} alt="Property" className="w-full h-40 object-cover rounded-xl" />
                    )}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground">{address}{unitNumber ? `, ${unitNumber}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-foreground">${monthlyRent}/month{securityDeposit ? ` · $${securityDeposit} deposit` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-foreground">{availableFrom} → {availableUntil}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-foreground">Sending to {friendName || friendEmail}</p>
                      </div>
                    </div>
                    {description && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm text-foreground mt-1">{description}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-muted/30 border p-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Your friend will sign in, confirm the details, and pay the deposit — all from one page. A sublease agreement is generated automatically.
                    </p>
                  </div>

                  <Button onClick={handleSend} disabled={sending} className="w-full" size="lg">
                    {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : <>Send invite to {friendName || "friend"} <Send className="h-4 w-4 ml-2" /></>}
                  </Button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FriendSubletFlow;
