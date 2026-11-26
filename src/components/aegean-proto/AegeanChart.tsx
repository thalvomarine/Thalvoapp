import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MARINE_SEAMARK_TILE_URL } from "@/lib/chart-tiles";

const LIGHT_BASE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

const CLEAR_TILE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export type AegeanPin = {
  id: string;
  name: string;
  kind: "marina" | "anchorage" | "service";
  lat: number;
  lng: number;
};

const PINS: AegeanPin[] = [
  { id: "gocek", name: "D-Marin Göcek", kind: "marina", lat: 36.753, lng: 28.943 },
  { id: "marmaris", name: "Marmaris Yacht Marina", kind: "marina", lat: 36.851, lng: 28.278 },
  { id: "bodrum", name: "Bodrum Town Quay", kind: "marina", lat: 37.034, lng: 27.43 },
  { id: "yassica", name: "Yassıca Adaları", kind: "anchorage", lat: 36.715, lng: 28.925 },
  { id: "sarsala", name: "Sarsala Koyu", kind: "anchorage", lat: 36.705, lng: 28.968 },
  { id: "tech", name: "Aegean Marine Tech", kind: "service", lat: 36.845, lng: 28.265 },
];

const PIN_COLOR: Record<AegeanPin["kind"], string> = {
  marina: "#0B3A5B",
  anchorage: "#C9A227",
  service: "#1A7A8C",
};

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function Seamarks() {
  const map = useMap();
  const [on, setOn] = useState(false);
  useEffect(() => {
    const enable = () => {
      if (map.getZoom() >= 11) setOn(true);
    };
    enable();
    map.on("zoomend", enable);
    return () => {
      map.off("zoomend", enable);
    };
  }, [map]);
  if (!on) return null;
  return (
    <TileLayer
      url={MARINE_SEAMARK_TILE_URL}
      opacity={0.85}
      errorTileUrl={CLEAR_TILE}
      updateWhenIdle
      updateWhenZooming={false}
      keepBuffer={1}
    />
  );
}

export function AegeanChart({
  bay,
  className = "",
}: {
  bay: "aegean" | "mediterranean";
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const center = useMemo<[number, number]>(
    () => (bay === "aegean" ? [36.92, 28.05] : [36.55, 28.55]),
    [bay],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`ae-map h-full w-full bg-[#dfe8ef] ${className}`} aria-hidden />;
  }

  return (
    <div className={`ae-map h-full w-full ${className}`}>
      <MapContainer
        center={center}
        zoom={bay === "aegean" ? 9 : 8}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        preferCanvas
      >
        <TileLayer url={LIGHT_BASE} maxZoom={18} errorTileUrl={CLEAR_TILE} />
        <Seamarks />
        <Recenter center={center} />
        {PINS.map((pin) => (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={pin.kind === "marina" ? 8 : 6}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: PIN_COLOR[pin.kind],
              fillOpacity: 0.95,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span className="text-[12px] font-semibold text-[#0B3A5B]">{pin.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
