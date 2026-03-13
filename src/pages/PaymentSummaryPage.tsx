import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Loader2, Lock, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlatformFeeTooltip, { PLATFORM_FEE_PERCENT } from "@/components/PlatformFeeTooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentSummaryPage = () => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const monthlyRent = 2500;
  const securityDeposit = 2500;
  const serviceFee = monthlyRent * PLATFORM_FEE_PERCENT / 100;
  const totalDueToday = monthlyRent + securityDeposit + serviceFee;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      {/* Scrollable content area with bottom padding for sticky button */}
      <div className="flex-1 overflow-y-auto pb-32 sm:pb-8">
        <div className="container max-w-lg px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="mb-1 text-2xl sm:text-3xl font-bold text-foreground">Payment Summary</h1>
          <p className="mb-6 sm:mb-8 text-sm sm:text-base text-muted-foreground">Review and confirm your payment</p>

          <Card className="mb-5 sm:mb-6 shadow-card">
            <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Month's Rent</span>
                <span className="font-medium text-foreground">${monthlyRent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium text-foreground">${securityDeposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  Platform Service Fee
                  <PlatformFeeTooltip amount={monthlyRent} />
                </span>
                <span className="font-medium text-foreground">${serviceFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Total Due Today</span>
                <span className="text-primary">${totalDueToday.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Going Forward</span>
                <span className="font-medium text-foreground">${(monthlyRent + monthlyRent * PLATFORM_FEE_PERCENT / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Security badge */}
          <div className="mb-5 sm:mb-6 rounded-lg border bg-accent/30 p-3 sm:p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mb-1 inline h-4 w-4 text-primary" /> You'll be redirected to Stripe's secure checkout. Your card information is never stored on our servers.
          </div>

          {/* Accepted payment methods */}
          <div className="mb-5 sm:mb-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>Apple Pay</span>
            <span>•</span>
            <span>Google Pay</span>
          </div>

          {/* Terms checkbox - larger tap target on mobile */}
          <div className="mb-6 flex items-start gap-3 min-h-[48px]">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
              I agree to the payment schedule and sublet terms. I understand the security deposit will be held until the end of the sublet period.
            </label>
          </div>

          {/* Desktop-only button (hidden on mobile where sticky shows) */}
          <div className="hidden sm:block">
            <Button
              size="lg"
              className="w-full h-12"
              disabled={!agreed || loading}
              onClick={handleCheckout}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-1.5 h-4 w-4" />
              )}
              {loading ? "Redirecting to Stripe..." : `Pay $${totalDueToday.toFixed(2)} Securely`}
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md p-4 sm:hidden safe-bottom">
        <Button
          size="lg"
          className="w-full h-[52px] text-base font-semibold"
          disabled={!agreed || loading}
          onClick={handleCheckout}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Lock className="mr-1.5 h-4 w-4" />
          )}
          {loading ? "Redirecting..." : `Pay $${totalDueToday.toFixed(2)} Securely`}
        </Button>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
};

export default PaymentSummaryPage;
