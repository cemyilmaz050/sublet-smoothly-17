import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-APPFOLIO] ${step}${d}`);
};

interface ParsedListing {
  property_name: string;
  unit_number: string;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  rent: number | null;
  available_from: string | null;
  photos: string[];
  description: string;
}

function parseAppFolioHTML(html: string, baseUrl: string): ParsedListing[] {
  const listings: ParsedListing[] = [];

  // AppFolio public listing pages typically use structured listing cards
  // We'll parse common patterns found in AppFolio listing pages

  // Match listing blocks - AppFolio uses various class patterns
  const listingRegex = /<div[^>]*class="[^"]*listing[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  const cardRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;

  // Try to find property cards using common AppFolio HTML patterns
  const propertyBlocks = html.match(/<div[^>]*class="[^"]*(?:listing-item|property-card|result)[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*(?:listing-item|property-card|result)[^"]*"|$)/gi) || [];

  // Also try table rows or repeated structures
  const altBlocks = html.match(/<tr[^>]*class="[^"]*listing[^"]*"[^>]*>[\s\S]*?<\/tr>/gi) || [];

  const blocks = propertyBlocks.length > 0 ? propertyBlocks : altBlocks;

  // If no structured blocks found, try a more generic approach
  if (blocks.length === 0) {
    logStep("No structured blocks found, trying generic parsing");
    // Look for address-like patterns paired with price patterns
    const addressPriceRegex = /(\d+[^<\n]{5,60}(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Cir)[^<\n]{0,40})[^$]*?\$\s*([\d,]+)/gi;
    let match;
    while ((match = addressPriceRegex.exec(html)) !== null) {
      const address = match[1].replace(/<[^>]*>/g, "").trim();
      const rent = parseInt(match[2].replace(/,/g, ""), 10);
      if (address && rent > 0) {
        listings.push({
          property_name: address.split(",")[0] || address,
          unit_number: "",
          address,
          bedrooms: null,
          bathrooms: null,
          rent: rent > 100 ? rent : null,
          available_from: null,
          photos: [],
          description: "",
        });
      }
    }
    return listings;
  }

  for (const block of blocks) {
    const getText = (pattern: RegExp): string => {
      const m = block.match(pattern);
      return m ? m[1].replace(/<[^>]*>/g, "").trim() : "";
    };

    // Extract address
    const address =
      getText(/class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\//) ||
      getText(/class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\//) ||
      getText(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/);

    // Extract rent
    const priceMatch = block.match(/\$\s*([\d,]+)/);
    const rent = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : null;

    // Extract beds/baths
    const bedMatch = block.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    const bathMatch = block.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);

    // Extract unit number
    const unitMatch = block.match(/(?:unit|apt|#)\s*([A-Za-z0-9-]+)/i);

    // Extract photos
    const photoMatches = [...block.matchAll(/(?:src|data-src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)];
    const photos = photoMatches.map((m) => m[1]);

    // Extract description
    const description =
      getText(/class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\//) ||
      getText(/class="[^"]*detail[^"]*"[^>]*>([\s\S]*?)<\//);

    // Extract availability date
    const dateMatch = block.match(/(?:available|avail)[^<]*?(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+\s+\d{1,2},?\s*\d{4})/i);
    const available_from = dateMatch ? dateMatch[1] : null;

    if (address || rent) {
      listings.push({
        property_name: address.split(",")[0] || "Property",
        unit_number: unitMatch ? unitMatch[1] : "",
        address: address || "Unknown",
        bedrooms: bedMatch ? parseInt(bedMatch[1], 10) : null,
        bathrooms: bathMatch ? parseFloat(bathMatch[1]) : null,
        rent: rent && rent > 100 ? rent : null,
        available_from,
        photos,
        description: description.substring(0, 500),
      });
    }
  }

  return listings;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    let managerId: string | null = null;

    // Check if called with a specific manager_id (for cron) or via auth
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    if (body.manager_id) {
      managerId = body.manager_id;
      logStep("Called via cron/manual with manager_id", { managerId });
    } else {
      // Auth-based call
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData.user) throw new Error("Unauthorized");
      managerId = userData.user.id;
      logStep("Authenticated manager", { managerId });
    }

    // Get manager's AppFolio URL
    const { data: integration, error: intError } = await supabaseAdmin
      .from("manager_integrations")
      .select("*")
      .eq("manager_id", managerId)
      .single();

    if (intError || !integration) {
      throw new Error("No AppFolio integration found for this manager");
    }

    logStep("Found integration", { url: integration.appfolio_url });

    // Validate URL format
    const url = integration.appfolio_url;
    if (!url.includes("appfolio.com")) {
      await supabaseAdmin.from("manager_integrations").update({
        status: "error",
        sync_error: "Invalid AppFolio URL. Must be a valid appfolio.com URL.",
      }).eq("id", integration.id);
      throw new Error("Invalid AppFolio URL");
    }

    // Fetch the public listings page
    const listingsUrl = url.endsWith("/") ? `${url}listings` : `${url}/listings`;
    logStep("Fetching listings from", { listingsUrl });

    const response = await fetch(listingsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SubletSafe/1.0)",
        "Accept": "text/html",
      },
    });

    if (!response.ok) {
      const errMsg = `Failed to fetch AppFolio page: HTTP ${response.status}`;
      await supabaseAdmin.from("manager_integrations").update({
        status: "error",
        sync_error: errMsg,
      }).eq("id", integration.id);
      throw new Error(errMsg);
    }

    const html = await response.text();
    logStep("Fetched HTML", { length: html.length });

    // Parse listings
    const parsed = parseAppFolioHTML(html, url);
    logStep("Parsed listings", { count: parsed.length });

    if (parsed.length === 0) {
      await supabaseAdmin.from("manager_integrations").update({
        status: "error",
        sync_error: "No listings found on the page. The URL may be incorrect or the page structure is unsupported.",
        last_synced_at: new Date().toISOString(),
      }).eq("id", integration.id);

      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No listings found on page" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert each listing
    let syncedCount = 0;
    for (const listing of parsed) {
      // Check for existing listing by address + unit
      const { data: existing } = await supabaseAdmin
        .from("listings")
        .select("id")
        .eq("address", listing.address)
        .eq("unit_number", listing.unit_number || "")
        .eq("source", "appfolio")
        .eq("manager_id", managerId)
        .maybeSingle();

      const listingData = {
        tenant_id: managerId!, // Using manager as tenant for appfolio-sourced listings
        manager_id: managerId,
        address: listing.address,
        unit_number: listing.unit_number || null,
        headline: listing.property_name.substring(0, 60),
        description: listing.description || null,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms ? Math.floor(listing.bathrooms) : null,
        monthly_rent: listing.rent,
        available_from: listing.available_from || null,
        photos: listing.photos,
        source: "appfolio",
        status: "active" as const,
      };

      if (existing) {
        await supabaseAdmin.from("listings").update(listingData).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("listings").insert(listingData);
      }
      syncedCount++;
    }

    logStep("Sync complete", { syncedCount });

    // Update integration status
    await supabaseAdmin.from("manager_integrations").update({
      status: "connected",
      sync_error: null,
      last_synced_at: new Date().toISOString(),
      synced_count: syncedCount,
    }).eq("id", integration.id);

    return new Response(
      JSON.stringify({ success: true, synced: syncedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
