/** Signed-in cockpit design skins — trust-first MarineOS languages. */

export const COCKPIT_SKINS = [
  {
    id: "atlas",
    name: "Atlas Soft",
    nameTr: "Atlas Soft",
    blurb:
      "Calm ECDIS: deep navy, sea-glass readout, brass command — no neon glare.",
    blurbTr:
      "Sakin ECDIS: derin lacivert, deniz camı okuma, pirinç komuta — neon yok.",
    swatch: "#7EB8C9",
    trust: "Sertifikalı harita masası hissi",
  },
  {
    id: "pilot",
    name: "Pilot House",
    nameTr: "Pilot House",
    blurb:
      "Real bridge night: matte black, warm instrument amber, flat SOS, dense HUD.",
    blurbTr:
      "Gerçek köprüüstü gecesi: mat siyah, sıcak enstrüman amber, düz SOS, sıkı HUD.",
    swatch: "#E0A84A",
    trust: "Gece seyri için köprü dili",
  },
  {
    id: "passage",
    name: "Passage Chart",
    nameTr: "Seyir Haritası",
    blurb:
      "Day chart table: warm paper ground, navy ink, coastal blue — readable offshore.",
    blurbTr:
      "Gündüz harita masası: sıcak kâğıt zemin, lacivert mürekkep, kıyı mavisi.",
    swatch: "#2F6F8F",
    trust: "Kağıt harita güveni, dijital netlik",
  },
  {
    id: "watch",
    name: "Watch Desk",
    nameTr: "Nöbet Masası",
    blurb:
      "Ops desk for usta/servis: slate panels, steel blue live, red only for SOS.",
    blurbTr:
      "Usta/servis nöbet masası: slate paneller, çelik mavi canlı, kırmızı yalnız SOS.",
    swatch: "#6B8CAE",
    trust: "Operasyon masası — triyaj netliği",
  },
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

const LEGACY_SKIN_MAP: Record<string, CockpitSkinId> = {
  ecdis: "atlas",
  bridge: "pilot",
  dayplot: "passage",
  rail: "watch",
  harbour: "marina",
};

export function isCockpitSkinId(value: unknown): value is CockpitSkinId {
  return COCKPIT_SKINS.some((s) => s.id === value);
}

export function resolveCockpitSkinId(value: unknown): CockpitSkinId | null {
  if (isCockpitSkinId(value)) return value;
  if (typeof value === "string" && value in LEGACY_SKIN_MAP) {
    return LEGACY_SKIN_MAP[value] ?? null;
  }
  return null;
}

export function readCockpitSkin(): CockpitSkinId {
  if (typeof window === "undefined") return "atlas";
  try {
    const raw = localStorage.getItem(COCKPIT_SKIN_STORAGE);
    const resolved = resolveCockpitSkinId(raw);
    if (resolved) return resolved;
  } catch {
    /* private mode */
  }
  return "atlas";
}

export function applyCockpitSkin(id: CockpitSkinId): void {
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
  // Auth gate: /auth?next=/app?skin=marina — recover skin before login.
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

/** Read `?skin=` / `#skin=` / auth `?next=` for Design Lab deep-links. */
export function skinFromLocation(search = "", hash = ""): CockpitSkinId | null {
  const fromSearch = skinFromSearchParams(
    new URLSearchParams(search.startsWith("?") ? search.slice(1) : search),
  );
  if (fromSearch) return fromSearch;
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash.replace(/^#/, "");
  return skinFromSearchParams(new URLSearchParams(hashQuery));
}

/** Boot skin from URL override, then storage. */
export function bootCockpitSkin(): CockpitSkinId {
  const fromUrl =
    typeof window !== "undefined" ? skinFromLocation(window.location.search, window.location.hash) : null;
  const id = fromUrl ?? readCockpitSkin();
  applyCockpitSkin(id);
  return id;
}

export function skinMeta(id: CockpitSkinId) {
  return COCKPIT_SKINS.find((s) => s.id === id) ?? COCKPIT_SKINS[0];
}
