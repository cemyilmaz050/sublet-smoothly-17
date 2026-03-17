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

      // Get profiles
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

      const { id, created_at, updated_at, published_at, view_count, save_count, knock_count, ...rest } = original;
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

      // Notify user
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
