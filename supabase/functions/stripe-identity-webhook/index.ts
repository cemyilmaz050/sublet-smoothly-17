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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "identity.verification_session.verified") {
    const session = event.data.object as any;
    const userId = session.metadata?.user_id;

    if (userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ id_verified: true } as any)
        .eq("id", userId);

      if (error) {
        console.error("Failed to update verification status:", error);
      } else {
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
  }

  if (event.type === "identity.verification_session.requires_input") {
    const session = event.data.object as any;
    const userId = session.metadata?.user_id;

    if (userId) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Verification Needs Attention",
        message: "We could not verify your ID. Please try again with a clear photo of your document.",
        type: "verification",
        link: "/tenant/dashboard",
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
