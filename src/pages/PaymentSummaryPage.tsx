import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlatformFeeTooltip, { PLATFORM_FEE_PERCENT } from "@/components/PlatformFeeTooltip";
import { useNavigate } from "react-router-dom";

const PaymentSummaryPage = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  // Mock data
  const monthlyRent = 2500;
  const securityDeposit = 2500;
  const serviceFee = monthlyRent * PLATFORM_FEE_PERCENT / 100;
  const totalDueToday = monthlyRent + securityDeposit + serviceFee;

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

        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Card Number</Label>
              <Input placeholder="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry</Label>
                <Input placeholder="MM / YY" />
              </div>
              <div>
                <Label>CVC</Label>
                <Input placeholder="123" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Stripe Elements placeholder — card data is never stored on our servers.
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex items-start gap-3">
          <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <label htmlFor="terms" className="text-sm leading-tight text-muted-foreground">
            I agree to the payment schedule and sublet terms. I understand the security deposit will be held until the end of the sublet period.
          </label>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!agreed}
          onClick={() => navigate("/payments/confirmation")}
        >
          <ShieldCheck className="mr-1 h-4 w-4" />
          Confirm & Pay ${totalDueToday.toFixed(2)}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSummaryPage;
