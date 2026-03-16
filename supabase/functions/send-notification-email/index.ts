import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SENDER_DOMAIN = "notify.subinapp.com";

interface EmailRequest {
  to: string;
  subject: string;
  type: "meeting_request" | "meeting_confirmed" | "booking_confirmed" | "new_message" | "listing_live" | "application_received" | "knock" | "listing_deleted" | "cosigner_request" | "background_check" | "payment_receipt";
  data: Record<string, any>;
}

const renderEmail = (type: string, data: Record<string, any>): string => {
  const baseStyle = `
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 560px; margin: 0 auto; padding: 40px 32px;
    background: #ffffff; color: #1a1a2e;
  `;
  const btnStyle = `
    display: inline-block; background: #4f46e5; color: #fff; padding: 14px 28px;
    border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;
  `;
  const mutedStyle = `color: #4b5563; font-size: 15px; line-height: 1.6;`;
  const logo = `<div style="margin-bottom: 32px;"><strong style="font-size: 24px; color: #1a1a2e;">Sub<span style="color: #4f46e5;">In</span></strong></div>`;
  const footer = `<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 13px; color: #9ca3af; margin: 0 0 4px;">SubIn · Subletting made simple</p>
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">You're receiving this because you have an account on SubIn.</p>
  </div>`;

  switch (type) {
    case "meeting_request":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">New Meeting Request</h1>
        <p style="${mutedStyle}">${data.requester_name} wants to schedule a viewing for your listing.</p>
        <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>Property:</strong> ${data.listing_title}</p>
          <p style="margin: 0 0 4px;"><strong>Date:</strong> ${data.meeting_date}</p>
          <p style="margin: 0 0 4px;"><strong>Time:</strong> ${data.meeting_time}</p>
          ${data.message ? `<p style="margin: 8px 0 0; ${mutedStyle}">"${data.message}"</p>` : ""}
        </div>
        <a href="${data.action_url}" style="${btnStyle}">View & Respond</a>
        ${footer}</div>`;

    case "meeting_confirmed":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Meeting Confirmed</h1>
        <p style="${mutedStyle}">Your viewing has been confirmed.</p>
        <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>Property:</strong> ${data.listing_title}</p>
          <p style="margin: 0 0 4px;"><strong>Address:</strong> ${data.address}</p>
          <p style="margin: 0 0 4px;"><strong>Date:</strong> ${data.meeting_date}</p>
          <p style="margin: 0 0 4px;"><strong>Time:</strong> ${data.meeting_time}</p>
        </div>
        <a href="${data.action_url}" style="${btnStyle}">Open Chat</a>
        ${footer}</div>`;

    case "booking_confirmed":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Booking Confirmed</h1>
        <p style="${mutedStyle}">${data.message}</p>
        <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>Property:</strong> ${data.listing_title}</p>
          <p style="margin: 0 0 4px;"><strong>Deposit:</strong> $${data.deposit_amount}</p>
          <p style="margin: 0 0 4px;"><strong>Total Paid:</strong> $${data.total_paid}</p>
        </div>
        <a href="${data.action_url}" style="${btnStyle}">View Details</a>
        ${footer}</div>`;

    case "new_message":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">New Message</h1>
        <p style="${mutedStyle}"><strong>${data.sender_name}</strong> sent you a message${data.listing_title ? ` about "${data.listing_title}"` : ""}:</p>
        <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; ${mutedStyle}">"${data.preview}"</p>
        </div>
        <a href="${data.action_url}" style="${btnStyle}">Reply</a>
        ${footer}</div>`;

    case "listing_live":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Your Listing is Live</h1>
        <p style="${mutedStyle}">Your listing "${data.listing_title}" is now live on SubIn and visible to potential sub-lessees.</p>
        <a href="${data.action_url}" style="${btnStyle}">View Your Listing</a>
        ${footer}</div>`;

    case "application_received":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">New Application</h1>
        <p style="${mutedStyle}">${data.applicant_name} has applied for your listing "${data.listing_title}".</p>
        ${data.message ? `<div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 16px 0;"><p style="margin: 0; ${mutedStyle}">"${data.message}"</p></div>` : ""}
        <a href="${data.action_url}" style="${btnStyle}">Review Application</a>
        ${footer}</div>`;

    case "knock":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Someone knocked on your listing</h1>
        <p style="${mutedStyle}"><strong>${data.knocker_name}</strong> is interested in your place at <strong>${data.listing_address || data.listing_title}</strong>. Send them a message to start the conversation.</p>
        <div style="margin: 24px 0;">
          <a href="${data.message_url}" style="${btnStyle}">Message Them</a>
        </div>
        ${footer}</div>`;

    case "listing_deleted":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Listing Deleted</h1>
        <p style="${mutedStyle}">Your listing "<strong>${data.listing_title}</strong>" has been successfully deleted from SubIn.</p>
        <p style="${mutedStyle}">All related applications have been removed and any active deposits have been refunded.</p>
        ${footer}</div>`;

    case "cosigner_request":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Co-signer Request</h1>
        <p style="${mutedStyle}">You've been listed as a co-signer for a SubIn sublet. Please review and confirm your details.</p>
        ${data.action_url ? `<a href="${data.action_url}" style="${btnStyle}">Review & Confirm</a>` : ""}
        ${footer}</div>`;

    case "background_check":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Background Check Update</h1>
        <p style="${mutedStyle}">${data.message || "Your background check status has been updated."}</p>
        ${data.action_url ? `<a href="${data.action_url}" style="${btnStyle}">View Details</a>` : ""}
        ${footer}</div>`;

    case "payment_receipt":
      return `<div style="${baseStyle}">${logo}
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #1a1a2e;">Payment Receipt</h1>
        <p style="${mutedStyle}">${data.message || "Your payment has been processed."}</p>
        <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 16px 0;">
          ${data.amount ? `<p style="margin: 0 0 4px;"><strong>Amount:</strong> $${data.amount}</p>` : ""}
          ${data.listing_title ? `<p style="margin: 0 0 4px;"><strong>Property:</strong> ${data.listing_title}</p>` : ""}
        </div>
        ${data.action_url ? `<a href="${data.action_url}" style="${btnStyle}">View Receipt</a>` : ""}
        ${footer}</div>`;

    default:
      return `<div style="${baseStyle}">${logo}<p style="${mutedStyle}">${data.message || ""}</p>${footer}</div>`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data } = (await req.json()) as EmailRequest;
    if (!to || !subject || !type) {
      throw new Error("Missing required fields: to, subject, type");
    }

    const html = renderEmail(type, data || {});

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const messageId = crypto.randomUUID();

    // Log pending
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: type,
      recipient_email: to,
      status: "pending",
    });

    // Enqueue for reliable delivery via process-email-queue
    const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to,
        from: `SubIn <noreply@${SENDER_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text: subject,
        purpose: "transactional",
        label: type,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error(`[SEND-EMAIL] Enqueue error: ${enqueueError.message}`);
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: type,
        recipient_email: to,
        status: "failed",
        error_message: "Failed to enqueue email",
      });
      throw new Error(`Failed to enqueue email: ${enqueueError.message}`);
    }

    console.log(`[SEND-EMAIL] Enqueued: To=${to}, Subject=${subject}, Type=${type}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email enqueued for delivery", messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SEND-EMAIL] Error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
