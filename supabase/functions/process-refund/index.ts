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
  console.log(`[PROCESS-REFUND] ${step}${detailsStr}`);
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
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { bookingId, reason } = body;
    if (!bookingId) throw new Error("bookingId is required");

    // Get booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    logStep("Booking found", { bookingId, status: booking.status });

    // Verify the requester is the subtenant or the system is processing a tenant cancellation
    const isSubtenant = booking.subtenant_id === user.id;
    const isTenant = booking.tenant_id === user.id;

    if (!isSubtenant && !isTenant) {
      throw new Error("You are not authorized to request a refund for this booking");
    }

    if (booking.status === "refunded") {
      throw new Error("This booking has already been refunded");
    }

    const now = new Date();
    let refundAllowed = false;
    let refundReason = reason || "";

    if (isTenant) {
      // Tenant cancels → always full refund to subtenant
      refundAllowed = true;
      refundReason = refundReason || "Tenant cancelled the sublet";
      logStep("Tenant-initiated cancellation, full refund");
    } else if (isSubtenant) {
      // Subtenant cancels → check 48-hour window
      const eligibleUntil = booking.refund_eligible_until ? new Date(booking.refund_eligible_until) : null;
      if (eligibleUntil && now <= eligibleUntil) {
        refundAllowed = true;
        refundReason = refundReason || "Cancelled within 48-hour window";
        logStep("Within 48-hour refund window");
      } else {
        throw new Error("The 48-hour refund window has expired. Your deposit is no longer refundable.");
      }
    }

    if (!refundAllowed) {
      throw new Error("Refund not allowed");
    }

    // Process Stripe refund
    if (!booking.stripe_payment_intent_id) {
      throw new Error("No payment intent found for this booking. Cannot process refund.");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      reason: "requested_by_customer",
    });
    logStep("Stripe refund created", { refundId: refund.id, amount: refund.amount });

    // Update booking status
    await supabaseClient
      .from("bookings")
      .update({
        status: "refunded",
        refunded_at: now.toISOString(),
        refund_reason: refundReason,
      })
      .eq("id", bookingId);

    // Update agreement if exists
    await supabaseClient
      .from("sublet_agreements")
      .update({ status: "cancelled" })
      .eq("booking_id", bookingId);

    // Notify the other party
    const notifyUserId = isTenant ? booking.subtenant_id : booking.tenant_id;
    const notifyMessage = isTenant
      ? "The tenant has cancelled the sublet. Your full deposit has been refunded."
      : "The subtenant has cancelled the booking. The deposit has been refunded.";

    await supabaseClient.from("notifications").insert({
      user_id: notifyUserId,
      title: "Booking Cancelled & Refunded",
      message: notifyMessage,
      type: "payment",
      link: "/dashboard",
    });

    logStep("Refund completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[PROCESS-REFUND] ERROR:", error);
    // Allow specific user-facing messages through
    const msg = error instanceof Error ? error.message : "";
    const safeMessages = [
      "The 48-hour refund window has expired",
      "This booking has already been refunded",
      "You are not authorized to request a refund",
    ];
    const userMessage = safeMessages.some(s => msg.includes(s)) ? msg : "An unexpected error occurred. Please try again.";
    return new Response(JSON.stringify({ error: userMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
