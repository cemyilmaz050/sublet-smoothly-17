import { useState, useEffect } from "react";
import { Zap, Loader2, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { toast } from "sonner";
import UrgentListingCard from "@/components/urgent/UrgentListingCard";
import MakeOfferModal from "@/components/urgent/MakeOfferModal";

interface UrgentListing {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  asking_price: number | null;
  photos: string[] | null;
  urgency_deadline: string | null;
  available_from: string | null;
  available_until: string | null;
  tenant_id: string;
}

const UrgentPage = () => {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const [listings, setListings] = useState<UrgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [offerListing, setOfferListing] = useState<UrgentListing | null>(null);
  const [alertCity, setAlertCity] = useState("");
  const [alertBudget, setAlertBudget] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, asking_price, photos, urgency_deadline, available_from, available_until, tenant_id")
        .eq("status", "active")
        .eq("is_urgent", true)
        .order("urgency_deadline", { ascending: true }) as any;
      setListings((data as UrgentListing[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = listings.filter((l) => {
    if (searchQuery && !l.address?.toLowerCase().includes(searchQuery.toLowerCase()) && !l.headline?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleMakeOffer = (listing: UrgentListing) => {
    if (!user) { requireAuth(() => setOfferListing(listing)); return; }
    setOfferListing(listing);
  };

  const handleSaveAlert = async () => {
    if (!user) { requireAuth(() => handleSaveAlert()); return; }
    if (!alertCity.trim() || !alertBudget) { toast.error("Enter a city and budget"); return; }
    setSavingAlert(true);
    try {
      await supabase.from("price_alerts" as any).insert({
        user_id: user.id,
        city: alertCity.trim(),
        max_budget: Number(alertBudget),
      } as any);
      toast.success("Price alert saved! We'll notify you when a match appears.");
      setAlertCity("");
      setAlertBudget("");
    } catch { toast.error("Failed to save alert"); }
    finally { setSavingAlert(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-800 to-amber-950 text-white">
        <div className="container mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-amber-300" />
            <h1 className="text-4xl font-bold">Urgent Sublets</h1>
          </div>
          <p className="text-lg text-amber-200 max-w-md mx-auto">
            Tenants who need to sublet immediately. Prices are negotiable. Move fast.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-700/50 px-4 py-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            {filtered.length} urgent listing{filtered.length !== 1 ? "s" : ""} available right now
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex flex-1 items-center gap-2 rounded-full border bg-card px-4 h-11">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by location..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[16px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Zap className="h-12 w-12 text-amber-300 mx-auto mb-4" />
            <p className="text-lg font-semibold">No urgent listings right now</p>
            <p className="text-sm text-muted-foreground mt-1">Set a price alert below to get notified</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((listing) => (
              <div key={listing.id} className="flex justify-center">
                <UrgentListingCard listing={listing} onMakeOffer={handleMakeOffer} />
              </div>
            ))}
          </div>
        )}

        {/* Price Alert */}
        <div className="max-w-lg mx-auto rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Set a Price Alert</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Get notified when a new urgent listing matches your budget.</p>
          <div className="flex gap-3">
            <Input placeholder="City" value={alertCity} onChange={(e) => setAlertCity(e.target.value)} className="flex-1" />
            <Input type="number" placeholder="Max budget" value={alertBudget} onChange={(e) => setAlertBudget(e.target.value)} className="w-32" />
            <Button onClick={handleSaveAlert} disabled={savingAlert} className="rounded-full shrink-0">
              {savingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {offerListing && (
        <MakeOfferModal
          open={!!offerListing}
          onClose={() => setOfferListing(null)}
          listing={offerListing}
        />
      )}
    </div>
  );
};

export default UrgentPage;
