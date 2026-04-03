import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find expired pending offers
    const { data: expiredOffers, error: fetchError } = await supabase
      .from("offers")
      .select("id, listing_id, subtenant_id, offer_amount")
      .in("status", ["pending", "countered"])
      .lt("expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!expiredOffers || expiredOffers.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to expired
    const ids = expiredOffers.map((o: any) => o.id);
    await supabase.from("offers").update({ status: "expired" }).in("id", ids);

    // Get listing addresses for notifications
    const listingIds = [...new Set(expiredOffers.map((o: any) => o.listing_id))];
    const { data: listings } = await supabase
      .from("listings")
      .select("id, address, tenant_id")
      .in("id", listingIds);

    const listingMap: Record<string, any> = {};
    (listings || []).forEach((l: any) => { listingMap[l.id] = l; });

    // Send notifications
    const notifications: any[] = [];
    for (const offer of expiredOffers) {
      const listing = listingMap[offer.listing_id];
      if (!listing) continue;

      // Notify subtenant
      notifications.push({
        user_id: offer.subtenant_id,
        title: "Offer Expired",
        message: `Your offer of $${offer.offer_amount}/mo on ${listing.address || "a listing"} has expired. Make a new offer?`,
        type: "offer",
        link: "/listings",
      });

      // Notify tenant
      notifications.push({
        user_id: listing.tenant_id,
        title: "Offer Expired",
        message: `An offer on your listing at ${listing.address || "your property"} expired without a response.`,
        type: "offer",
        link: "/tenant/dashboard",
      });
    }

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ expired: ids.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("expire-offers error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
