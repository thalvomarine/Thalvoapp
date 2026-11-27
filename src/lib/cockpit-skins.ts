/** Signed-in cockpit design skins — pick one in Design Lab before launch polish. */

export const COCKPIT_SKINS = [
  {
    id: "ecdis",
    name: "ECDIS Classic",
    nameTr: "ECDIS Klasik",
    blurb:
      "Deep navy plane, cyan chart ops, amber command. Square dock + latch FABs.",
    blurbTr:
      "Derin lacivert, cyan harita, amber komuta. Kare dock ve latch FAB’lar.",
  },
  {
    id: "bridge",
    name: "Night Bridge",
    nameTr: "Gece Köprüüstü",
    blurb:
      "Near-black bridge, amber-only accents, denser instrument chrome, flat SOS.",
    blurbTr:
      "Siyah köprüüstü, yalnızca amber vurgu, sıkı enstrüman dili, düz SOS.",
  },
  {
    id: "dayplot",
    name: "Day Plotter",
    nameTr: "Gündüz Plotter",
    blurb:
      "Paper-white cockpit, slate ink, amber active rail — chartplotter daylight.",
    blurbTr:
      "Kağıt beyazı kokpit, slate mürekkep, amber aktif ray — gündüz plotter.",
  },
  {
    id: "rail",
    name: "Instrument Rail",
    nameTr: "Enstrüman Rayı",
    blurb:
      "Horizontal capsule dock, cyan instrument pills, compact HUD density.",
    blurbTr:
      "Yatay kapsül dock, cyan enstrüman pill’leri, kompakt HUD yoğunluğu.",
  },
  {
    id: "harbour",
    name: "Harbour Glass",
    nameTr: "Liman Camı",
    blurb:
      "Soft glass panels, steel-teal accents, rounded sheet language, calm coastal.",
    blurbTr:
      "Yumuşak cam paneller, çelik-teal vurgu, yuvarlak sheet dili, sakin liman.",
  },
] as const;

export type CockpitSkinId = (typeof COCKPIT_SKINS)[number]["id"];

export const COCKPIT_SKIN_STORAGE = "thalvo-cockpit-skin";

export function isCockpitSkinId(value: unknown): value is CockpitSkinId {
  return COCKPIT_SKINS.some((s) => s.id === value);
}

export function readCockpitSkin(): CockpitSkinId {
  if (typeof window === "undefined") return "ecdis";
  try {
    const raw = localStorage.getItem(COCKPIT_SKIN_STORAGE);
    if (isCockpitSkinId(raw)) return raw;
  } catch {
    /* private mode */
  }
  return "ecdis";
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

/** Read `?skin=` / `#skin=` for Design Lab deep-links (preview QA). */
export function skinFromLocation(search = "", hash = ""): CockpitSkinId | null {
  const fromSearch = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "skin",
  );
  if (isCockpitSkinId(fromSearch)) return fromSearch;
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash.replace(/^#/, "");
  const fromHash = new URLSearchParams(hashQuery).get("skin");
  if (isCockpitSkinId(fromHash)) return fromHash;
  return null;
}

/** Boot skin from URL override, then storage (call once in signed-in shell). */
export function bootCockpitSkin(): CockpitSkinId {
  const fromUrl =
    typeof window !== "undefined" ? skinFromLocation(window.location.search, window.location.hash) : null;
  const id = fromUrl ?? readCockpitSkin();
  applyCockpitSkin(id);
  return id;
}
