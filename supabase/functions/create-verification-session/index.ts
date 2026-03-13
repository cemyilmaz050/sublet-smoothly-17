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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = authData.user;

    // Check if already verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("id_verified, verification_attempts")
      .eq("id", user.id)
      .single();

    if (profile?.id_verified) {
      return new Response(
        JSON.stringify({ already_verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((profile?.verification_attempts || 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "max_attempts", message: "Maximum verification attempts reached. Please contact support at hello@subinapp.com" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: user.id,
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
    });

    // Store session ID and increment attempts
    await supabase
      .from("profiles")
      .update({
        stripe_verification_session_id: session.id,
        verification_attempts: (profile?.verification_attempts || 0) + 1,
      } as any)
      .eq("id", user.id);

    return new Response(
      JSON.stringify({ client_secret: session.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Verification session error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
