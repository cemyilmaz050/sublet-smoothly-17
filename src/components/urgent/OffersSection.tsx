import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, ArrowLeftRight, Zap, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Offer {
  id: string;
  listing_id: string;
  subtenant_id: string;
  offer_amount: number;
  asking_amount: number;
  message: string | null;
  move_in_date: string | null;
  duration_months: number;
  status: string;
  round: number;
  expires_at: string;
  created_at: string;
  subtenant_name?: string;
}

interface Props {
  listingIds: string[];
  minimumPrices: Record<string, number>;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  countered: "bg-blue-100 text-blue-800 border-blue-200",
  expired: "bg-muted text-muted-foreground border-border",
};

const OffersSection = ({ listingIds, minimumPrices }: Props) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterOpen, setCounterOpen] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState(0);
  const [counterMessage, setCounterMessage] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const fetchOffers = async () => {
    if (!listingIds.length) { setLoading(false); return; }
    const { data } = await supabase
      .from("offers" as any)
      .select("*")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false }) as any;

    if (data && data.length > 0) {
      const subIds = [...new Set(data.map((o: any) => o.subtenant_id))] as string[];
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", subIds) as any;
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Subtenant"; });
      setOffers(data.map((o: any) => ({ ...o, subtenant_name: nameMap[o.subtenant_id] || "Subtenant" })));
    } else {
      setOffers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, [listingIds.join(",")]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("offers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => fetchOffers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [listingIds.join(",")]);

  const handleAccept = async (offer: Offer) => {
    setActing(offer.id);
    try {
      await supabase.from("offers" as any).update({ status: "accepted" } as any).eq("id", offer.id);
      await supabase.from("notifications").insert({
        user_id: offer.subtenant_id,
        title: "Offer Accepted! 🎉",
        message: `Your offer of $${offer.offer_amount.toLocaleString()}/mo has been accepted!`,
        type: "offer",
        link: "/dashboard/subtenant",
      });
      toast.success("Offer accepted!");
      fetchOffers();
    } catch { toast.error("Failed to accept offer"); }
    finally { setActing(null); }
  };

  const handleDecline = async (offer: Offer) => {
    setActing(offer.id);
    try {
      await supabase.from("offers" as any).update({ status: "declined" } as any).eq("id", offer.id);
      await supabase.from("notifications").insert({
        user_id: offer.subtenant_id,
        title: "Offer Declined",
        message: `Your offer of $${offer.offer_amount.toLocaleString()}/mo was declined.`,
        type: "offer",
        link: "/listings",
      });
      toast.success("Offer declined");
      fetchOffers();
    } catch { toast.error("Failed to decline offer"); }
    finally { setActing(null); }
  };

  const handleCounter = async (offer: Offer) => {
    if (offer.round >= 3) {
      toast.error("Maximum negotiation rounds reached (3).");
      return;
    }
    setActing(offer.id);
    try {
      await supabase.from("counter_offers" as any).insert({
        offer_id: offer.id,
        made_by: user!.id,
        amount: counterAmount,
        message: counterMessage || null,
      } as any);
      await supabase.from("offers" as any).update({ status: "countered", round: offer.round + 1 } as any).eq("id", offer.id);
      await supabase.from("notifications").insert({
        user_id: offer.subtenant_id,
        title: "Counter Offer Received",
        message: `The tenant countered with $${counterAmount.toLocaleString()}/mo`,
        type: "offer",
        link: "/dashboard/subtenant",
      });
      toast.success("Counter offer sent!");
      setCounterOpen(null);
      fetchOffers();
    } catch { toast.error("Failed to send counter offer"); }
    finally { setActing(null); }
  };

  const pendingOffers = offers.filter(o => o.status === "pending" || o.status === "countered");
  const otherOffers = offers.filter(o => o.status !== "pending" && o.status !== "countered");

  if (loading) return null;
  if (offers.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-foreground">Offers</h2>
          {pendingOffers.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pendingOffers.length} pending</Badge>
          )}
        </div>
      </div>

      <div className="divide-y">
        {[...pendingOffers, ...otherOffers].map((offer) => {
          const minPrice = minimumPrices[offer.listing_id] || 0;
          const meetsMinimum = minPrice > 0 && offer.offer_amount >= minPrice;
          const belowMinimum = minPrice > 0 && offer.offer_amount < minPrice;
          const expiresIn = new Date(offer.expires_at).getTime() - Date.now();
          const isExpiringSoon = expiresIn > 0 && expiresIn < 2 * 60 * 60 * 1000;

          return (
            <div key={offer.id} className={`px-6 py-4 space-y-3 ${meetsMinimum && offer.status === "pending" ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{offer.subtenant_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                    {offer.round > 1 && <span className="ml-2">· Round {offer.round}/3</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">${offer.offer_amount.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground">{offer.duration_months} month{offer.duration_months !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {meetsMinimum && offer.status === "pending" && (
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  ✓ This offer meets your minimum — accept now?
                </div>
              )}
              {belowMinimum && offer.status === "pending" && (
                <p className="text-xs text-muted-foreground">Below your minimum price</p>
              )}

              {offer.message && (
                <p className="text-sm text-muted-foreground italic">"{offer.message}"</p>
              )}

              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`capitalize text-xs ${statusColors[offer.status] || ""}`}>
                  {offer.status}
                </Badge>
                {isExpiringSoon && offer.status === "pending" && (
                  <span className="text-xs text-red-500 font-medium">Expiring soon!</span>
                )}
              </div>

              {(offer.status === "pending" || offer.status === "countered") && (
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAccept(offer)} disabled={acting === offer.id}>
                    {acting === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" /> Accept</>}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full border-primary text-primary" onClick={() => { setCounterOpen(offer.id); setCounterAmount(Math.round((offer.offer_amount + offer.asking_amount) / 2)); }} disabled={offer.round >= 3 || acting === offer.id}>
                    <ArrowLeftRight className="mr-1 h-3.5 w-3.5" /> Counter
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full border-red-300 text-red-600" onClick={() => handleDecline(offer)} disabled={acting === offer.id}>
                    <X className="mr-1 h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Counter Offer Dialog */}
      <Dialog open={!!counterOpen} onOpenChange={(o) => !o && setCounterOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Counter Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your counter price ($/mo)</label>
              <Input type="number" value={counterAmount} onChange={(e) => setCounterAmount(Number(e.target.value) || 0)} className="mt-1.5 text-lg font-bold text-center" />
            </div>
            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea value={counterMessage} onChange={(e) => setCounterMessage(e.target.value.slice(0, 200))} maxLength={200} className="mt-1.5" rows={2} />
            </div>
            <Button className="w-full rounded-full" onClick={() => { const offer = offers.find(o => o.id === counterOpen); if (offer) handleCounter(offer); }} disabled={!!acting}>
              {acting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Counter Offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default OffersSection;
