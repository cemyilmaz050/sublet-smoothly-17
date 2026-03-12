export interface SubletFlowData {
  // Step 1 - Path selection
  path: "management" | "own" | "";

  // Path A fields
  managementGroupId: string;
  managementGroupName: string;
  managementGroupLogo: string;
  catalogPropertyId: string;
  catalogPropertyAddress: string;
  catalogPropertyPhoto: string;
  catalogUnitId: string;
  catalogUnitNumber: string;
  catalogUnitBedrooms: number;
  catalogUnitBathrooms: number;
  catalogUnitSqft: number;
  catalogUnitPhotos: string[];
  catalogUnitDescription: string;
  catalogUnitAmenities: string[];

  // Path B fields
  propertyType: string;
  spaceType: string;
  address: string;
  unitNumber: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  headline: string;
  description: string;
  bedrooms: number | "";
  bathrooms: number | "";
  sqft: number | "";
  floorNumber: number | "";
  maxOccupants: number | "";
  amenities: string[];
  photos: File[];
  photoUrls: string[];
  monthlyRent: number | "";
  securityDeposit: number | "";
  houseRules: {
    noSmoking: boolean;
    noPets: boolean;
    noParties: boolean;
    noUnregisteredGuests: boolean;
    quietHours: boolean;
  };
  customRules: string;
  guestPolicy: string;

  // Shared fields
  availableFrom: string;
  availableUntil: string;
  minDuration: number;
  flexibility: string;
  confirmPermission: boolean;
  confirmAccuracy: boolean;
}

export const defaultFlowData: SubletFlowData = {
  path: "",
  managementGroupId: "",
  managementGroupName: "",
  managementGroupLogo: "",
  catalogPropertyId: "",
  catalogPropertyAddress: "",
  catalogPropertyPhoto: "",
  catalogUnitId: "",
  catalogUnitNumber: "",
  catalogUnitBedrooms: 0,
  catalogUnitBathrooms: 0,
  catalogUnitSqft: 0,
  catalogUnitPhotos: [],
  catalogUnitDescription: "",
  catalogUnitAmenities: [],
  propertyType: "",
  spaceType: "",
  address: "",
  unitNumber: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  headline: "",
  description: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  floorNumber: "",
  maxOccupants: "",
  amenities: [],
  photos: [],
  photoUrls: [],
  monthlyRent: "",
  securityDeposit: "",
  houseRules: {
    noSmoking: false,
    noPets: false,
    noParties: false,
    noUnregisteredGuests: false,
    quietHours: false,
  },
  customRules: "",
  guestPolicy: "",
  availableFrom: "",
  availableUntil: "",
  minDuration: 1,
  flexibility: "exact",
  confirmPermission: false,
  confirmAccuracy: false,
};

export const AMENITIES_OPTIONS = [
  { icon: "📶", label: "WiFi" },
  { icon: "🛋️", label: "Furnished" },
  { icon: "❄️", label: "Air Conditioning" },
  { icon: "🔥", label: "Heating" },
  { icon: "🚗", label: "Parking" },
  { icon: "🐾", label: "Pets Allowed" },
  { icon: "🚿", label: "Washer/Dryer" },
  { icon: "📺", label: "TV" },
  { icon: "🍳", label: "Full Kitchen" },
  { icon: "🏋️", label: "Gym Access" },
  { icon: "🛗", label: "Elevator" },
  { icon: "♿", label: "Accessible" },
];

export type StepStatus = "active" | "completed" | "hidden";
