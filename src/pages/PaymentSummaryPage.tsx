import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlatformFeeTooltip, { PLATFORM_FEE_PERCENT } from "@/components/PlatformFeeTooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentSummaryPage = () => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to proceed with payment.");
        navigate("/sign-up");
      }
    };
    checkAuth();
  }, [navigate]);

  // Mock data
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-lg py-8">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Payment Summary</h1>
        <p className="mb-8 text-muted-foreground">Review and confirm your payment</p>

        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
              <span className="text-muted-foreground">Monthly Amount Going Forward</span>
              <span className="font-medium text-foreground">${(monthlyRent + monthlyRent * PLATFORM_FEE_PERCENT / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 rounded-lg border bg-accent/30 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mb-1 inline h-4 w-4 text-primary" /> You'll be redirected to Stripe's secure checkout to enter your payment details. Your card information is never stored on our servers.
        </div>

        <div className="mb-6 flex items-start gap-3">
          <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <label htmlFor="terms" className="text-sm leading-tight text-muted-foreground">
            I agree to the payment schedule and sublet terms. I understand the security deposit will be held until the end of the sublet period.
          </label>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!agreed || loading}
          onClick={handleCheckout}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-1 h-4 w-4" />
          )}
          {loading ? "Redirecting to Stripe..." : `Subscribe & Pay`}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSummaryPage;
