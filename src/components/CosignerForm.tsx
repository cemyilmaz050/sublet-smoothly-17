import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Clock, Users, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CosignerPendingState = ({
  existing,
  userId,
  onComplete,
  onUpdated,
}: {
  existing: any;
  userId: string;
  onComplete: () => void;
  onUpdated: (updated: any) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(existing.email);
  const [saving, setSaving] = useState(false);

  const handleSaveEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || trimmed === existing.email) {
      setEditing(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("cosigners")
        .update({ email: trimmed })
        .eq("id", existing.id);
      if (error) throw error;

      await supabase.functions.invoke("send-cosigner-email", {
        body: { cosignerId: existing.id },
      });

      toast.success("Email updated and confirmation resent!");
      onUpdated({ ...existing, email: trimmed });
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update email.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Clock className="h-12 w-12 text-amber" />
      <p className="text-sm font-semibold text-foreground">Waiting for Co-signer</p>

      {editing ? (
        <div className="w-full max-w-xs space-y-2">
          <Label className="text-xs">New email for {existing.full_name}</Label>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="cosigner@email.com"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEmail} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Save & Resend
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setNewEmail(existing.email); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground text-center">
            We sent {existing.full_name} ({existing.email}) an email to confirm.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3" />
            Change Email
          </Button>
        </>
      )}

      <div className="flex gap-2 mt-1">
        <Button variant="outline" size="sm" onClick={async () => {
          await supabase.functions.invoke("send-cosigner-email", {
            body: { cosignerId: existing.id },
          });
          toast.success("Reminder email sent!");
        }}>
          Resend Email
        </Button>
        <Button variant="ghost" size="sm" onClick={async () => {
          const { data } = await supabase.from("cosigners").select("confirmation_status").eq("id", existing.id).single();
          if (data?.confirmation_status === "confirmed") {
            await supabase.from("profiles").update({ cosigner_confirmed: true } as any).eq("id", userId);
            toast.success("Co-signer confirmed! 🎉");
            onComplete();
          } else {
            toast.info("Still waiting for confirmation.");
          }
        }}>
          Check Status
        </Button>
      </div>
    </div>
  );
};

interface CosignerFormProps {
  onComplete: () => void;
}

const CosignerForm = ({ onComplete }: CosignerFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cosigners")
      .select("*")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data);
          setFullName(data.full_name);
          setRelationship(data.relationship);
          setEmail(data.email);
          setPhone(data.phone);
        }
        setLoading(false);
      });
  }, [user]);

  // If co-signer already confirmed
  if (existing?.confirmation_status === "confirmed") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 className="h-12 w-12 text-emerald" />
        <p className="text-sm font-semibold text-foreground">Co-signer Confirmed ✓</p>
        <p className="text-xs text-muted-foreground text-center">{existing.full_name} has confirmed via email.</p>
        <Button size="sm" onClick={onComplete}>Continue</Button>
      </div>
    );
  }

  // If co-signer submitted but pending
  if (existing && existing.confirmation_status === "pending") {
    return (
      <CosignerPendingState
        existing={existing}
        userId={user!.id}
        onComplete={onComplete}
        onUpdated={(updated) => setExisting(updated)}
      />
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const canSubmit = fullName.trim() && relationship && email.trim() && phone.trim();

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    try {
      const { data: cosigner, error } = await supabase.from("cosigners").insert({
        tenant_id: user.id,
        full_name: fullName.trim(),
        relationship,
        email: email.trim(),
        phone: phone.trim(),
      }).select("id").single();
      if (error) throw error;

      // Send confirmation email to cosigner
      await supabase.functions.invoke("send-cosigner-email", {
        body: { cosignerId: cosigner.id },
      });

      toast.success("Co-signer added! Confirmation email sent.");
      // Refresh to show pending state
      setExisting({
        id: cosigner.id,
        full_name: fullName.trim(),
        email: email.trim(),
        confirmation_status: "pending",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to add co-signer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Co-signer Full Name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Parent or guardian name" className="mt-1" />
      </div>
      <div>
        <Label>Relationship</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="guardian">Guardian</SelectItem>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="relative">Other Relative</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Co-signer Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cosigner@email.com" className="mt-1" />
      </div>
      <div>
        <Label>Co-signer Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="mt-1" />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={saving || !canSubmit}>
        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Users className="mr-1 h-4 w-4" />}
        {saving ? "Sending..." : "Add Co-signer & Send Email"}
      </Button>
    </div>
  );
};

export default CosignerForm;
