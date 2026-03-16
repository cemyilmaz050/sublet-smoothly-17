import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CONFIRM-BOOKING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { sessionId, listingId } = body;
    if (!sessionId) throw new Error("sessionId is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    logStep("Session retrieved", { sessionId: session.id, paymentStatus: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata || {};
    const actualListingId = listingId || metadata.listing_id;
    if (!actualListingId) throw new Error("No listing ID found");

    const paymentIntent = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    // Check if booking already exists for this session
    const { data: existingBooking } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (existingBooking) {
      logStep("Booking already exists", { bookingId: existingBooking.id });
      return new Response(JSON.stringify({ success: true, bookingId: existingBooking.id, alreadyExists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select("*")
      .eq("id", actualListingId)
      .single();

    if (listingError || !listing) throw new Error("Listing not found");
    logStep("Listing found", { listingId: actualListingId, headline: listing.headline });

    const depositAmount = parseFloat(metadata.deposit_amount || String(listing.monthly_rent || 0));
    const platformFee = parseFloat(metadata.platform_fee || "0");
    const totalAmount = parseFloat(metadata.total_amount || String(session.amount_total ? session.amount_total / 100 : depositAmount));

    // 48-hour refund window
    const refundEligibleUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Create booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .insert({
        listing_id: actualListingId,
        tenant_id: listing.tenant_id,
        subtenant_id: user.id,
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: paymentIntent,
        deposit_amount: depositAmount,
        platform_fee: platformFee,
        total_paid: totalAmount,
        status: "confirmed",
        refund_eligible_until: refundEligibleUntil,
      })
      .select("id")
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    logStep("Booking created", { bookingId: booking.id });

    // Get profiles for agreement
    const [tenantProfile, subtenantProfile] = await Promise.all([
      supabaseClient.from("profiles").select("first_name, last_name").eq("id", listing.tenant_id).single(),
      supabaseClient.from("profiles").select("first_name, last_name").eq("id", user.id).single(),
    ]);

    const tenantName = `${tenantProfile.data?.first_name || ""} ${tenantProfile.data?.last_name || ""}`.trim() || "Tenant";
    const subtenantName = `${subtenantProfile.data?.first_name || ""} ${subtenantProfile.data?.last_name || ""}`.trim() || "Subtenant";

    // Create sublet agreement
    const { data: agreement, error: agreementError } = await supabaseClient
      .from("sublet_agreements")
      .insert({
        booking_id: booking.id,
        listing_id: actualListingId,
        tenant_id: listing.tenant_id,
        subtenant_id: user.id,
        property_address: listing.address || "Address TBD",
        unit_number: listing.unit_number,
        start_date: listing.available_from || new Date().toISOString().split("T")[0],
        end_date: listing.available_until || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        monthly_rent: listing.monthly_rent || 0,
        deposit_amount: depositAmount,
        tenant_name: tenantName,
        subtenant_name: subtenantName,
        status: "pending_signatures",
      })
      .select("id")
      .single();

    if (agreementError) {
      logStep("Agreement creation warning", { error: agreementError.message });
    } else {
      logStep("Agreement created", { agreementId: agreement.id });
    }

    // Notify tenant
    await supabaseClient.from("notifications").insert({
      user_id: listing.tenant_id,
      title: "New Booking Confirmed!",
      message: `${subtenantName} has secured "${listing.headline || listing.address || "your listing"}" with a deposit of $${depositAmount.toLocaleString()}. Please sign the sublet agreement.`,
      type: "booking",
      link: "/dashboard/tenant",
    });

    // Notify subtenant
    await supabaseClient.from("notifications").insert({
      user_id: user.id,
      title: "Booking Confirmed!",
      message: `You've secured "${listing.headline || listing.address || "this apartment"}". Please sign the sublet agreement to finalize.`,
      type: "booking",
      link: "/dashboard/subtenant",
    });

    logStep("Booking confirmation complete");

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        agreementId: agreement?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
