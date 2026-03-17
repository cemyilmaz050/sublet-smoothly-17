import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  console.log(`[DELETE-LISTING] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    log("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;
    log("User authenticated", { userId: user.id });

    const { listingId } = await req.json();
    if (!listingId) throw new Error("listingId is required");

    // Get listing — verify ownership
    const { data: listing, error: listingErr } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();

    if (listingErr || !listing) throw new Error("Listing not found");
    if (listing.tenant_id !== user.id) throw new Error("Not authorized to delete this listing");
    log("Listing found", { id: listing.id, status: listing.status });

    // Check for active bookings with deposits
    const { data: activeBookings } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("listing_id", listingId)
      .in("status", ["confirmed", "pending"]);

    // Process refunds for any paid bookings
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (activeBookings && activeBookings.length > 0 && stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      for (const booking of activeBookings) {
        if (booking.stripe_payment_intent_id && booking.status !== "refunded") {
          try {
            await stripe.refunds.create({
              payment_intent: booking.stripe_payment_intent_id,
              reason: "requested_by_customer",
            });
            log("Refunded booking", { bookingId: booking.id });
          } catch (e) {
            log("Refund error (may already be refunded)", { bookingId: booking.id, error: String(e) });
          }

          await supabaseAdmin.from("bookings").update({
            status: "refunded",
            refunded_at: new Date().toISOString(),
            refund_reason: "Listing deleted by sublessor",
          }).eq("id", booking.id);

          // Notify subtenant about refund
          await supabaseAdmin.from("notifications").insert({
            user_id: booking.subtenant_id,
            title: "Deposit Refunded",
            message: `The listing you booked has been removed by the sublessor. Your full deposit of $${booking.deposit_amount} has been refunded.`,
            type: "payment",
            link: "/dashboard",
          });
        }

        // Cancel related agreements
        await supabaseAdmin
          .from("sublet_agreements")
          .update({ status: "cancelled" })
          .eq("booking_id", booking.id);
      }
    }

    // Notify sub-lessees who saved this listing
    const { data: savedBy } = await supabaseAdmin
      .from("saved_listings")
      .select("user_id")
      .eq("listing_id", listingId);

    if (savedBy && savedBy.length > 0) {
      const notifications = savedBy.map((s) => ({
        user_id: s.user_id,
        title: "Listing No Longer Available",
        message: "A listing you saved is no longer available.",
        type: "listing",
        link: "/listings",
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
      log("Notified saved users", { count: savedBy.length });
    }

    // Notify sub-lessees who knocked or messaged
    const { data: knockers } = await supabaseAdmin
      .from("knocks")
      .select("knocker_id")
      .eq("listing_id", listingId);

    if (knockers && knockers.length > 0) {
      const knockerIds = new Set(knockers.map((k) => k.knocker_id));
      // Remove any who were already notified via saved
      const savedIds = new Set((savedBy || []).map((s) => s.user_id));
      const uniqueKnockers = [...knockerIds].filter((id) => !savedIds.has(id));

      if (uniqueKnockers.length > 0) {
        const notifications = uniqueKnockers.map((uid) => ({
          user_id: uid,
          title: "Listing Removed",
          message: "The listing you were interested in has been removed by the sublessor.",
          type: "listing",
          link: "/listings",
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
        log("Notified knockers", { count: uniqueKnockers.length });
      }
    }

    // Soft-delete: set status to 'deleted' (keeps record for admin)
    await supabaseAdmin
      .from("listings")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", listingId);

    log("Listing soft-deleted", { listingId });

    // Clean up saved listings
    await supabaseAdmin.from("saved_listings").delete().eq("listing_id", listingId);

    // Send confirmation email to sublessor
    const listingTitle = listing.headline || listing.address || "your listing";
    await supabaseAdmin.functions.invoke("send-notification-email", {
      body: {
        to: user.email,
        subject: `Your listing "${listingTitle}" has been deleted`,
        type: "listing_deleted",
        data: { listing_title: listingTitle },
      },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[DELETE-LISTING] ERROR:", error);
    const msg = error instanceof Error ? error.message : "";
    const safeMessages = ["Not authorized to delete this listing", "Listing not found"];
    const userMessage = safeMessages.some(s => msg.includes(s)) ? msg : "An unexpected error occurred. Please try again.";
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
