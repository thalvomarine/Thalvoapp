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
 * Live-chart marks as MarineOS instruments.
 * The object is the mark. Its box center is the chart coordinate.
 *
 * Cockpit cyan, amber, and danger red. A dark keyline so the mark
 * holds on night ECDIS and on pale land. No glow, no badge, no teardrop.
 */
const INK = "#041018";
const CYAN = "#3EE7F2";
const DEEP = "#0C6F7A";
const AMBER = "#F5B942";
const RED = "#EF4444";
const PLATE = "#E7FBFF";
const VISOR = "#062028";

const SIZE = 36;

function icon(body: string): string {
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Fener: tapered shaft, cyan gallery, amber lamp. */
const lighthouse = icon(`
  <path d="M16 1.8c1.55 0 2.45.85 2.45 1.75h-4.9C13.55 2.65 14.45 1.8 16 1.8z" fill="${AMBER}" stroke="${INK}" stroke-width="0.55"/>
  <rect x="12.35" y="3.55" width="7.3" height="3.7" fill="${PLATE}" stroke="${INK}" stroke-width="0.55"/>
  <path d="M14.15 3.85v3.1M16 3.85v3.1M17.85 3.85v3.1" stroke="${DEEP}" stroke-width="0.55"/>
  <path d="M10.3 7.25h11.4v1.7H10.3z" fill="${CYAN}" stroke="${INK}" stroke-width="0.5"/>
  <path d="M13.35 8.95 11.25 25.7h9.5L18.65 8.95z" fill="${PLATE}" stroke="${INK}" stroke-width="0.65" stroke-linejoin="round"/>
  <path d="M12.7 14h6.7M12.35 18.4h7.35M12 22.8h8" stroke="${DEEP}" stroke-width="0.5"/>
  <path d="M8.8 25.7h14.4v2.45H8.8z" fill="${CYAN}" stroke="${INK}" stroke-width="0.55"/>
`);

/** Liman in plan: control block, mole, entrance return, finger piers. */
const marina = icon(`
  <g fill="${CYAN}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="miter">
    <path d="M2.1 3.3h5.5v4.7H2.1z"/>
    <path d="M2.15 7.7h20.3c2.55 0 4.45 1.55 4.45 3.5v1.9h-2.9v-1.45c0-.75-.65-1.25-1.45-1.25H4.9v1.45H2.15V7.7z"/>
    <rect x="4.55" y="12.55" width="3.15" height="15.1"/>
    <rect x="13.45" y="12.55" width="3.15" height="10.4"/>
    <rect x="22.3" y="12.55" width="3.15" height="15.6"/>
  </g>
  <rect x="3.35" y="4.35" width="1.35" height="1.15" fill="${AMBER}"/>
  <path d="M4.55 17.2h3.15M4.55 21.6h3.15M13.45 17h3.15M22.3 17.6h3.15M22.3 22.2h3.15" stroke="${INK}" stroke-width="0.45" opacity="0.55"/>
`);

/** Angular demir. Ring, stock, shank, straight arms, flukes. */
const anchorage = icon(`
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${INK}" stroke-width="3.25">
      <circle cx="16" cy="4.7" r="2.3"/>
      <path d="M16 7v12.7M6.7 9.15h18.6"/>
      <path d="M16 19.1c0 4.7-6.6 6.15-9.5 3.7M16 19.1c0 4.7 6.6 6.15 9.5 3.7"/>
      <path d="M6.5 22.8 5.15 19.6M25.5 22.8l1.35-3.2"/>
    </g>
    <g stroke="${CYAN}" stroke-width="1.85">
      <circle cx="16" cy="4.7" r="2.3"/>
      <path d="M16 7v12.7M6.7 9.15h18.6"/>
      <path d="M16 19.1c0 4.7-6.6 6.15-9.5 3.7M16 19.1c0 4.7 6.6 6.15 9.5 3.7"/>
      <path d="M6.5 22.8 5.15 19.6M25.5 22.8l1.35-3.2"/>
    </g>
  </g>
`);

/** Quay pump. Amber gauge, cyan hose. */
const fuel = icon(`
  <path d="M4.4 25.2h16.6v2.3H4.4z" fill="${CYAN}" stroke="${INK}" stroke-width="0.55"/>
  <rect x="7.2" y="6.3" width="10.1" height="18.9" rx="1.1" fill="${PLATE}" stroke="${INK}" stroke-width="0.65"/>
  <rect x="8.9" y="8.3" width="6.7" height="4" fill="${AMBER}" stroke="${INK}" stroke-width="0.4"/>
  <path d="M17.3 11h3.4c.9 0 1.6.7 1.6 1.6v6.5" stroke="${CYAN}" stroke-width="1.45" stroke-linecap="square"/>
  <path d="M21.1 19.2h2.5v2h-2.5z" fill="${AMBER}" stroke="${INK}" stroke-width="0.4"/>
`);

/** Danger beacon. Chamfered octagon, white cross. SOS uses this mark. */
const hazard = icon(`
  <path d="M11 3.4h10L28.6 11v10L21 28.6H11L3.4 21V11Z" fill="${RED}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="miter"/>
  <path d="M16 9.4v13.2M10.8 16h10.4" stroke="${PLATE}" stroke-width="1.8" stroke-linecap="square"/>
`);

/** Waterfront kiosk: flat canopy, amber panes, dark door. */
const restaurant = icon(`
  <path d="M4.2 12.2h23.6v2.35H4.2z" fill="${CYAN}" stroke="${INK}" stroke-width="0.55"/>
  <path d="M6.6 14.4h18.8V27.3H6.6z" fill="${PLATE}" stroke="${INK}" stroke-width="0.65"/>
  <rect x="8.7" y="16.6" width="3.1" height="2.5" fill="${AMBER}" stroke="${INK}" stroke-width="0.35"/>
  <rect x="20.2" y="16.6" width="3.1" height="2.5" fill="${AMBER}" stroke="${INK}" stroke-width="0.35"/>
  <path d="M13.5 27.3v-6.2h5v6.2z" fill="${INK}"/>
`);

/** Own-ship fix. Cyan ring, amber heading tick. */
const own = icon(`
  <circle cx="16" cy="16.4" r="7.6" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="16" cy="16.4" r="7.6" stroke="${CYAN}" stroke-width="1.25"/>
  <circle cx="16" cy="16.4" r="1.85" fill="${AMBER}" stroke="${INK}" stroke-width="0.4"/>
  <path d="M16 3.1v4.3" stroke="${INK}" stroke-width="2.9" stroke-linecap="square"/>
  <path d="M16 3.1v4.3" stroke="${AMBER}" stroke-width="1.7" stroke-linecap="square"/>
  <path d="M16 25.2v3.7M5.2 16.4H8.4M23.6 16.4h3.2" stroke="${INK}" stroke-width="2.4" stroke-linecap="square"/>
  <path d="M16 25.2v3.7M5.2 16.4H8.4M23.6 16.4h3.2" stroke="${PLATE}" stroke-width="1.2" stroke-linecap="square"/>
`);

/** Diver: helmet, cyan visor, tank, bubbles. */
const diver = icon(`
  <rect x="19.5" y="17.5" width="3.4" height="6.5" rx="1.2" fill="${CYAN}" stroke="${INK}" stroke-width="0.5"/>
  <circle cx="15.1" cy="9.5" r="4.5" fill="${PLATE}" stroke="${INK}" stroke-width="0.65"/>
  <path d="M11.1 9.6h8v2.15h-8z" fill="${CYAN}"/>
  <path d="M13.85 13.9h2.5v2.2h-2.5z" fill="${PLATE}" stroke="${INK}" stroke-width="0.5"/>
  <path d="M7.5 26.5 10.2 16.7h9.7l2.7 9.8Z" fill="${PLATE}" stroke="${INK}" stroke-width="0.65" stroke-linejoin="miter"/>
  <circle cx="24.5" cy="7.2" r="1.15" fill="none" stroke="${CYAN}" stroke-width="0.7"/>
  <circle cx="26.9" cy="4.2" r="0.7" fill="none" stroke="${CYAN}" stroke-width="0.55"/>
`);

/** Plan-view contact. Bow up, centerline, amber bridge. */
const vessel = icon(`
  <path d="M16 2.8 26.4 27.4 16 22.2 5.6 27.4Z" fill="${PLATE}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="miter"/>
  <path d="M16 8.4v10.2" stroke="${DEEP}" stroke-width="0.75"/>
  <circle cx="16" cy="13.6" r="1.2" fill="${AMBER}"/>
`);

/** Advice marker. Cyan pennant, amber stripe. */
const report = icon(`
  <path d="M7.2 2.5h1.6V29.5H7.2z" fill="${INK}"/>
  <path d="M8.8 4.2H22.4L16.6 9.7 22.4 15.2H8.8Z" fill="${CYAN}" stroke="${INK}" stroke-width="0.55" stroke-linejoin="miter"/>
  <path d="M8.8 8.3h8.4" stroke="${AMBER}" stroke-width="0.9" stroke-linecap="square"/>
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
    const color = tone === "red" ? RED : CYAN;
    return icon(
      `<g transform="translate(1.2 1.2) scale(1.22)" fill="${color}" stroke="${INK}" stroke-width="0.4" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>`,
    );
  }
  const crown = tone === "red" ? "#F8D0D0" : PLATE;
  const band = tone === "red" ? RED : AMBER;
  return icon(`
    <path d="M4.6 19.4V13.1c0-3.5 2.9-5.9 6.5-6.5C12.1 4.6 13.6 3.5 16 3.5c2.4 0 3.9 1.1 4.9 3.1 3.6.6 6.5 3 6.5 6.5v6.3H4.6z" fill="${crown}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
    <circle cx="16" cy="5.35" r="0.95" fill="${CYAN}" stroke="${INK}" stroke-width="0.35"/>
    <path d="M4.6 15.7h22.8v2.7H4.6z" fill="${band}" stroke="${INK}" stroke-width="0.45"/>
    <path d="M11.6 17.35H23.4C27.5 17.5 30.2 19.3 30.2 21.15 27.5 24.2 18.8 24.7 14.4 22.15 12.4 21 11.3 18.6 11.6 17.35Z" fill="${VISOR}" stroke="${CYAN}" stroke-width="0.65" stroke-linejoin="round"/>
  `);
}

export const CHART_PIN_SIZE: [number, number] = [SIZE, SIZE];
export const CHART_PIN_ANCHOR: [number, number] = [SIZE / 2, SIZE / 2];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -22];
