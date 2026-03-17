import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FOUNDER_EMAIL = "cemyilmaz050@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check — founder only
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !authData.user || authData.user.email?.toLowerCase() !== FOUNDER_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = authData.user.id;
    const body = await req.json();
    const { action } = body;

    // Action: lookup user by email
    if (action === "lookup_user") {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (!targetUser) {
        return new Response(JSON.stringify({ error: "No user found with that email" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", targetUser.id)
        .single();

      return new Response(JSON.stringify({
        user_id: targetUser.id,
        email: targetUser.email,
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list users for search
    if (action === "list_users") {
      const { search } = body;
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
      const users = (usersData?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
      }));

      const ids = users.map((u: any) => u.id);
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const result = users.map((u: any) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          first_name: p?.first_name || "",
          last_name: p?.last_name || "",
        };
      }).filter((u: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return u.email?.toLowerCase().includes(s) ||
          u.first_name?.toLowerCase().includes(s) ||
          u.last_name?.toLowerCase().includes(s);
      });

      return new Response(JSON.stringify({ users: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: create listing on behalf of user
    if (action === "create_listing") {
      const { tenant_id, listing } = body;
      if (!tenant_id || !listing) {
        return new Response(JSON.stringify({ error: "tenant_id and listing data required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify tenant exists
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", tenant_id)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = {
        tenant_id,
        address: listing.address || null,
        unit_number: listing.unit_number || null,
        property_type: listing.property_type || null,
        bedrooms: listing.bedrooms != null ? Number(listing.bedrooms) : null,
        bathrooms: listing.bathrooms != null ? Number(listing.bathrooms) : null,
        sqft: listing.sqft != null ? Number(listing.sqft) : null,
        headline: listing.headline || null,
        description: listing.description || null,
        monthly_rent: listing.monthly_rent != null ? Number(listing.monthly_rent) : null,
        security_deposit: listing.security_deposit != null ? Number(listing.security_deposit) : null,
        available_from: listing.available_from || null,
        available_until: listing.available_until || null,
        min_duration: listing.min_duration || 1,
        amenities: listing.amenities || [],
        house_rules: listing.house_rules || null,
        guest_policy: listing.guest_policy || null,
        photos: listing.photos || [],
        status: listing.status || "active",
        published_at: listing.status === "active" ? new Date().toISOString() : null,
        source: "admin",
      };

      const { data: newListing, error: insertError } = await supabaseAdmin
        .from("listings")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Notify the user
      await supabaseAdmin.from("notifications").insert({
        user_id: tenant_id,
        title: "Your listing on SubIn is ready!",
        message: "We set up a listing for you. Review it and let us know if anything needs changing.",
        type: "listing",
        link: `/listings/edit/${newListing.id}`,
      });

      return new Response(JSON.stringify({ success: true, listing_id: newListing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: create pending listing for non-signedup user
    if (action === "create_pending_listing") {
      const { pending_email, listing } = body;
      if (!pending_email || !listing) {
        return new Response(JSON.stringify({ error: "pending_email and listing data required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(pending_email)) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists — if so, redirect to normal flow
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase() === pending_email.toLowerCase()
      );
      if (existingUser) {
        return new Response(JSON.stringify({ 
          error: "This email already has an account. Use the normal listing creation flow instead.",
          existing_user: true
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create listing with admin as temporary tenant_id (will be reassigned on signup)
      const payload = {
        tenant_id: adminUserId,
        pending_email: pending_email.toLowerCase(),
        address: listing.address || null,
        unit_number: listing.unit_number || null,
        property_type: listing.property_type || null,
        bedrooms: listing.bedrooms != null ? Number(listing.bedrooms) : null,
        bathrooms: listing.bathrooms != null ? Number(listing.bathrooms) : null,
        sqft: listing.sqft != null ? Number(listing.sqft) : null,
        headline: listing.headline || null,
        description: listing.description || null,
        monthly_rent: listing.monthly_rent != null ? Number(listing.monthly_rent) : null,
        security_deposit: listing.security_deposit != null ? Number(listing.security_deposit) : null,
        available_from: listing.available_from || null,
        available_until: listing.available_until || null,
        min_duration: listing.min_duration || 1,
        amenities: listing.amenities || [],
        house_rules: listing.house_rules || null,
        guest_policy: listing.guest_policy || null,
        photos: listing.photos || [],
        status: "draft",
        source: "admin",
      };

      const { data: newListing, error: insertError } = await supabaseAdmin
        .from("listings")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Send activation email via the email queue
      const siteUrl = "https://sublet-smoothly-17.lovable.app";
      const signupUrl = `${siteUrl}/signup?email=${encodeURIComponent(pending_email)}`;
      const photoUrl = listing.photos?.[0] || null;
      
      try {
        await supabaseAdmin.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            to: pending_email,
            from_name: "SubIn",
            from_email: "hello@subinapp.com",
            subject: "Your SubIn listing is ready — activate your account",
            html: buildActivationEmailHtml({
              address: listing.address || "Your property",
              available_from: listing.available_from || "",
              available_until: listing.available_until || "",
              monthly_rent: listing.monthly_rent ? `$${Number(listing.monthly_rent).toLocaleString()}` : "",
              photo_url: photoUrl,
              signup_url: signupUrl,
            }),
          },
        });
      } catch (emailErr) {
        console.error("Failed to enqueue activation email:", emailErr);
        // Don't fail the listing creation if email fails
      }

      return new Response(JSON.stringify({ 
        success: true, 
        listing_id: newListing.id,
        pending: true,
        email: pending_email,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list pending listings
    if (action === "list_pending") {
      const { data: pendingListings, error: pendingErr } = await supabaseAdmin
        .from("listings")
        .select("id, address, unit_number, pending_email, created_at, monthly_rent, photos, status")
        .not("pending_email", "is", null)
        .order("created_at", { ascending: false });

      if (pendingErr) throw pendingErr;

      return new Response(JSON.stringify({ listings: pendingListings || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: resend activation email for a pending listing
    if (action === "resend_activation") {
      const { listing_id } = body;
      if (!listing_id) {
        return new Response(JSON.stringify({ error: "listing_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: listing, error: fetchErr } = await supabaseAdmin
        .from("listings")
        .select("*")
        .eq("id", listing_id)
        .not("pending_email", "is", null)
        .single();

      if (fetchErr || !listing) {
        return new Response(JSON.stringify({ error: "Pending listing not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const siteUrl = "https://sublet-smoothly-17.lovable.app";
      const signupUrl = `${siteUrl}/signup?email=${encodeURIComponent(listing.pending_email)}`;

      await supabaseAdmin.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          to: listing.pending_email,
          from_name: "SubIn",
          from_email: "hello@subinapp.com",
          subject: "Your SubIn listing is ready — activate your account",
          html: buildActivationEmailHtml({
            address: listing.address || "Your property",
            available_from: listing.available_from || "",
            available_until: listing.available_until || "",
            monthly_rent: listing.monthly_rent ? `$${Number(listing.monthly_rent).toLocaleString()}` : "",
            photo_url: listing.photos?.[0] || null,
            signup_url: signupUrl,
          }),
        },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: duplicate listing
    if (action === "duplicate_listing") {
      const { listing_id, overrides } = body;
      if (!listing_id) {
        return new Response(JSON.stringify({ error: "listing_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: original, error: fetchErr } = await supabaseAdmin
        .from("listings")
        .select("*")
        .eq("id", listing_id)
        .single();

      if (fetchErr || !original) {
        return new Response(JSON.stringify({ error: "Listing not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { id, created_at, updated_at, published_at, view_count, save_count, knock_count, pending_email, ...rest } = original;
      const duplicatePayload = {
        ...rest,
        ...overrides,
        status: "active",
        published_at: new Date().toISOString(),
        source: "admin",
        view_count: 0,
        save_count: 0,
        knock_count: 0,
      };

      const { data: dup, error: dupErr } = await supabaseAdmin
        .from("listings")
        .insert(duplicatePayload)
        .select("id")
        .single();

      if (dupErr) throw dupErr;

      return new Response(JSON.stringify({ success: true, listing_id: dup.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: bulk create from CSV data
    if (action === "bulk_create") {
      const { tenant_id, listings } = body;
      if (!tenant_id || !Array.isArray(listings) || listings.length === 0) {
        return new Response(JSON.stringify({ error: "tenant_id and listings array required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { index: number; success: boolean; listing_id?: string; error?: string }[] = [];

      for (let i = 0; i < listings.length; i++) {
        const l = listings[i];
        try {
          const payload = {
            tenant_id,
            address: l.address || null,
            unit_number: l.unit_number || null,
            property_type: l.property_type || null,
            bedrooms: l.bedrooms != null ? Number(l.bedrooms) : null,
            bathrooms: l.bathrooms != null ? Number(l.bathrooms) : null,
            sqft: l.sqft != null ? Number(l.sqft) : null,
            headline: l.headline || l.address || null,
            description: l.description || null,
            monthly_rent: l.monthly_rent != null ? Number(l.monthly_rent) : null,
            security_deposit: l.security_deposit != null ? Number(l.security_deposit) : null,
            available_from: l.available_from || null,
            available_until: l.available_until || null,
            amenities: l.amenities ? (typeof l.amenities === "string" ? l.amenities.split(",").map((a: string) => a.trim()) : l.amenities) : [],
            house_rules: l.house_rules || null,
            guest_policy: l.guest_policy || null,
            photos: l.photos ? (typeof l.photos === "string" ? l.photos.split(",").map((p: string) => p.trim()) : l.photos) : [],
            status: "active" as const,
            published_at: new Date().toISOString(),
            source: "admin",
          };

          const { data: newListing, error: insertErr } = await supabaseAdmin
            .from("listings")
            .insert(payload)
            .select("id")
            .single();

          if (insertErr) throw insertErr;
          results.push({ index: i, success: true, listing_id: newListing.id });
        } catch (err: any) {
          results.push({ index: i, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        await supabaseAdmin.from("notifications").insert({
          user_id: tenant_id,
          title: `${successCount} listing(s) created for you`,
          message: "The SubIn team set up listings for you. Review them and let us know if anything needs changing.",
          type: "listing",
          link: "/dashboard/tenant",
        });
      }

      return new Response(JSON.stringify({ results, total: listings.length, success_count: successCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Admin create listing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Build branded activation email HTML
function buildActivationEmailHtml(data: {
  address: string;
  available_from: string;
  available_until: string;
  monthly_rent: string;
  photo_url: string | null;
  signup_url: string;
}): string {
  const photoBlock = data.photo_url
    ? `<img src="${data.photo_url}" alt="Property" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />`
    : "";
  
  const dateRange = data.available_from && data.available_until
    ? `${data.available_from} — ${data.available_until}`
    : data.available_from || "Flexible";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:#4f46e5;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">SubIn</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    ${photoBlock}
    <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;font-weight:600;">Your listing is ready</h2>
    <p style="margin:0 0 20px;color:#71717a;font-size:14px;line-height:1.5;">
      A SubIn listing has been set up for your property. Create your account to manage it.
    </p>
    <table style="width:100%;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;">
        <span style="color:#71717a;font-size:12px;">Address</span><br/>
        <span style="color:#18181b;font-size:14px;font-weight:500;">${data.address}</span>
      </td></tr>
      ${data.monthly_rent ? `<tr><td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;">
        <span style="color:#71717a;font-size:12px;">Monthly Rent</span><br/>
        <span style="color:#4f46e5;font-size:16px;font-weight:700;">${data.monthly_rent}/mo</span>
      </td></tr>` : ""}
      <tr><td style="padding:12px 16px;">
        <span style="color:#71717a;font-size:12px;">Dates</span><br/>
        <span style="color:#18181b;font-size:14px;font-weight:500;">${dateRange}</span>
      </td></tr>
    </table>
    <a href="${data.signup_url}" style="display:block;background:#4f46e5;color:#ffffff;text-align:center;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">
      Activate my account and view my listing
    </a>
    <p style="margin:20px 0 0;color:#a1a1aa;font-size:12px;text-align:center;">
      Questions? Reply to this email or reach out at hello@subinapp.com
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
