/** Signed-in cockpit skin — Marina Concierge only (others retired). */

export const COCKPIT_SKINS = [
  {
    id: "marina",
    name: "Marina Concierge",
    nameTr: "Marina Concierge",
    blurb:
      "Premium marina desk: deep teal, champagne accents, soft stone glass panels.",
    blurbTr:
      "Premium marina masası: derin teal, şampanya vurgu, yumuşak taş-cam paneller.",
    swatch: "#C9B896",
    trust: "Liman kalitesi + sakin premium",
  },
] as const;

export type CockpitSkinId = (typeof COCKPIT_SKINS)[number]["id"];

export const COCKPIT_SKIN_STORAGE = "thalvo-cockpit-skin";

/** Retired Design Lab ids → Marina Concierge. */
const LEGACY_SKIN_MAP: Record<string, CockpitSkinId> = {
  atlas: "marina",
  pilot: "marina",
  passage: "marina",
  watch: "marina",
  ecdis: "marina",
  bridge: "marina",
  dayplot: "marina",
  rail: "marina",
  harbour: "marina",
};

export function isCockpitSkinId(value: unknown): value is CockpitSkinId {
  return value === "marina";
}

export function resolveCockpitSkinId(value: unknown): CockpitSkinId | null {
  if (isCockpitSkinId(value)) return value;
  if (typeof value === "string" && value in LEGACY_SKIN_MAP) {
    return LEGACY_SKIN_MAP[value] ?? null;
  }
  return null;
}

export function readCockpitSkin(): CockpitSkinId {
  if (typeof window === "undefined") return "marina";
  try {
    const raw = localStorage.getItem(COCKPIT_SKIN_STORAGE);
    const resolved = resolveCockpitSkinId(raw);
    if (resolved) return resolved;
  } catch {
    /* private mode */
  }
  return "marina";
}

export function applyCockpitSkin(id: CockpitSkinId = "marina"): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-thalvo-skin", id);
  try {
    localStorage.setItem(COCKPIT_SKIN_STORAGE, id);
  } catch {
    /* ignore */
  }
}

function skinFromSearchParams(params: URLSearchParams): CockpitSkinId | null {
  const direct = resolveCockpitSkinId(params.get("skin"));
  if (direct) return direct;
  const next = params.get("next");
  if (next) {
    try {
      const nested = new URL(next, "https://thalvo.local");
      return resolveCockpitSkinId(nested.searchParams.get("skin"));
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function skinFromLocation(search = "", hash = ""): CockpitSkinId | null {
  const fromSearch = skinFromSearchParams(
    new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
  );
  if (fromSearch) return fromSearch;
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash.replace(/^#/, "");
  return skinFromSearchParams(new URLSearchParams(hashQuery));
}

/** Always boots Marina Concierge (URL/legacy aliases map here). */
export function bootCockpitSkin(): CockpitSkinId {
  const fromUrl =
    typeof window !== "undefined" ? skinFromLocation(window.location.search, window.location.hash) : null;
  const id = fromUrl ?? readCockpitSkin();
  applyCockpitSkin(id);
  return id;
}

export function skinMeta(_id: CockpitSkinId = "marina") {
  return COCKPIT_SKINS[0];
}
