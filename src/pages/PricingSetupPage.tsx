import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Building2, CreditCard, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlatformFeeTooltip, { PLATFORM_FEE_PERCENT } from "@/components/PlatformFeeTooltip";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PricingSetupPage = () => {
  const navigate = useNavigate();
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const rentNum = parseFloat(rent) || 0;
  const depositNum = parseFloat(deposit) || 0;
  const platformFee = rentNum * PLATFORM_FEE_PERCENT / 100;
  const tenantReceives = rentNum - platformFee;

  const handleSave = () => {
    toast.success("Pricing & payout method saved!");
    navigate("/dashboard/tenant");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Pricing & Payments</h1>
        <p className="mb-8 text-muted-foreground">Set your rent, deposit, and payout preferences</p>

        <div className="space-y-6">
          {/* Pricing */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" /> Set Your Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Monthly Rent ($)</Label>
                  <Input type="number" placeholder="2,500" value={rent} onChange={(e) => setRent(e.target.value)} />
                </div>
                <div>
                  <Label>Security Deposit ($)</Label>
                  <Input type="number" placeholder="2,500" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-foreground">Recurring Monthly Payments</p>
                  <p className="text-sm text-muted-foreground">
                    {isRecurring ? "Subtenant pays monthly" : "Subtenant pays full amount upfront"}
                  </p>
                </div>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {rentNum > 0 && (
            <Card className="border-primary/20 bg-accent shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Payment Schedule Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium text-foreground">${rentNum.toFixed(2)}</span>
                </div>
                {depositNum > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security Deposit (one-time)</span>
                    <span className="font-medium text-foreground">${depositNum.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                  <span className="font-medium text-destructive">-${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-foreground">You Receive (per month)</span>
                  <span className="text-emerald">${tenantReceives.toFixed(2)}</span>
                </div>
                <PlatformFeeTooltip amount={rentNum} />
              </CardContent>
            </Card>
          )}

          {/* Payout Method */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" /> Payout Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your bank account to receive payouts. In production, this will use Stripe Connect.
              </p>
              <div>
                <Label>Account Holder Name</Label>
                <Input placeholder="Jane Smith" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Routing Number</Label>
                  <Input placeholder="021000021" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input type="password" placeholder="••••••••" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-accent p-3 text-xs text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                Stripe Connect integration placeholder — in production, this will securely connect your bank via Stripe.
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleSave}>
            Save Pricing & Payout Method
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingSetupPage;
