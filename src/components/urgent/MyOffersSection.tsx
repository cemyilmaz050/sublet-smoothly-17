import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Clock, Check, X, ArrowLeftRight, MapPin, Home } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MakeOfferModal from "./MakeOfferModal";
import { useNavigate } from "react-router-dom";

interface MyOffer {
  id: string;
  listing_id: string;
  offer_amount: number;
  asking_amount: number;
  duration_months: number;
  move_in_date: string | null;
  message: string | null;
  status: string;
  round: number;
  expires_at: string;
  created_at: string;
  listing_headline: string | null;
  listing_address: string | null;
  listing_photo: string | null;
  listing_tenant_id: string;
  counter_amount: number | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-200" },
  countered: { label: "Countered", className: "bg-blue-100 text-blue-800 border-blue-200" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
};

const MyOffersSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterModal, setCounterModal] = useState<MyOffer | null>(null);

  const fetchOffers = async () => {
    if (!user) return;
    const { data: offersData } = await supabase
      .from("offers" as any)
      .select("*")
      .eq("subtenant_id", user.id)
      .order("created_at", { ascending: false }) as any;

    if (!offersData || offersData.length === 0) {
      setOffers([]);
      setLoading(false);
      return;
    }

    // Enrich with listing data
    const listingIds = [...new Set(offersData.map((o: any) => o.listing_id))] as string[];
    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, headline, address, photos, tenant_id")
      .in("id", listingIds);
    const listingMap: Record<string, any> = {};
    (listingsData || []).forEach((l: any) => { listingMap[l.id] = l; });

    // Get latest counter offers
    const offerIds = offersData.map((o: any) => o.id);
    const { data: counters } = await supabase
      .from("counter_offers" as any)
      .select("*")
      .in("offer_id", offerIds)
      .order("created_at", { ascending: false }) as any;

    const counterMap: Record<string, number> = {};
    (counters || []).forEach((c: any) => {
      if (!counterMap[c.offer_id]) counterMap[c.offer_id] = c.amount;
    });

    setOffers(offersData.map((o: any) => ({
      ...o,
      listing_headline: listingMap[o.listing_id]?.headline || "Untitled",
      listing_address: listingMap[o.listing_id]?.address || "",
      listing_photo: listingMap[o.listing_id]?.photos?.[0] || null,
      listing_tenant_id: listingMap[o.listing_id]?.tenant_id || "",
      counter_amount: counterMap[o.id] || null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("my-offers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => fetchOffers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleAcceptCounter = async (offer: MyOffer) => {
    // Accept the counter = accept the offer at the counter amount
    await supabase.from("offers" as any).update({
      status: "accepted",
      offer_amount: offer.counter_amount || offer.offer_amount,
    } as any).eq("id", offer.id);

    await supabase.from("notifications").insert({
      user_id: offer.listing_tenant_id,
      title: "Offer accepted",
      message: `The renter accepted your counter of $${(offer.counter_amount || offer.offer_amount).toLocaleString()}/mo`,
      type: "offer",
      link: "/tenant/dashboard",
    });

    fetchOffers();
  };

  const handleDecline = async (offer: MyOffer) => {
    await supabase.from("offers" as any).update({ status: "declined" } as any).eq("id", offer.id);
    fetchOffers();
  };

  if (loading || offers.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Zap className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-foreground">My Offers</h2>
        <Badge variant="outline" className="ml-auto">{offers.length}</Badge>
      </div>
      <div className="divide-y">
        {offers.map((offer) => {
          const expiresIn = new Date(offer.expires_at).getTime() - Date.now();
          const hoursLeft = Math.max(0, Math.floor(expiresIn / (1000 * 60 * 60)));
          const sc = statusConfig[offer.status] || statusConfig.pending;

          return (
            <div key={offer.id} className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-3">
                {offer.listing_photo ? (
                  <img src={offer.listing_photo} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Home className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{offer.listing_headline}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{offer.listing_address || "Unknown"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">${offer.offer_amount.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                  <Badge variant="outline" className={`capitalize text-xs ${sc.className}`}>{sc.label}</Badge>
                </div>
              </div>

              {/* Status-specific content */}
              {offer.status === "pending" && expiresIn > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Expires in {hoursLeft}h
                </p>
              )}

              {offer.status === "countered" && offer.counter_amount && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Subletter countered with ${offer.counter_amount.toLocaleString()}/mo
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAcceptCounter(offer)}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Accept
                    </Button>
                    {offer.round < 3 && (
                      <Button size="sm" variant="outline" className="rounded-full border-primary text-primary" onClick={() => setCounterModal(offer)}>
                        <ArrowLeftRight className="mr-1 h-3.5 w-3.5" /> Counter back
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-full border-red-300 text-red-600" onClick={() => handleDecline(offer)}>
                      <X className="mr-1 h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              )}

              {offer.status === "accepted" && (
                <Button size="sm" className="rounded-full" onClick={() => navigate(`/agreement?booking_id=${offer.id}`)}>
                  Sign your agreement
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Counter-offer modal */}
      {counterModal && (
        <MakeOfferModal
          open={!!counterModal}
          onClose={() => { setCounterModal(null); fetchOffers(); }}
          listing={{
            id: counterModal.listing_id,
            headline: counterModal.listing_headline,
            address: counterModal.listing_address,
            asking_price: counterModal.asking_amount,
            tenant_id: counterModal.listing_tenant_id,
            photos: counterModal.listing_photo ? [counterModal.listing_photo] : null,
          }}
          prefill={{
            counterAmount: counterModal.counter_amount || counterModal.offer_amount,
            offerId: counterModal.id,
            round: counterModal.round,
            originalOffer: counterModal.offer_amount,
          }}
        />
      )}
    </section>
  );
};

export default MyOffersSection;
