export type ChartPinKind =
  | "marina"
  | "anchorage"
  | "fuel"
  | "hazard"
  | "lighthouse"
  | "restaurant"
  | "own"
  | "diver"
  | "vessel"
  | "report";

export type ActorPin = "wrench" | "cap";
export type ActorTone = "cyan" | "gold" | "red";

/**
 * Live-chart marks drawn in the hand of Kitab-ı Bahriye.
 * The object is the mark. Its box center is the chart coordinate.
 *
 * Iron-gall keyline so a symbol holds on night ECDIS and on pale land.
 * Pigments are the manuscript's: vellum, gold leaf, vermilion, verdigris.
 * Kind colors stay put — marina water, mooring green, fener gold, danger red —
 * so a captain who already knows the layer still knows the layer.
 * Fuel, the diver, the wrench and the peaked cap are today's objects, same pen.
 */
const INK = "#1A140E";
const VELLUM = "#F3E6C4";
const SAIL = "#F7F1E4";
const GOLD = "#E6B15C";
const LEAF = "#C4923A";
const VERMILION = "#C45C4A";
const VERDIGRIS = "#3AA89F";
const MOOR = "#3E9A6A";
const SEA = "#0C2226";
const BRASS = "#E4C98A";

const SIZE = 36;

function icon(body: string): string {
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Coastal tower the way the Bahriye draws a fener: lantern, gallery, coursed shaft. */
const lighthouse = icon(`
  <path d="M16 1.7c1.9 0 2.9 1.15 2.9 2.25h-5.8C13.1 2.85 14.1 1.7 16 1.7z" fill="${GOLD}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
  <rect x="12.15" y="3.95" width="7.7" height="4.15" fill="${SAIL}" stroke="${INK}" stroke-width="0.6"/>
  <path d="M14.15 4.25v3.5M16 4.25v3.5M17.85 4.25v3.5" stroke="${INK}" stroke-width="0.55"/>
  <path d="M10.15 8.1h11.7v1.85H10.15z" fill="${LEAF}" stroke="${INK}" stroke-width="0.55"/>
  <path d="M13.25 9.95 11.15 26.15h9.7L18.75 9.95z" fill="${VELLUM}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
  <path d="M12.55 15.15h6.95M12.15 19.45h7.7M11.75 23.7h8.5" stroke="${INK}" stroke-width="0.5" opacity="0.8"/>
  <path d="M8.7 26.15h14.6v2.55H8.7z" fill="${LEAF}" stroke="${INK}" stroke-width="0.6"/>
`);

/**
 * Liman in plan, as a portolan draws a mole: crenellated kale, quay,
 * entrance return, and finger piers.
 */
const marina = icon(`
  <g fill="${VERDIGRIS}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round">
    <path d="M1.9 2.05h1.75v1.7H1.9zM4.35 2.05h1.75v1.7H4.35zM6.8 2.05h1.75v1.7H6.8z"/>
    <path d="M1.9 3.6h6.65V9.15H1.9z"/>
    <path d="M2.2 8.15h20.4c2.7 0 4.7 1.7 4.7 3.85v2.15h-3.2v-1.7c0-.85-.75-1.45-1.7-1.45H5.3v1.7H2.2V8.15z"/>
    <rect x="4.55" y="12.7" width="3.55" height="14.6" rx="0.4"/>
    <rect x="13.25" y="12.7" width="3.55" height="10.2" rx="0.4"/>
    <rect x="21.85" y="12.7" width="3.55" height="15.5" rx="0.4"/>
  </g>
  <path d="M4.55 17.4h3.55M4.55 22h3.55M13.25 17.2h3.55M21.85 17.8h3.55M21.85 22.6h3.55" stroke="${VELLUM}" stroke-width="0.5" opacity="0.85"/>
`);

/** Stocked demir: ring, wooden stock, shank, arms, flukes. */
const anchorage = icon(`
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${INK}" stroke-width="3.15">
      <circle cx="16" cy="4.7" r="2.35"/>
      <path d="M16 7.05v12.7M6.7 9.15h18.6"/>
      <path d="M16 19.15c0 4.7-6.6 6.15-9.5 3.7M16 19.15c0 4.7 6.6 6.15 9.5 3.7"/>
      <path d="M6.5 22.85 5.15 19.7M25.5 22.85 26.85 19.7"/>
    </g>
    <g stroke="${MOOR}" stroke-width="1.85">
      <circle cx="16" cy="4.7" r="2.35"/>
      <path d="M16 7.05v12.7M6.7 9.15h18.6"/>
      <path d="M16 19.15c0 4.7-6.6 6.15-9.5 3.7M16 19.15c0 4.7 6.6 6.15 9.5 3.7"/>
      <path d="M6.5 22.85 5.15 19.7M25.5 22.85 26.85 19.7"/>
    </g>
  </g>
`);

/** Quay pump. The manuscript has no fuel; the object is today's, the pen is the same. */
const fuel = icon(`
  <path d="M4.2 25.15h17.2v2.35H4.2z" fill="${VERDIGRIS}" stroke="${INK}" stroke-width="0.55"/>
  <rect x="7.1" y="6.6" width="10.3" height="18.55" rx="1.35" fill="${VELLUM}" stroke="${INK}" stroke-width="0.7"/>
  <rect x="8.85" y="8.7" width="6.8" height="4.15" rx="0.35" fill="${GOLD}" stroke="${INK}" stroke-width="0.45"/>
  <path d="M17.4 11.15h3.55c.95 0 1.7.75 1.7 1.7v6.7" stroke="${INK}" stroke-width="1.45" stroke-linecap="round"/>
  <path d="M21.15 19.7h2.55v2.05h-2.55z" fill="${VERMILION}" stroke="${INK}" stroke-width="0.45"/>
`);

/** Kaya — a shoal in vermilion. The vellum cross is the danger a captain reads as SOS. */
const hazard = icon(`
  <path d="M5.2 22.4 8.6 16.2 12.4 18.4 16 6.4 19.7 15.2 23.4 12.2 27.6 19.6 26.2 26.6 6.4 26.6Z" fill="${VERMILION}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
  <path d="M16 11.4v9.6M11.5 16.2h9" stroke="${VELLUM}" stroke-width="1.85" stroke-linecap="round"/>
`);

/** Waterfront house from a Bahriye town plate: red roof, arched door, lit windows. */
const restaurant = icon(`
  <path d="M4.6 14.35 16 3.7 27.4 14.35Z" fill="${VERMILION}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
  <path d="M7.35 14.2h17.3V27.2H7.35Z" fill="${VELLUM}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
  <rect x="9.35" y="16.45" width="3.15" height="3.15" fill="${GOLD}" stroke="${INK}" stroke-width="0.4"/>
  <rect x="19.5" y="16.45" width="3.15" height="3.15" fill="${GOLD}" stroke="${INK}" stroke-width="0.4"/>
  <path d="M13.55 27.2v-5.15a2.45 2.45 0 0 1 4.9 0V27.2Z" fill="${INK}"/>
`);

/** Own-ship fix as a portolan wind rose. The north leaf is gold: the heading cue. */
const own = icon(`
  <g stroke="${INK}" stroke-width="0.45" stroke-linejoin="round">
    <path d="M16 2.2 18.05 14.2 13.95 14.2Z" fill="${GOLD}"/>
    <path d="M16 29.8 13.95 17.8 18.05 17.8Z" fill="${VELLUM}"/>
    <path d="M29.8 16 17.8 18.05 17.8 13.95Z" fill="${VELLUM}"/>
    <path d="M2.2 16 14.2 13.95 14.2 18.05Z" fill="${VELLUM}"/>
    <path d="M22.5 9.5 19.92 13.98 18.02 12.08Z" fill="${LEAF}"/>
    <path d="M22.5 22.5 18.02 19.92 19.92 18.02Z" fill="${LEAF}"/>
    <path d="M9.5 22.5 12.08 18.02 13.98 19.92Z" fill="${LEAF}"/>
    <path d="M9.5 9.5 13.98 12.08 12.08 13.98Z" fill="${LEAF}"/>
  </g>
  <circle cx="16" cy="16" r="2.45" fill="${INK}"/>
  <circle cx="16" cy="16" r="1.05" fill="${GOLD}"/>
`);

/** Diver, frontal: mask, tank, shoulders, bubbles. A profile collapses to a stick at 36px. */
const diver = icon(`
  <rect x="19.4" y="17.4" width="3.5" height="6.6" rx="1.35" fill="#1E4C46" stroke="${INK}" stroke-width="0.55"/>
  <circle cx="15.2" cy="9.6" r="4.55" fill="${VELLUM}" stroke="${INK}" stroke-width="0.7"/>
  <path d="M11.15 9.7h8.1v2.2h-8.1z" fill="${SEA}"/>
  <path d="M13.9 14.1h2.6v2.3h-2.6z" fill="${VELLUM}" stroke="${INK}" stroke-width="0.55"/>
  <path d="M7.6 26.4 10.3 16.6h9.8l2.7 9.8Z" fill="${VELLUM}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
  <circle cx="24.4" cy="7.4" r="1.2" fill="${SAIL}" stroke="${INK}" stroke-width="0.45"/>
  <circle cx="26.8" cy="4.3" r="0.72" fill="${SAIL}" stroke="${INK}" stroke-width="0.4"/>
`);

/**
 * Lateen çektirme in profile — sterncastle, beak, yard abaft the mast.
 * The ship Kitab-ı Bahriye draws along this coast.
 */
const vessel = icon(`
  <path d="M22.73 5.94 8.31 14.9 19.8 18.2Z" fill="${SAIL}" stroke="${INK}" stroke-width="0.55" stroke-linejoin="round"/>
  <path d="M3.2 14.8h6.2V17.2l11.2-.6 5.6 1.6 1.2 1.8-3.8 3.4H5.4L3.2 20.2Z" fill="${VELLUM}" stroke="${INK}" stroke-width="0.65" stroke-linejoin="round"/>
  <path d="M4.6 17.2 25.2 4.4" stroke="${INK}" stroke-width="0.95" stroke-linecap="round"/>
  <path d="M12.2 12.35v4.7" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
  <path d="M25.2 4.4 28.7 3.15 28.4 5.55Z" fill="${VERMILION}" stroke="${INK}" stroke-width="0.4" stroke-linejoin="round"/>
  <path d="M5.1 20.15h17.6" stroke="${LEAF}" stroke-width="0.7" stroke-linecap="round"/>
`);

/** Advice pennant. Vermilion fly, gold stripe — a note, not a flag of state. */
const report = icon(`
  <path d="M7.15 2.4h1.7V29.4h-1.7z" fill="${INK}"/>
  <path d="M8.85 4.15H22.2L16.35 9.55 22.2 14.95H8.85Z" fill="${VERMILION}" stroke="${INK}" stroke-width="0.55" stroke-linejoin="round"/>
  <path d="M8.85 8.15h8.6" stroke="${GOLD}" stroke-width="0.8" stroke-linecap="round"/>
`);

const PLACE: Record<ChartPinKind, string> = {
  lighthouse,
  marina,
  anchorage,
  fuel,
  hazard,
  restaurant,
  own,
  diver,
  vessel,
  report,
};

/** The object is the mark. Its box center is the chart coordinate. */
export function chartPinHtml(kind: ChartPinKind): string {
  return PLACE[kind];
}

/** Open-end wrench for the master. Peaked cap for the captain. */
export function actorPinHtml(actor: ActorPin, tone: ActorTone = "cyan"): string {
  if (actor === "wrench") {
    const color = tone === "red" ? VERMILION : BRASS;
    return icon(
      `<g transform="translate(1.2 1.2) scale(1.22)" fill="${color}" stroke="${INK}" stroke-width="0.35" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>`,
    );
  }
  const crown = tone === "red" ? "#F0D2CC" : "#F4F1EA";
  const band = tone === "red" ? VERMILION : LEAF;
  return icon(`
    <path d="M4.6 19.4V13.1c0-3.5 2.9-5.9 6.5-6.5C12.1 4.6 13.6 3.5 16 3.5c2.4 0 3.9 1.1 4.9 3.1 3.6.6 6.5 3 6.5 6.5v6.3H4.6z" fill="${crown}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
    <circle cx="16" cy="5.35" r="0.95" fill="${LEAF}" stroke="${INK}" stroke-width="0.35"/>
    <path d="M4.6 15.7h22.8v2.7H4.6z" fill="${band}" stroke="${INK}" stroke-width="0.45"/>
    <path d="M11.6 17.35H23.4C27.5 17.5 30.2 19.3 30.2 21.15 27.5 24.2 18.8 24.7 14.4 22.15 12.4 21 11.3 18.6 11.6 17.35Z" fill="#2C261C" stroke="${GOLD}" stroke-width="0.65" stroke-linejoin="round"/>
  `);
}

export const CHART_PIN_SIZE: [number, number] = [SIZE, SIZE];
export const CHART_PIN_ANCHOR: [number, number] = [SIZE / 2, SIZE / 2];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -22];
