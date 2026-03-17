import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import Footer from "@/components/Footer";
import {
  FileText,
  CheckCircle2,
  Clock,
  PenLine,
  Loader2,
  Home,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Agreement {
  id: string;
  booking_id: string;
  listing_id: string;
  tenant_id: string;
  subtenant_id: string;
  property_address: string;
  unit_number: string | null;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit_amount: number;
  tenant_name: string;
  subtenant_name: string;
  tenant_signed_at: string | null;
  subtenant_signed_at: string | null;
  status: string;
  created_at: string;
}

const AgreementPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agreementId = searchParams.get("id");

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!agreementId || !user) return;
    fetchAgreement();
  }, [agreementId, user]);

  const fetchAgreement = async () => {
    const { data, error } = await supabase
      .from("sublet_agreements")
      .select("*")
      .eq("id", agreementId)
      .single();

    if (error) {
      toast.error("Agreement not found");
      setLoading(false);
      return;
    }
    setAgreement(data as Agreement);
    setLoading(false);
  };

  const handleSign = async () => {
    if (!agreement || !user) return;
    setSigning(true);

    const isTenant = user.id === agreement.tenant_id;
    const isSubtenant = user.id === agreement.subtenant_id;

    const updateField = isTenant
      ? { tenant_signed_at: new Date().toISOString() }
      : isSubtenant
      ? { subtenant_signed_at: new Date().toISOString() }
      : null;

    if (!updateField) {
      toast.error("You are not a party to this agreement");
      setSigning(false);
      return;
    }

    // Check if both parties will have signed after this
    const bothSigned = isTenant
      ? agreement.subtenant_signed_at !== null
      : agreement.tenant_signed_at !== null;

    const newStatus = bothSigned ? "fully_signed" : "pending_signatures";

    const { error } = await supabase
      .from("sublet_agreements")
      .update({ ...updateField, status: newStatus })
      .eq("id", agreement.id);

    if (error) {
      toast.error("Failed to sign agreement. Please try again.");
      setSigning(false);
      return;
    }

    // Notify the other party
    const otherPartyId = isTenant ? agreement.subtenant_id : agreement.tenant_id;
    const signerName = isTenant ? agreement.tenant_name : agreement.subtenant_name;

    if (bothSigned) {
      // Notify both that agreement is complete
      await Promise.all([
        supabase.from("notifications").insert({
          user_id: agreement.tenant_id,
          title: "Agreement Fully Signed ✅",
          message: `The sublet agreement for ${agreement.property_address} has been signed by both parties. Your sublet is now confirmed!`,
          type: "agreement",
          link: `/agreement?id=${agreement.id}`,
        }),
        supabase.from("notifications").insert({
          user_id: agreement.subtenant_id,
          title: "Agreement Fully Signed ✅",
          message: `The sublet agreement for ${agreement.property_address} has been signed by both parties. Your sublet is now confirmed!`,
          type: "agreement",
          link: `/agreement?id=${agreement.id}`,
        }),
      ]);
    } else {
      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        title: "Agreement Signed",
        message: `${signerName} has signed the sublet agreement for ${agreement.property_address}. Please review and sign your copy.`,
        type: "agreement",
        link: `/agreement?id=${agreement.id}`,
      });
    }

    toast.success(bothSigned ? "Agreement fully signed!" : "You've signed the agreement!");
    await fetchAgreement();
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground">Agreement Not Found</h1>
          <p className="mt-2 text-muted-foreground">This agreement may have been removed or you don't have access.</p>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isTenant = user?.id === agreement.tenant_id;
  const isSubtenant = user?.id === agreement.subtenant_id;
  const hasSigned = isTenant ? !!agreement.tenant_signed_at : !!agreement.subtenant_signed_at;
  const isFullySigned = agreement.status === "fully_signed";
  const isCancelled = agreement.status === "cancelled";

  const statusBadge = isFullySigned
    ? { label: "Fully Signed", variant: "default" as const, icon: CheckCircle2 }
    : isCancelled
    ? { label: "Cancelled", variant: "destructive" as const, icon: AlertCircle }
    : { label: "Awaiting Signatures", variant: "secondary" as const, icon: Clock };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <div className="flex-1 container max-w-2xl px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sublet Agreement</h1>
            <Badge variant={statusBadge.variant} className="mt-1 gap-1">
              <statusBadge.icon className="h-3 w-3" />
              {statusBadge.label}
            </Badge>
          </div>
        </div>

        {/* Agreement Content */}
        <Card className="mb-6 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agreement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Home className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Property</p>
                  <p className="text-sm font-medium text-foreground">
                    {agreement.property_address}
                    {agreement.unit_number && `, Unit ${agreement.unit_number}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sublet Period</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(agreement.start_date), "MMM d, yyyy")} to {format(new Date(agreement.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="text-sm font-medium text-foreground">${agreement.monthly_rent.toLocaleString()}/mo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Security Deposit</p>
                  <p className="text-sm font-medium text-foreground">${agreement.deposit_amount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Parties */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tenant (Sublessor)</p>
                  <p className="text-sm font-medium text-foreground">{agreement.tenant_name}</p>
                  {agreement.tenant_signed_at ? (
                    <p className="text-xs text-emerald flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Signed {format(new Date(agreement.tenant_signed_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  ) : (
                    <p className="text-xs text-amber flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> Awaiting signature
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Subtenant (Sublessee)</p>
                  <p className="text-sm font-medium text-foreground">{agreement.subtenant_name}</p>
                  {agreement.subtenant_signed_at ? (
                    <p className="text-xs text-emerald flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Signed {format(new Date(agreement.subtenant_signed_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  ) : (
                    <p className="text-xs text-amber flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> Awaiting signature
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Agreement terms text */}
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                This Sublet Agreement ("Agreement") is entered into between <strong className="text-foreground">{agreement.tenant_name}</strong> ("Tenant") and <strong className="text-foreground">{agreement.subtenant_name}</strong> ("Subtenant") for the property located at <strong className="text-foreground">{agreement.property_address}{agreement.unit_number ? `, Unit ${agreement.unit_number}` : ""}</strong>.
              </p>
              <p>
                The Subtenant agrees to pay <strong className="text-foreground">${agreement.monthly_rent.toLocaleString()}</strong> per month for the period from <strong className="text-foreground">{format(new Date(agreement.start_date), "MMMM d, yyyy")}</strong> to <strong className="text-foreground">{format(new Date(agreement.end_date), "MMMM d, yyyy")}</strong>.
              </p>
              <p>
                A security deposit of <strong className="text-foreground">${agreement.deposit_amount.toLocaleString()}</strong> has been collected and will be returned to the Subtenant at the end of the sublet period, minus any deductions for damages or unpaid rent, in accordance with applicable law.
              </p>
              <p>
                Both parties agree to abide by the original lease terms and any building rules. The Subtenant may not further sublet the premises. This agreement is facilitated by SubIn and is binding upon electronic signature by both parties.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sign button */}
        {!isCancelled && (isTenant || isSubtenant) && (
          <div className="space-y-3">
            {hasSigned ? (
              <div className="rounded-lg border bg-emerald/10 p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">You've signed this agreement</p>
                  <p className="text-xs text-muted-foreground">
                    {isFullySigned
                      ? "Both parties have signed. The sublet is confirmed!"
                      : "Waiting for the other party to sign."}
                  </p>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold"
                onClick={handleSign}
                disabled={signing}
              >
                {signing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing...</>
                ) : (
                  <><PenLine className="mr-2 h-5 w-5" /> Sign Agreement</>
                )}
              </Button>
            )}

            {!hasSigned && (
              <p className="text-center text-xs text-muted-foreground">
                By signing, you agree to the terms outlined in this sublet agreement.
              </p>
            )}
          </div>
        )}

        {isCancelled && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">This agreement has been cancelled</p>
              <p className="text-xs text-muted-foreground">The booking was refunded and this agreement is no longer active.</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AgreementPage;
