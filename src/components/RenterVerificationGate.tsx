import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ShieldCheck, FileText, Users, ArrowRight, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRenterVerification } from "@/hooks/useRenterVerification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StripeIdVerification from "@/components/StripeIdVerification";
import RenterApplicationForm from "@/components/RenterApplicationForm";
import CosignerForm from "@/components/CosignerForm";

interface RenterVerificationGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
  /** What the user is trying to do — shown in the gate message */
  action?: "schedule" | "payment";
}

const RenterVerificationGate = ({ open, onOpenChange, onVerified, action }: RenterVerificationGateProps) => {
  const { user } = useAuth();
  const { idVerified, applicationComplete, cosignerConfirmed, isFullyVerified, loading, refresh } = useRenterVerification();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | null>(null);
  const notifiedRef = useRef(false);

  const getNextIncompleteStep = (): 1 | 2 | 3 | null => {
    if (!idVerified) return 1;
    if (!applicationComplete) return 2;
    if (!cosignerConfirmed) return 3;
    return null;
  };

  // When fully verified, mark profile and notify
  useEffect(() => {
    if (isFullyVerified && open && !notifiedRef.current && user) {
      notifiedRef.current = true;
      supabase.from("profiles").update({ renter_verified: true } as any).eq("id", user.id).then(() => {});
      sendVerificationNotifications(user.id);
      onVerified?.();
      onOpenChange(false);
    }
  }, [isFullyVerified, open, user]);

  const sendVerificationNotifications = async (userId: string) => {
    try {
      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", userId).single();
      const renterName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "A renter";

      const [{ data: knocks }, { data: apps }] = await Promise.all([
        supabase.from("knocks" as any).select("listing_id, tenant_id").eq("knocker_id", userId),
        supabase.from("applications").select("listing_id").eq("applicant_id", userId),
      ]);

      const listingIds = [...new Set([
        ...((knocks as any[]) || []).map((k: any) => k.listing_id),
        ...((apps as any[]) || []).map((a: any) => a.listing_id),
      ])];

      if (listingIds.length === 0) return;

      const { data: listings } = await supabase.from("listings").select("id, tenant_id, manager_id, headline, address").in("id", listingIds);
      if (!listings) return;

      const notifiedUsers = new Set<string>();
      for (const listing of listings) {
        const targets = [listing.tenant_id, listing.manager_id].filter(Boolean);
        for (const targetId of targets) {
          if (!targetId || notifiedUsers.has(targetId) || targetId === userId) continue;
          notifiedUsers.add(targetId);

          await supabase.from("notifications").insert({
            user_id: targetId,
            title: `${renterName} is now fully verified! ✅`,
            message: `${renterName} is now fully verified and ready to book your listing at ${listing.address || listing.headline || "your place"}`,
            type: "verification",
            link: "/dashboard/tenant",
          });

          supabase.functions.invoke("send-notification-email", {
            body: {
              to: targetId,
              subject: `${renterName} is now fully verified on SubIn`,
              type: "renter_verified",
              data: {
                renter_name: renterName,
                listing_title: listing.headline || "your listing",
                listing_address: listing.address || "",
                action_url: `${window.location.origin}/dashboard/tenant`,
              },
            },
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to send verification notifications:", err);
    }
  };

  const steps = [
    {
      num: 1 as const,
      icon: ShieldCheck,
      title: "ID Verification",
      subtitle: "Government-issued ID • Takes 30 seconds",
      complete: idVerified,
      label: idVerified ? "Verified ✓" : "Start",
    },
    {
      num: 2 as const,
      icon: FileText,
      title: "Renter Application",
      subtitle: "A few quick questions • Takes about 2 minutes",
      complete: applicationComplete,
      label: applicationComplete ? "Application Complete ✓" : "Fill Out",
    },
    {
      num: 3 as const,
      icon: Users,
      title: "Co-signer Confirmation",
      subtitle: "Your co-signer confirms via email",
      complete: cosignerConfirmed,
      label: cosignerConfirmed ? "Co-signer Confirmed ✓" : "Add Co-signer",
    },
  ];

  const handleStepComplete = async () => {
    await refresh();
    setActiveStep(null);
  };

  if (activeStep === 1) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setActiveStep(null); } onOpenChange(o); }}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Step 1: ID Verification
            </DialogTitle>
            <DialogDescription>Verify your identity with a government-issued ID. Takes under 30 seconds.</DialogDescription>
          </DialogHeader>
          <StripeIdVerification
            idVerified={idVerified}
            onVerified={handleStepComplete}
          />
          <Button variant="ghost" size="sm" onClick={() => setActiveStep(null)} className="mt-2">
            ← Back to checklist
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (activeStep === 2) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setActiveStep(null); } onOpenChange(o); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <RenterApplicationForm
            onComplete={handleStepComplete}
            onBack={() => setActiveStep(null)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (activeStep === 3) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setActiveStep(null); } onOpenChange(o); }}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Step 3: Co-signer
            </DialogTitle>
            <DialogDescription>Your co-signer will receive an email to confirm. Once they confirm, this step is complete.</DialogDescription>
          </DialogHeader>
          <CosignerForm onComplete={handleStepComplete} />
          <Button variant="ghost" size="sm" onClick={() => setActiveStep(null)} className="mt-2">
            ← Back to checklist
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const actionText = action === "schedule"
    ? "schedule or pay"
    : action === "payment"
      ? "schedule or pay"
      : "continue";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            One quick step
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            One quick step before you can {actionText} — verify your ID to keep SubIn safe for everyone. Takes about 30 seconds 🔒
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const StatusIcon = step.complete ? CheckCircle2 : Circle;

              return (
                <button
                  key={step.num}
                  onClick={() => !step.complete && setActiveStep(step.num)}
                  disabled={step.complete}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                    step.complete
                      ? "border-emerald/30 bg-emerald/5 cursor-default"
                      : "border-primary/20 bg-primary/5 hover:border-primary/40 hover:shadow-sm cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    step.complete ? "bg-emerald/20" : "bg-primary/10"
                  )}>
                    <Icon className={cn("h-5 w-5", step.complete ? "text-emerald" : "text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-semibold", step.complete ? "text-emerald" : "text-foreground")}>
                        {step.title}
                      </p>
                      <StatusIcon className={cn("h-4 w-4 shrink-0", step.complete ? "text-emerald" : "text-muted-foreground/40")} />
                    </div>
                    <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                  </div>
                  {!step.complete && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}

            <div className="rounded-lg bg-accent/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                This takes under 3 minutes · You only do this once on SubIn
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RenterVerificationGate;
