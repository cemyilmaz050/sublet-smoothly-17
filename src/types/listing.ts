export interface ListingFormData {
  // Step 1: Property Basics
  address: string;
  unit_number: string;
  property_type: "apartment" | "condo" | "studio" | "house" | "";
  bedrooms: number | "";
  bathrooms: number | "";
  sqft: number | "";
  management_type: "bbg" | "self" | "";

  // Step 2: Photos & Description
  photos: File[];
  photoUrls: string[];
  headline: string;
  description: string;

  // Step 3: Pricing & Availability
  monthly_rent: number | "";
  security_deposit: number | "";
  available_from: string;
  available_until: string;
  min_duration: number;

  // Step 4: House Rules & Amenities
  amenities: string[];
  house_rules: string;
  guest_policy: "no_guests" | "occasional_guests" | "guests_allowed" | "";
}

export const defaultListingForm: ListingFormData = {
  address: "",
  unit_number: "",
  property_type: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  management_type: "",
  photos: [],
  photoUrls: [],
  headline: "",
  description: "",
  monthly_rent: "",
  security_deposit: "",
  available_from: "",
  available_until: "",
  min_duration: 1,
  amenities: [],
  house_rules: "",
  guest_policy: "",
};

export const AMENITIES_LIST = [
  "WiFi",
  "Furnished",
  "Air Conditioning",
  "Heating",
  "Washer/Dryer",
  "Parking",
  "Pets Allowed",
  "Smoking Allowed",
];

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "studio", label: "Studio" },
  { value: "house", label: "House" },
];

export const GUEST_POLICIES = [
  { value: "no_guests", label: "No guests" },
  { value: "occasional_guests", label: "Occasional guests" },
  { value: "guests_allowed", label: "Guests allowed" },
];

export const MIN_DURATIONS = [
  { value: 1, label: "1 month" },
  { value: 2, label: "2 months" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
];
