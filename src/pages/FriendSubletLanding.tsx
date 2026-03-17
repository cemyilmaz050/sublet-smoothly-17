import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, DollarSign, Check, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const FriendSubletLanding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [inviterName, setInviterName] = useState("");

  // Load invite by token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const load = async () => {
      // Use secure RPC to look up invite by token (no broad anon access)
      const { data, error } = await supabase.rpc("get_invite_by_token" as any, { p_token: token }) as any;
      const invite = Array.isArray(data) ? data[0] : data;
      if (invite) {
        setInvite(invite);
        // Fetch inviter name
        const { data: profile } = await supabase
          .from("profiles_public")
          .select("first_name, last_name")
          .eq("id", invite.inviter_id)
          .maybeSingle();
        if (profile) {
          setInviterName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Your friend");
        }
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/invite/friend?token=${token}`,
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleAccept = async () => {
    if (!user || !invite) return;
    setAccepting(true);
    try {
      // Update invite with friend_user_id and status
      await (supabase.from("friend_sublet_invites" as any).update({
        friend_user_id: user.id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      }).eq("token", token) as any);

      // Activate the listing
      if (invite.listing_id) {
        await supabase.from("listings").update({
          status: "active" as any,
          published_at: new Date().toISOString(),
        }).eq("id", invite.listing_id);
      }

      // Trigger background Stripe Identity verification silently
      try {
        await supabase.functions.invoke("create-verification-session", {
          body: { user_id: user.id },
        });
      } catch {
        // Non-blocking — don't interrupt the friend flow
      }

      setAccepted(true);

      // Redirect to payment (Stripe Checkout styled casually)
      if (invite.deposit_amount && invite.listing_id) {
        const { data: checkoutData } = await supabase.functions.invoke("create-checkout", {
          body: {
            listing_id: invite.listing_id,
            deposit_amount: invite.deposit_amount,
            friend_sublet: true,
          },
        });
        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }

      toast.success("You're all set! The sublet is confirmed.");
      navigate("/dashboard/subtenant");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Invalid or expired invite</h1>
          <p className="text-muted-foreground">This link may have already been used or is no longer valid.</p>
          <Button onClick={() => navigate("/listings")}>Browse listings</Button>
        </div>
      </div>
    );
  }

  if (invite.status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Already confirmed!</h1>
          <p className="text-muted-foreground">This sublet invite has already been accepted.</p>
          <Button onClick={() => navigate("/dashboard/subtenant")}>Go to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  // Accepted just now — show success
  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15 }} className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Done! Your place is held!</h1>
          <p className="text-muted-foreground">
            See you {invite.available_from ? `on ${new Date(invite.available_from).toLocaleDateString("en-US", { month: "long", day: "numeric" })}` : "soon"} 🏠
          </p>
          <p className="text-xs text-muted-foreground">
            <Shield className="inline h-3 w-3 mr-1" />
            Your agreement has been saved and both of you are protected — <button onClick={() => navigate("/agreement")} className="underline">tap to view anytime</button>
          </p>
        </motion.div>
      </div>
    );
  }

  // Main invite page
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hey — {inviterName} wants to sublet their place to you
          </h1>
          <p className="text-muted-foreground">Confirm in under 3 minutes</p>
        </div>

        {/* Property card */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          {invite.photo_url && (
            <img src={invite.photo_url} alt="Property" className="w-full h-48 object-cover" />
          )}
          <div className="p-5 space-y-3">
            {invite.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-foreground">{invite.address}</p>
              </div>
            )}
            {invite.monthly_rent && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-foreground">${invite.monthly_rent}/month{invite.deposit_amount ? ` · $${invite.deposit_amount} deposit` : ""}</p>
              </div>
            )}
            {invite.available_from && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-foreground">
                  {new Date(invite.available_from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {invite.available_until ? new Date(invite.available_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        {!user ? (
          <div className="space-y-3">
            <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5 mr-2" />
              Continue with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Signs you in and verifies your identity in one step
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-accent/50 border p-3 text-center">
              <p className="text-sm text-foreground">Signed in as <span className="font-medium">{user.email}</span></p>
            </div>
            <Button onClick={handleAccept} disabled={accepting} className="w-full" size="lg">
              {accepting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Confirming...</>
              ) : invite.deposit_amount ? (
                <>Confirm & pay ${invite.deposit_amount} deposit</>
              ) : (
                <>Confirm this sublet</>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          <Shield className="inline h-3 w-3 mr-1" />
          A sublease agreement is generated automatically — you're both protected
        </p>
      </motion.div>
    </div>
  );
};

export default FriendSubletLanding;
