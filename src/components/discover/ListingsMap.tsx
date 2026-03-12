import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// Approximate coordinates for known locations
const LOCATION_COORDS: Record<string, [number, number]> = {
  "manhattan, ny": [40.7831, -73.9712],
  "brooklyn, ny": [40.6782, -73.9442],
  "jersey city, nj": [40.7178, -74.0431],
  "harlem, ny": [40.8116, -73.9465],
  "queens, ny": [40.7282, -73.7949],
  "hoboken, nj": [40.744, -74.0324],
  "astoria, ny": [40.7721, -73.9301],
  "williamsburg, ny": [40.7081, -73.9571],
  "upper west side, ny": [40.787, -73.9754],
  "east village, ny": [40.7265, -73.9815],
  "new york, ny": [40.7128, -74.006],
};

function getCoords(address: string | null): [number, number] | null {
  if (!address) return null;
  const lower = address.toLowerCase().trim();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  // Default: random NYC area with small offset
  return [40.73 + Math.random() * 0.08, -73.99 + Math.random() * 0.06];
}

function createPriceIcon(price: number | null, isActive: boolean) {
  const label = price ? `$${price.toLocaleString()}` : "???";
  return L.divIcon({
    className: "custom-price-marker",
    html: `<div style="
      background: ${isActive ? "hsl(var(--primary))" : "hsl(var(--card))"};
      color: ${isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"};
      border: 1.5px solid ${isActive ? "hsl(var(--primary))" : "hsl(var(--border))"};
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transform: translate(-50%, -100%);
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
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

interface ListingsMapProps {
  listings: ListingMapItem[];
  hoveredId: string | null;
  onSelect: (listing: ListingMapItem) => void;
}

export default function ListingsMap({ listings, hoveredId, onSelect }: ListingsMapProps) {
  const markers = listings
    .map((l) => {
      const coords = getCoords(l.address);
      if (!coords) return null;
      return { ...l, lat: coords[0], lng: coords[1] };
    })
    .filter(Boolean) as (ListingMapItem & { lat: number; lng: number })[];

  const allCoords: [number, number][] = markers.map((m) => [m.lat, m.lng]);
  const center: [number, number] = allCoords.length > 0
    ? [
        allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
        allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
      ]
    : [40.7128, -74.006];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full"
      zoomControl={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds coords={allCoords} />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={createPriceIcon(m.monthly_rent, hoveredId === m.id)}
          eventHandlers={{ click: () => onSelect(m) }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              {m.photos?.[0] && (
                <img
                  src={m.photos[0]}
                  alt=""
                  style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 6 }}
                />
              )}
              <strong style={{ fontSize: 13 }}>{m.headline || "Untitled"}</strong>
              <p style={{ fontSize: 12, margin: "2px 0", color: "#666" }}>{m.address}</p>
              {m.monthly_rent && (
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                  ${m.monthly_rent.toLocaleString()}/mo
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
