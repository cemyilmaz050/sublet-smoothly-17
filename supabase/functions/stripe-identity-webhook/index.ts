import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-08-27.basil",
  });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_IDENTITY_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`[stripe-identity-webhook] Received event: ${event.type}, id: ${event.id}`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const session = event.data.object as any;
  const userId = session.metadata?.user_id;

  if (!userId) {
    console.warn(`[stripe-identity-webhook] No user_id in metadata for event ${event.id}`);
    return new Response(JSON.stringify({ received: true, warning: "no user_id" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[stripe-identity-webhook] Processing event ${event.type} for user ${userId}`);

  if (event.type === "identity.verification_session.verified") {
    const { error } = await supabase
      .from("profiles")
      .update({ id_verified: true } as any)
      .eq("id", userId);

    if (error) {
      console.error(`[stripe-identity-webhook] Failed to update verification status for ${userId}:`, error);
    } else {
      console.log(`[stripe-identity-webhook] Successfully marked user ${userId} as id_verified`);
      // Send notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Identity Verified ✓",
        message: "Your identity has been verified. You are all set!",
        type: "verification",
        link: "/tenant/dashboard",
      });
    }
  }

  if (event.type === "identity.verification_session.requires_input") {
    const lastError = session.last_error;
    let friendlyMessage = "We could not verify your ID. Please try again with a clear photo of your document.";

    if (lastError) {
      console.log(`[stripe-identity-webhook] Verification error details for ${userId}:`, JSON.stringify(lastError));
      const code = lastError.code || "";
      if (code.includes("document_unverified_other") || code.includes("document_type_not_supported")) {
        friendlyMessage = "The document type is not supported. Please use a government-issued ID (passport, driver's license, or national ID card).";
      } else if (code.includes("document_expired")) {
        friendlyMessage = "Your ID document appears to be expired. Please use a valid, non-expired document.";
      } else if (code.includes("selfie")) {
        friendlyMessage = "We couldn't match the selfie to your ID photo. Please ensure your face is clearly visible and well-lit.";
      }
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Verification Needs Attention",
      message: friendlyMessage,
      type: "verification",
      link: "/tenant/dashboard",
    });

    console.log(`[stripe-identity-webhook] Sent requires_input notification to user ${userId}`);
  }

  if (event.type === "identity.verification_session.canceled" || event.type === "identity.verification_session.expired") {
    console.log(`[stripe-identity-webhook] Session ${event.type} for user ${userId}`);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Verification Session Expired",
      message: "Your verification session has expired. Please start a new verification to continue.",
      type: "verification",
      link: "/tenant/dashboard",
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
