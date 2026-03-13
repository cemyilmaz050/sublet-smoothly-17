export interface SubletFlowData {
  // Frame 1 - Arrangement
  arrangement: "manager" | "owner" | "other" | "";

  // Frame 2 - Property type
  propertyType: "house" | "apartment" | "condo" | "studio" | "";

  // Frame 3 - Space type
  spaceType: "entire" | "private" | "shared" | "";

  // Frame 4 - Location
  address: string;
  unitNumber: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;

  // Frame 5 - Dates
  availableFrom: string;
  availableUntil: string;
  minDuration: number;
  moveInFlexibility: "exact" | "week" | "month";
}

export const defaultFlowData: SubletFlowData = {
  arrangement: "",
  propertyType: "",
  spaceType: "",
  address: "",
  unitNumber: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  latitude: null,
  longitude: null,
  availableFrom: "",
  availableUntil: "",
  minDuration: 1,
  moveInFlexibility: "exact",
};
