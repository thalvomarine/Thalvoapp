import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPlaceholder } from "@/components/ClientOnly";
import {
  MARINE_DARK_TILE_MAX_NATIVE_ZOOM,
  MARINE_PUBLIC_BASE_URL,
  MARINE_SEAMARK_TILE_URL,
} from "@/lib/chart-tiles";
import { formatDm } from "@/lib/formatters";

export type CharterPortPin = {
  name: string;
  lat: number;
  lng: number;
  count: number;
};

function FitPorts({ ports }: { ports: CharterPortPin[] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize({ animate: false });
    if (ports.length === 0) {
      map.setView([37.0, 27.5], 5, { animate: false });
      return;
    }
    if (ports.length === 1) {
      map.setView([ports[0]!.lat, ports[0]!.lng], 9, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(ports.map((port) => [port.lat, port.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.35), { animate: false, maxZoom: 8 });
  }, [map, ports]);
  return null;
}

/** Static home-port chart. No live boats, no technicians. */
export function CharterBaseChart({
  ports,
  active,
  onSelect,
  className = "",
}: {
  ports: CharterPortPin[];
  active: string;
  onSelect: (name: string) => void;
  className?: string;
}) {
  const key = useMemo(() => ports.map((port) => port.name).join("|"), [ports]);

  if (typeof window === "undefined") {
    return <MapPlaceholder className={"min-h-[220px] " + className} style={{ minHeight: 220 }} />;
  }

  return (
    <div className={"overflow-hidden rounded-3xl border border-white/10 " + className}>
      <MapContainer
        key={key || "empty"}
        center={[37.0, 27.5]}
        zoom={5}
        className="h-[220px] w-full sm:h-[280px]"
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url={MARINE_PUBLIC_BASE_URL}
          maxNativeZoom={MARINE_DARK_TILE_MAX_NATIVE_ZOOM}
          attribution="Tiles © Esri"
        />
        <TileLayer url={MARINE_SEAMARK_TILE_URL} opacity={0.85} />
        <FitPorts ports={ports} />
        {ports.map((port) => {
          const selected = active.trim().toLocaleLowerCase("tr") === port.name.toLocaleLowerCase("tr");
          return (
            <CircleMarker
              key={port.name}
              center={[port.lat, port.lng]}
              radius={selected ? 10 : 7}
              pathOptions={{
                color: selected ? "#F5B942" : "#00F0FF",
                weight: 2,
                fillColor: selected ? "#F5B942" : "#0A192F",
                fillOpacity: selected ? 0.95 : 0.85,
              }}
              eventHandlers={{
                click: () => onSelect(selected ? "" : port.name),
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <span className="font-semibold">{port.name}</span>
                <span className="ml-2 opacity-70">{port.count}</span>
                <div className="font-mono text-[10px] opacity-60">{formatDm(port.lat, port.lng)}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
