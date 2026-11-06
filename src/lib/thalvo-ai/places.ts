/**
 * Named Turkish-coast waters for weather / seamanship answers.
 * Coordinates are cruising-region references, not berth pins.
 */

export interface NamedWater {
  name: string;
  lat: number;
  lng: number;
  keys: string[];
  region: "aegean" | "mediterranean";
}

export const NAMED_WATERS: NamedWater[] = [
  { name: "Didim", lat: 37.375, lng: 27.267, keys: ["didim"], region: "aegean" },
  { name: "Bodrum", lat: 37.034, lng: 27.43, keys: ["bodrum"], region: "aegean" },
  { name: "Datça", lat: 36.727, lng: 27.686, keys: ["datça", "datca"], region: "aegean" },
  { name: "Marmaris", lat: 36.8525, lng: 28.278, keys: ["marmaris"], region: "aegean" },
  { name: "Göcek", lat: 36.7525, lng: 28.9428, keys: ["göcek", "gocek"], region: "mediterranean" },
  { name: "Fethiye", lat: 36.621, lng: 29.116, keys: ["fethiye"], region: "mediterranean" },
  { name: "Kaş", lat: 36.2, lng: 29.64, keys: ["kaş", "kas"], region: "mediterranean" },
  { name: "Finike", lat: 36.295, lng: 30.145, keys: ["finike"], region: "mediterranean" },
  { name: "Kemer", lat: 36.597, lng: 30.56, keys: ["kemer"], region: "mediterranean" },
  { name: "Antalya", lat: 36.885, lng: 30.705, keys: ["antalya"], region: "mediterranean" },
];

const REGION_POINTS: Array<{
  name: string;
  lat: number;
  lng: number;
  keys: string[];
  region: "aegean" | "mediterranean";
}> = [
  {
    name: "Ege",
    lat: 37.15,
    lng: 27.2,
    keys: ["ege", "aegean", "eğe"],
    region: "aegean",
  },
  {
    name: "Akdeniz",
    lat: 36.35,
    lng: 29.1,
    keys: ["akdeniz", "mediterranean", "med"],
    region: "mediterranean",
  },
];

/** Resolve a marina / bay / coastal region name from free text. */
export function resolveNamedPlace(text: string): NamedWater | null {
  const q = text.toLocaleLowerCase("tr");
  for (const water of NAMED_WATERS) {
    if (water.keys.some((key) => q.includes(key))) return water;
  }
  for (const region of REGION_POINTS) {
    if (region.keys.some((key) => q.includes(key))) {
      return {
        name: region.name,
        lat: region.lat,
        lng: region.lng,
        keys: region.keys,
        region: region.region,
      };
    }
  }
  return null;
}

/** Exact place lookup for tool args (case-insensitive name or known key). */
export function lookupPlaceByName(raw: string): NamedWater | null {
  const q = raw.trim().toLocaleLowerCase("tr");
  if (!q) return null;
  for (const water of NAMED_WATERS) {
    if (water.name.toLocaleLowerCase("tr") === q) return water;
    if (water.keys.some((key) => key === q)) return water;
  }
  for (const region of REGION_POINTS) {
    if (region.name.toLocaleLowerCase("tr") === q || region.keys.includes(q)) {
      return {
        name: region.name,
        lat: region.lat,
        lng: region.lng,
        keys: region.keys,
        region: region.region,
      };
    }
  }
  return null;
}

export function placeCatalogForPrompt(): string {
  return NAMED_WATERS.map((w) => `${w.name} (${w.lat.toFixed(3)}, ${w.lng.toFixed(3)})`).join("; ");
}
