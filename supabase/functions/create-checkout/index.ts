import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_RATE = 0.06;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Use service role to look up listing data server-side
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json().catch(() => ({}));
    const { listingId } = body;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://subinapp.com";

    // If listingId is provided, create a one-time deposit payment
    if (listingId) {
      // Look up actual listing from DB — never trust client-supplied amounts
      const { data: listing, error: listingError } = await supabaseAdmin
        .from("listings")
        .select("security_deposit, monthly_rent, headline, address")
        .eq("id", listingId)
        .single();

      if (listingError || !listing) {
        throw new Error("Listing not found");
      }

      const depositAmount = Number(listing.security_deposit || listing.monthly_rent || 0);
      if (depositAmount <= 0) {
        throw new Error("Listing has no valid deposit amount configured");
      }

      const platformFee = Math.round(depositAmount * PLATFORM_FEE_RATE * 100) / 100;
      const totalAmount = depositAmount + platformFee;

      logStep("Creating deposit checkout from DB values", { listingId, depositAmount, platformFee, totalAmount });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Security Deposit + Platform Fee",
                description: `SubIn deposit for listing`,
              },
              unit_amount: Math.round(totalAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          listing_id: listingId,
          subtenant_id: user.id,
          deposit_amount: String(depositAmount),
          platform_fee: String(platformFee),
          total_amount: String(totalAmount),
          type: "sublet_deposit",
        },
        success_url: `${origin}/payments/confirmation?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}`,
        cancel_url: `${origin}/listings`,
      });

      logStep("Deposit checkout session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Default: subscription checkout (legacy flow)
    logStep("Creating subscription checkout");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1TAC5ECpbA85hge1NLERvEWG",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payments/confirmation`,
      cancel_url: `${origin}/payments/summary`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: "Checkout failed. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
