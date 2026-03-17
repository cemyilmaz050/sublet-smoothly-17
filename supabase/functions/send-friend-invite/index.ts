import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { invite_token, friend_email, friend_name, inviter_name, address, monthly_rent, available_from, available_until } = body;

    if (!invite_token || !friend_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "").replace("https://", "") || "";
    const appUrl = `https://sublet-smoothly-17.lovable.app`;
    const inviteLink = `${appUrl}/invite/friend?token=${invite_token}`;

    const friendDisplayName = friend_name || "there";
    const dateRange = available_from && available_until
      ? `${new Date(available_from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(available_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : "";

    // Enqueue email via pgmq
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emailPayload = {
      to: friend_email,
      subject: `${inviter_name} wants to sublet their place to you`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">
              Hey ${friendDisplayName} 👋
            </h1>
          </div>
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
            <strong>${inviter_name}</strong> wants to sublet their place to you on SubIn.
          </p>
          ${address ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 8px;">📍 ${address}</p>` : ""}
          ${monthly_rent ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 8px;">💰 $${monthly_rent}/month</p>` : ""}
          ${dateRange ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">📅 ${dateRange}</p>` : ""}
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: hsl(235, 70%, 60%); color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 40px; border-radius: 12px; text-decoration: none;">
              Confirm in 2 minutes →
            </a>
          </div>
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px;">
            Tap the button to sign in, review the details, and you're done.<br/>
            A sublease agreement is created automatically.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 11px; color: #d1d5db; text-align: center;">
            SubIn — Subletting made simple
          </p>
        </div>
      `,
      from_name: "SubIn",
    };

    await serviceClient.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: emailPayload,
    });

    // Log the send
    await serviceClient.from("email_send_log").insert({
      recipient_email: friend_email,
      template_name: "friend_sublet_invite",
      status: "pending",
      metadata: { invite_token, inviter_name },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-friend-invite error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
