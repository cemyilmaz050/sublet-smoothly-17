export interface FinderAnswers {
  reason: string;
  locations: string[];
  moveIn: string;
  moveOut: string;
  datePreset: string;
  budgetMin: number;
  budgetMax: number;
  occupants: string;
  priorities: string[];
  dealbreakers: string[];
}

export interface ScoredListing {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  amenities: string[] | null;
  bedrooms: number | null;
  bathrooms: number | null;
  available_from: string | null;
  available_until: string | null;
  description: string | null;
  knock_count: number;
  space_type: string | null;
  sqft: number | null;
  matchScore: number;
  matchReasons: string[];
  aiSummary: string;
  distanceLabel?: string;
}
