import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ListingMapItem {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  lat?: number;
  lng?: number;
}

const LOCATION_COORDS: Record<string, [number, number]> = {
  // Boston area
  "boston, ma": [42.3601, -71.0589],
  "roxbury crossing, ma": [42.3312, -71.0995],
  "roxbury, ma": [42.3312, -71.0883],
  "newbury street": [42.3510, -71.0810],
  "back bay": [42.3503, -71.0810],
  "beacon hill": [42.3588, -71.0707],
  "south end": [42.3420, -71.0724],
  "fenway": [42.3467, -71.0972],
  "allston, ma": [42.3539, -71.1337],
  "brighton, ma": [42.3484, -71.1564],
  "cambridge, ma": [42.3736, -71.1097],
  "somerville, ma": [42.3876, -71.0995],
  "brookline, ma": [42.3318, -71.1212],
  "jamaica plain": [42.3097, -71.1151],
  "dorchester, ma": [42.3016, -71.0674],
  "south boston": [42.3381, -71.0476],
  "charlestown, ma": [42.3782, -71.0602],
  // NYC area (keep for flexibility)
  "manhattan, ny": [40.7831, -73.9712],
  "brooklyn, ny": [40.6782, -73.9442],
  "new york, ny": [40.7128, -74.006],
};

function getCoords(address: string | null): [number, number] | null {
  if (!address) return null;
  const lower = address.toLowerCase().trim();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  // Default to Boston area with slight randomization
  return [42.35 + Math.random() * 0.03, -71.08 + Math.random() * 0.04];
}

// --- Price Tag Styles ---
const PILL_COMMON = `
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Inter', system-ui, sans-serif;
  white-space: nowrap;
  cursor: pointer;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.15s ease;
  animation: priceTagFadeIn 0.4s ease-out both;
`;

const BASE_STYLE = `
  ${PILL_COMMON}
  background: #ffffff;
  color: #1A1A2E;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04);
  transform: translate(-50%, -100%);
`;

const ACTIVE_STYLE = `
  ${PILL_COMMON}
  background: #4845D2;
  color: #ffffff;
  border: 1px solid #4845D2;
  box-shadow: 0 4px 16px rgba(72,69,210,0.35), 0 2px 4px rgba(0,0,0,0.08);
  transform: translate(-50%, -100%) scale(1.05);
`;

const MOBILE_EXTRA = `
  padding: 8px 16px;
  font-size: 14px;
  min-height: 44px;
`;

const CLUSTER_STYLE = `
  ${PILL_COMMON}
  background: #4845D2;
  color: #ffffff;
  border: 1px solid #4845D2;
  box-shadow: 0 4px 16px rgba(72,69,210,0.35), 0 2px 4px rgba(0,0,0,0.08);
  transform: translate(-50%, -100%);
  padding: 6px 14px;
  font-size: 12px;
`;

const NOTCH = `<span style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid currentBgColor;"></span>`;

function createPriceIcon(price: number | null, isActive: boolean, isMobile: boolean, animDelay: number = 0) {
  const label = price ? `$${price.toLocaleString()}/mo` : "$-";
  const style = isActive
    ? ACTIVE_STYLE
    : BASE_STYLE + (isMobile ? MOBILE_EXTRA : "");
  const delayStyle = animDelay > 0 ? `animation-delay: ${animDelay}ms;` : "";
  const bgColor = isActive ? '#4845D2' : '#ffffff';
  const notch = NOTCH.replace('currentBgColor', bgColor);

  return L.divIcon({
    className: "subin-price-marker",
    html: `<div style="${style} ${delayStyle}"
      onmouseenter="this.style.background='#4845D2';this.style.color='#ffffff';this.style.borderColor='#4845D2';this.style.transform='translate(-50%,-100%) scale(1.05)';this.style.boxShadow='0 4px 16px rgba(72,69,210,0.35), 0 2px 4px rgba(0,0,0,0.08)';this.querySelector('.notch').style.borderTopColor='#4845D2';"
      onmouseleave="${isActive ? '' : "this.style.background='#ffffff';this.style.color='#1A1A2E';this.style.borderColor='rgba(0,0,0,0.08)';this.style.transform='translate(-50%,-100%) scale(1)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)';this.querySelector('.notch').style.borderTopColor='#ffffff';"}"
    >${label}<span class="notch" style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid ${bgColor};"></span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createClusterIcon(count: number, animDelay: number = 0) {
  const delayStyle = animDelay > 0 ? `animation-delay: ${animDelay}ms;` : "";
  return L.divIcon({
    className: "subin-cluster-marker",
    html: `<div style="${CLUSTER_STYLE} ${delayStyle}"
      onmouseenter="this.style.transform='translate(-50%,-100%) scale(1.08)';this.style.boxShadow='0 6px 20px rgba(72,69,210,0.45), 0 2px 4px rgba(0,0,0,0.08)';this.querySelector('.notch').style.borderTopColor='#3d3ab8';"
      onmouseleave="this.style.transform='translate(-50%,-100%) scale(1)';this.style.boxShadow='0 4px 16px rgba(72,69,210,0.35), 0 2px 4px rgba(0,0,0,0.08)';this.querySelector('.notch').style.borderTopColor='#4845D2';"
    >${count} listings<span class="notch" style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #4845D2;"></span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// --- Clustering Logic ---
interface ClusteredMarker {
  type: "single";
  listing: ListingMapItem & { lat: number; lng: number };
}

interface ClusterGroup {
  type: "cluster";
  listings: (ListingMapItem & { lat: number; lng: number })[];
  center: [number, number];
}

type MapMarker = ClusteredMarker | ClusterGroup;

function clusterMarkers(
  markers: (ListingMapItem & { lat: number; lng: number })[],
  zoomLevel: number
): MapMarker[] {
  // At high zoom, don't cluster
  if (zoomLevel >= 14 || markers.length <= 1) {
    return markers.map((m) => ({ type: "single", listing: m }));
  }

  // Distance threshold based on zoom (in degrees, approximate)
  const threshold = 0.15 / Math.pow(2, zoomLevel - 10);
  const used = new Set<number>();
  const result: MapMarker[] = [];

  for (let i = 0; i < markers.length; i++) {
    if (used.has(i)) continue;
    const group = [markers[i]];
    used.add(i);

    for (let j = i + 1; j < markers.length; j++) {
      if (used.has(j)) continue;
      const dx = markers[i].lat - markers[j].lat;
      const dy = markers[i].lng - markers[j].lng;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        group.push(markers[j]);
        used.add(j);
      }
    }

    if (group.length === 1) {
      result.push({ type: "single", listing: group[0] });
    } else {
      const cLat = group.reduce((s, g) => s + g.lat, 0) / group.length;
      const cLng = group.reduce((s, g) => s + g.lng, 0) / group.length;
      result.push({ type: "cluster", listings: group, center: [cLat, cLng] });
    }
  }

  return result;
}

// --- Map Zoom Tracker ---
function ZoomTracker({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onZoomChange(map.getZoom());
    map.on("zoomend", handler);
    onZoomChange(map.getZoom());
    return () => { map.off("zoomend", handler); };
  }, [map, onZoomChange]);
  return null;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (coords.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      fitted.current = true;
    }
  }, [coords, map]);
  return null;
}

function ZoomToCluster({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, Math.min(map.getZoom() + 2, 16), { duration: 0.5 });
    }
  }, [center, map]);
  return null;
}

// --- CSS injection ---
const PRICE_TAG_CSS = `
  @keyframes priceTagFadeIn {
    0% { opacity: 0; transform: translate(-50%, -100%) scale(0.85); }
    100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
  }
  .subin-price-marker, .subin-cluster-marker {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
`;

interface ListingsMapProps {
  listings: ListingMapItem[];
  hoveredId: string | null;
  onSelect: (listing: ListingMapItem) => void;
  selectedId?: string | null;
}

export default function ListingsMap({ listings, hoveredId, onSelect, selectedId }: ListingsMapProps) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(12);
  const [clusterZoomTarget, setClusterZoomTarget] = useState<[number, number] | null>(null);
  const [bottomSheetListing, setBottomSheetListing] = useState<ListingMapItem | null>(null);
  const styleInjected = useRef(false);

  // Inject CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    const style = document.createElement("style");
    style.textContent = PRICE_TAG_CSS;
    document.head.appendChild(style);
    styleInjected.current = true;
  }, []);

  const markers = listings
    .map((l) => {
      // Prefer DB lat/lng, fall back to address geocoding
      if ((l as any).latitude && (l as any).longitude) {
        return { ...l, lat: (l as any).latitude, lng: (l as any).longitude };
      }
      const coords = getCoords(l.address);
      if (!coords) return null;
      return { ...l, lat: coords[0], lng: coords[1] };
    })
    .filter(Boolean) as (ListingMapItem & { lat: number; lng: number })[];

  const clustered = clusterMarkers(markers, zoom);

  const allCoords: [number, number][] = markers.map((m) => [m.lat, m.lng]);
  const center: [number, number] = allCoords.length > 0
    ? [
        allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
        allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
      ]
    : [42.3601, -71.0589]; // Default to Boston

  const handleZoomChange = useCallback((z: number) => setZoom(z), []);

  const handleMarkerClick = useCallback((listing: ListingMapItem) => {
    if (isMobile) {
      setBottomSheetListing(listing);
    } else {
      onSelect(listing);
    }
  }, [isMobile, onSelect]);

  const handleClusterClick = useCallback((center: [number, number]) => {
    setClusterZoomTarget(center);
    // Reset after animation
    setTimeout(() => setClusterZoomTarget(null), 600);
  }, []);

  return (
    <>
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds coords={allCoords} />
        <ZoomTracker onZoomChange={handleZoomChange} />
        <ZoomToCluster center={clusterZoomTarget} />

        {clustered.map((item, idx) => {
          if (item.type === "cluster") {
            return (
              <Marker
                key={`cluster-${idx}`}
                position={item.center}
                icon={createClusterIcon(item.listings.length, idx * 60)}
                eventHandlers={{ click: () => handleClusterClick(item.center) }}
              />
            );
          }

          const m = item.listing;
          const isActive = hoveredId === m.id || selectedId === m.id;
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={createPriceIcon(m.monthly_rent, isActive, isMobile, idx * 60)}
              eventHandlers={{ click: () => handleMarkerClick(m) }}
            />
          );
        })}
      </MapContainer>

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <Sheet open={!!bottomSheetListing} onOpenChange={(open) => !open && setBottomSheetListing(null)}>
          <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-3">
            {bottomSheetListing && (
              <div className="space-y-3">
                {/* Drag handle */}
                <div className="mx-auto h-1 w-10 rounded-full bg-border" />

                {bottomSheetListing.photos?.[0] && (
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={bottomSheetListing.photos[0]}
                      alt={bottomSheetListing.headline || ""}
                      className="h-44 w-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {bottomSheetListing.headline || "Untitled Listing"}
                  </h3>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {bottomSheetListing.address || "Unknown location"}
                  </p>
                </div>

                <p className="text-2xl font-bold" style={{ color: "#4845D2" }}>
                  ${bottomSheetListing.monthly_rent?.toLocaleString() ?? "—"}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>

                <Button
                  className="w-full"
                  onClick={() => {
                    onSelect(bottomSheetListing);
                    setBottomSheetListing(null);
                  }}
                >
                  View Listing <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
