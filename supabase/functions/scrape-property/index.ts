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
    // Auth check — founder only
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !authData.user || !FOUNDER_IDS.includes(authData.user.id)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return new Response(JSON.stringify({ error: "Only HTTP/HTTPS URLs allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the page HTML
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch page: ${response.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await response.text();

    // Extract data from meta tags and structured data
    const result: Record<string, any> = {
      address: "",
      description: "",
      photos: [] as string[],
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      monthly_rent: null,
      headline: "",
      amenities: [] as string[],
    };

    // Try to extract JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "SingleFamilyResidence" || item["@type"] === "Apartment" || item["@type"] === "Product" || item["@type"] === "RealEstateListing") {
            if (item.name) result.headline = item.name;
            if (item.description) result.description = item.description;
            if (item.address) {
              const addr = typeof item.address === "string" ? item.address : 
                `${item.address.streetAddress || ""}, ${item.address.addressLocality || ""}, ${item.address.addressRegion || ""} ${item.address.postalCode || ""}`.trim();
              result.address = addr.replace(/^,\s*/, "").replace(/,\s*$/, "");
            }
            if (item.numberOfBedrooms) result.bedrooms = Number(item.numberOfBedrooms);
            if (item.numberOfBathroomsTotal) result.bathrooms = Number(item.numberOfBathroomsTotal);
            if (item.floorSize?.value) result.sqft = Number(item.floorSize.value);
            if (item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image];
              result.photos = imgs.filter((i: any) => typeof i === "string" && i.startsWith("http")).slice(0, 20);
            }
          }
        }
      } catch {}
    }

    // Extract from Open Graph meta tags as fallback
    const ogTitle = html.match(/<meta[^>]*property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']*)["']/i);
    const ogDesc = html.match(/<meta[^>]*property\s*=\s*["']og:description["'][^>]*content\s*=\s*["']([^"']*)["']/i);
    const ogImage = html.match(/<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']*)["']/i);

    if (!result.headline && ogTitle) result.headline = ogTitle[1];
    if (!result.description && ogDesc) result.description = ogDesc[1];
    if (result.photos.length === 0 && ogImage) result.photos = [ogImage[1]];

    // Extract images from the page (property photos)
    if (result.photos.length === 0) {
      const imgMatches = html.matchAll(/<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*/gi);
      const imgs: string[] = [];
      for (const m of imgMatches) {
        const src = m[1];
        if (src.startsWith("http") && (src.includes("photo") || src.includes("image") || src.includes("pic") || src.includes("jpg") || src.includes("jpeg") || src.includes("png") || src.includes("webp"))) {
          if (!src.includes("logo") && !src.includes("icon") && !src.includes("avatar") && !src.includes("sprite")) {
            imgs.push(src);
          }
        }
        if (imgs.length >= 20) break;
      }
      result.photos = imgs;
    }

    // Extract bed/bath from text patterns
    if (!result.bedrooms) {
      const bedMatch = html.match(/(\d+)\s*(?:bed(?:room)?s?|bd|br)\b/i);
      if (bedMatch) result.bedrooms = Number(bedMatch[1]);
    }
    if (!result.bathrooms) {
      const bathMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|ba)\b/i);
      if (bathMatch) result.bathrooms = Number(bathMatch[1]);
    }
    if (!result.sqft) {
      const sqftMatch = html.match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i);
      if (sqftMatch) result.sqft = Number(sqftMatch[1].replace(/,/g, ""));
    }

    // Extract price
    const priceMatch = html.match(/\$\s*([\d,]+)\s*(?:\/\s*mo|per\s*month|month)/i);
    if (priceMatch) result.monthly_rent = Number(priceMatch[1].replace(/,/g, ""));

    // Extract address from title if not found
    if (!result.address) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) {
        // Often property titles contain the address
        const title = titleMatch[1];
        const addrMatch = title.match(/\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:St|Ave|Rd|Dr|Blvd|Ln|Way|Ct|Pl|Cir)\.?)?/);
        if (addrMatch) result.address = addrMatch[0];
      }
    }

    // Clean up description (remove HTML tags)
    if (result.description) {
      result.description = result.description.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim().substring(0, 2000);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
