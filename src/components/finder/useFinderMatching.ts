import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinderAnswers, ScoredListing } from "./types";

// Location proximity mapping (approximate Boston distances)
const locationCoords: Record<string, { lat: number; lng: number }> = {
  "Northeastern University": { lat: 42.3398, lng: -71.0892 },
  "Boston University": { lat: 42.3505, lng: -71.1054 },
  "MIT": { lat: 42.3601, lng: -71.0942 },
  "Harvard University": { lat: 42.3770, lng: -71.1167 },
  "Tufts University": { lat: 42.4075, lng: -71.1190 },
  "Boston College": { lat: 42.3355, lng: -71.1685 },
  "Suffolk University": { lat: 42.3588, lng: -71.0618 },
  "Emerson College": { lat: 42.3526, lng: -71.0658 },
  "Fidelity Investments": { lat: 42.3563, lng: -71.0545 },
  "Wayfair": { lat: 42.3630, lng: -71.0510 },
  "Moderna": { lat: 42.3680, lng: -71.0835 },
  "Boston Consulting Group": { lat: 42.3555, lng: -71.0565 },
  "Mass General Hospital": { lat: 42.3631, lng: -71.0686 },
  "HubSpot": { lat: 42.3629, lng: -71.0834 },
  "Raytheon": { lat: 42.3360, lng: -71.0990 },
  "Bain & Company": { lat: 42.3530, lng: -71.0700 },
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const amenityKeywords: Record<string, string[]> = {
  "Furnished": ["furnished"],
  "Utilities included": ["utilities", "util"],
  "Laundry in building": ["laundry"],
  "Pet friendly": ["pet"],
  "Private bathroom": ["private bath", "private bathroom"],
  "Parking": ["parking"],
  "Fast WiFi": ["wifi", "internet"],
  "Quiet neighborhood": ["quiet"],
};

export function useFinderMatching() {
  const matchListings = useCallback(async (answers: FinderAnswers): Promise<ScoredListing[]> => {
    // Fetch active listings
    const { data: listings, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active");

    if (error || !listings) return [];

    // Get target coordinates from user's selected locations
    const targetCoords = answers.locations
      .map((loc) => locationCoords[loc])
      .filter(Boolean);

    const scored: ScoredListing[] = listings
      .map((listing) => {
        let score = 0;
        const matchReasons: string[] = [];

        // === 1. PRICE WITHIN BUDGET (25%) ===
        if (listing.monthly_rent !== null) {
          if (listing.monthly_rent <= answers.budgetMax) {
            const ratio = 1 - listing.monthly_rent / answers.budgetMax;
            score += 25 * (0.5 + ratio * 0.5); // Cheaper = better score
            matchReasons.push("Within budget");
          } else {
            return null; // Hard filter: exclude over budget
          }
        }

        // === 2. DATE RANGE (hard filter) ===
        if (answers.moveIn && answers.moveOut) {
          if (listing.available_from && listing.available_from > answers.moveIn) return null;
          if (listing.available_until && listing.available_until < answers.moveOut) return null;
          matchReasons.push("Available dates match");
        }

        // === 3. LOCATION PROXIMITY (30%) ===
        if (listing.latitude && listing.longitude && targetCoords.length > 0) {
          const distances = targetCoords.map((c) =>
            haversineDistance(listing.latitude!, listing.longitude!, c.lat, c.lng)
          );
          const minDist = Math.min(...distances);
          if (minDist < 0.5) { score += 30; matchReasons.push("Walking distance"); }
          else if (minDist < 1) { score += 25; matchReasons.push("Under 1 mile away"); }
          else if (minDist < 2) { score += 18; matchReasons.push("Under 2 miles away"); }
          else if (minDist < 5) { score += 10; matchReasons.push("Under 5 miles away"); }
          else { score += 3; }
        } else {
          score += 10; // No coordinates — neutral score
        }

        // === 4. AMENITIES MATCH (25%) ===
        const listingAmenities = (listing.amenities || []).map((a) => a.toLowerCase());
        const listingDesc = (listing.description || "").toLowerCase();
        let amenityHits = 0;
        for (const prio of answers.priorities) {
          const keywords = amenityKeywords[prio] || [prio.toLowerCase()];
          const found = keywords.some(
            (kw) => listingAmenities.some((a) => a.includes(kw)) || listingDesc.includes(kw)
          );
          if (found) {
            amenityHits++;
            matchReasons.push(prio);
          }
        }
        if (answers.priorities.length > 0) {
          score += 25 * (amenityHits / answers.priorities.length);
        } else {
          score += 15;
        }

        // === 5. TRUST SIGNALS (20%) ===
        score += 10; // Base trust for being on platform
        if (listing.knock_count > 3) { score += 5; matchReasons.push("Popular listing"); }
        if (listing.photos && listing.photos.length >= 3) { score += 5; matchReasons.push("Many photos"); }

        // Dealbreaker filters
        for (const db of answers.dealbreakers) {
          if (db === "Must be furnished" && !listingAmenities.some((a) => a.includes("furnished")) && !listingDesc.includes("furnished")) {
            return null;
          }
          if (db === "Must allow pets" && listingDesc.includes("no pets")) {
            return null;
          }
          if (db === "Must have AC" && !listingAmenities.some((a) => a.includes("ac") || a.includes("air conditioning")) && !listingDesc.includes("ac")) {
            return null;
          }
        }

        // Distance label
        let distanceLabel: string | undefined;
        if (listing.latitude && listing.longitude && targetCoords.length > 0) {
          const distances = targetCoords.map((c) =>
            haversineDistance(listing.latitude!, listing.longitude!, c.lat, c.lng)
          );
          const minDist = Math.min(...distances);
          const minWalk = Math.round(minDist * 20); // ~20 min per mile walking
          distanceLabel = minWalk <= 5 ? `${minWalk} min walk to ${answers.locations[0]}` : `${minDist.toFixed(1)} mi from ${answers.locations[0]}`;
        }

        const finalScore = Math.min(99, Math.round(score));

        // Generate AI summary
        const summaryParts: string[] = [];
        if (matchReasons.includes("Walking distance")) {
          summaryParts.push(`Perfect for your ${answers.reason.toLowerCase()} — ${distanceLabel}`);
        } else if (distanceLabel) {
          summaryParts.push(`${distanceLabel}`);
        }
        if (matchReasons.includes("Furnished")) summaryParts.push("fully furnished");
        if (matchReasons.includes("Utilities included")) summaryParts.push("utilities included");
        if (matchReasons.includes("Within budget")) summaryParts.push("within your budget");

        const aiSummary = summaryParts.length > 0
          ? summaryParts.join(", ")
          : `Great option for your Boston summer — ${listing.space_type || "full"} space with ${listing.bedrooms || 1} bedroom${(listing.bedrooms || 1) > 1 ? "s" : ""}`;

        return {
          id: listing.id,
          headline: listing.headline,
          address: listing.address,
          monthly_rent: listing.monthly_rent,
          photos: listing.photos,
          amenities: listing.amenities,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          available_from: listing.available_from,
          available_until: listing.available_until,
          description: listing.description,
          knock_count: listing.knock_count,
          space_type: listing.space_type,
          sqft: listing.sqft,
          matchScore: finalScore,
          matchReasons,
          aiSummary: aiSummary.charAt(0).toUpperCase() + aiSummary.slice(1),
          distanceLabel,
        } as ScoredListing;
      })
      .filter(Boolean) as ScoredListing[];

    // Sort by score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, 20); // Return top 20
  }, []);

  return { matchListings };
}
