import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText, CheckCircle2, Clock, PenLine, Loader2, Home, Calendar, DollarSign, User, ShieldCheck, AlertCircle,
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

const steps = [
  { label: "Agreement", step: 1 },
  { label: "Signatures", step: 2 },
  { label: "Payment", step: 3 },
  { label: "Confirmed", step: 4 },
];

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
    const { data, error } = await supabase.from("sublet_agreements").select("*").eq("id", agreementId).single();
    if (error) { toast.error("Agreement not found"); setLoading(false); return; }
    setAgreement(data as Agreement);
    setLoading(false);
  };

  const handleSign = async () => {
    if (!agreement || !user) return;
    setSigning(true);
    const isTenant = user.id === agreement.tenant_id;
    const isSubtenant = user.id === agreement.subtenant_id;
    const updateField = isTenant ? { tenant_signed_at: new Date().toISOString() } : isSubtenant ? { subtenant_signed_at: new Date().toISOString() } : null;
    if (!updateField) { toast.error("You are not a party to this agreement"); setSigning(false); return; }
    const bothSigned = isTenant ? agreement.subtenant_signed_at !== null : agreement.tenant_signed_at !== null;
    const newStatus = bothSigned ? "fully_signed" : "pending_signatures";
    const { error } = await supabase.from("sublet_agreements").update({ ...updateField, status: newStatus }).eq("id", agreement.id);
    if (error) { toast.error("Failed to sign."); setSigning(false); return; }
    const otherPartyId = isTenant ? agreement.subtenant_id : agreement.tenant_id;
    const signerName = isTenant ? agreement.tenant_name : agreement.subtenant_name;
    if (bothSigned) {
      await Promise.all([
        supabase.from("notifications").insert({ user_id: agreement.tenant_id, title: "Agreement Fully Signed", message: `The sublet agreement for ${agreement.property_address} has been signed by both parties.`, type: "agreement", link: `/agreement?id=${agreement.id}` }),
        supabase.from("notifications").insert({ user_id: agreement.subtenant_id, title: "Agreement Fully Signed", message: `The sublet agreement for ${agreement.property_address} has been signed by both parties.`, type: "agreement", link: `/agreement?id=${agreement.id}` }),
      ]);
    } else {
      await supabase.from("notifications").insert({ user_id: otherPartyId, title: "Agreement Signed", message: `${signerName} has signed the sublet agreement for ${agreement.property_address}.`, type: "agreement", link: `/agreement?id=${agreement.id}` });
    }
    toast.success(bothSigned ? "Agreement fully signed!" : "You've signed the agreement!");
    await fetchAgreement();
    setSigning(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!agreement) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-xl font-bold text-foreground">Agreement Not Found</h1>
      <p className="mt-2 text-muted-foreground">This agreement may have been removed.</p>
      <Button className="mt-6 rounded-full" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
    </div>
  );

  const isTenant = user?.id === agreement.tenant_id;
  const isSubtenant = user?.id === agreement.subtenant_id;
  const hasSigned = isTenant ? !!agreement.tenant_signed_at : !!agreement.subtenant_signed_at;
  const isFullySigned = agreement.status === "fully_signed";
  const isCancelled = agreement.status === "cancelled";

  // Determine current step
  const currentStep = isFullySigned ? 4 : (agreement.tenant_signed_at || agreement.subtenant_signed_at) ? 2 : 1;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <h1 className="text-3xl font-bold text-foreground">Sublet Agreement</h1>
        <p className="mt-1 text-muted-foreground">Review and sign the sublet agreement</p>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 mt-10 mb-10">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  s.step < currentStep ? "bg-primary text-primary-foreground" :
                  s.step === currentStep ? "border-2 border-primary text-primary bg-card" :
                  "border-2 border-border text-muted-foreground bg-card"
                }`}>
                  {s.step < currentStep ? <CheckCircle2 className="h-5 w-5" /> : s.step}
                </div>
                <span className={`mt-2 text-xs font-medium ${s.step === currentStep ? "text-primary" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mt-[-20px] ${s.step < currentStep ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Sublet Agreement Card */}
        <div className="rounded-2xl border bg-card shadow-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Sublet Agreement</h2>
          </div>
          <div className="rounded-xl border bg-secondary/30 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Tenant:</p>
                <p className="font-semibold text-foreground">{agreement.tenant_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subtenant:</p>
                <p className="font-semibold text-foreground">{agreement.subtenant_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property:</p>
                <p className="font-semibold text-foreground">{agreement.property_address}{agreement.unit_number ? `, Unit ${agreement.unit_number}` : ""}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration:</p>
                <p className="font-semibold text-foreground">{format(new Date(agreement.start_date), "MMM d")} – {format(new Date(agreement.end_date), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent:</p>
                <p className="font-semibold text-foreground">${agreement.monthly_rent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Deposit:</p>
                <p className="font-semibold text-foreground">${agreement.deposit_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* E-Signatures Card */}
        <div className="rounded-2xl border bg-card shadow-card p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">E-Signatures</h2>
          <div className="space-y-3">
            {/* Tenant */}
            <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${agreement.tenant_signed_at ? "bg-emerald/10" : "bg-muted"}`}>
                  {agreement.tenant_signed_at ? <CheckCircle2 className="h-5 w-5 text-emerald" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                </div>
                <span className="font-medium text-foreground">Tenant ({agreement.tenant_name})</span>
              </div>
              {agreement.tenant_signed_at ? (
                <span className="text-sm font-semibold text-emerald">Signed</span>
              ) : isTenant ? (
                <Button size="sm" className="rounded-full" onClick={handleSign} disabled={signing}>
                  {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Now"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full" disabled>Sign Now</Button>
              )}
            </div>

            {/* Subtenant */}
            <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${agreement.subtenant_signed_at ? "bg-emerald/10" : "bg-muted"}`}>
                  {agreement.subtenant_signed_at ? <CheckCircle2 className="h-5 w-5 text-emerald" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                </div>
                <span className="font-medium text-foreground">Subtenant ({agreement.subtenant_name})</span>
              </div>
              {agreement.subtenant_signed_at ? (
                <span className="text-sm font-semibold text-emerald">Signed</span>
              ) : isSubtenant ? (
                <Button size="sm" className="rounded-full" onClick={handleSign} disabled={signing}>
                  {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Now"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full" disabled>Sign Now</Button>
              )}
            </div>

            {/* Property Manager */}
            <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Property Manager</span>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" disabled>Sign Now</Button>
            </div>
          </div>
        </div>

        {isCancelled && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">This agreement has been cancelled</p>
              <p className="text-xs text-muted-foreground">The booking was refunded and this agreement is no longer active.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgreementPage;
