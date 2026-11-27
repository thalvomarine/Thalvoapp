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
 * Live-chart marks. One maritime object each, nothing else.
 * The box center is the chart coordinate.
 * A dark keyline holds the shape on night water and on pale land.
 */
const INK = "#041018";
const CYAN = "#3EE7F2";
const AMBER = "#F5B942";
const RED = "#EF4444";
const PAPER = "#F4FBFC";

const SIZE = 36;

function icon(body: string): string {
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Fener. Lamp, gallery, shaft, base. */
const lighthouse = icon(`
  <path d="M16 2.2c1.7 0 2.7 1 2.7 1.9h-5.4c0-.9 1-1.9 2.7-1.9z" fill="${AMBER}" stroke="${INK}" stroke-width="0.6"/>
  <rect x="12.4" y="4.1" width="7.2" height="3.8" fill="${AMBER}" stroke="${INK}" stroke-width="0.6"/>
  <rect x="10.4" y="7.9" width="11.2" height="1.7" fill="${AMBER}" stroke="${INK}" stroke-width="0.55"/>
  <path d="M13.5 9.6 11.4 25.8h9.2L18.5 9.6z" fill="${PAPER}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
  <rect x="9.2" y="25.8" width="13.6" height="2.5" fill="${AMBER}" stroke="${INK}" stroke-width="0.55"/>
`);

/** Liman. One quay, three piers. */
const marina = icon(`
  <g fill="${CYAN}" stroke="${INK}" stroke-width="0.7">
    <rect x="2.2" y="4.6" width="27.6" height="5.2"/>
    <rect x="4.6" y="9.8" width="4.4" height="16.4"/>
    <rect x="13.8" y="9.8" width="4.4" height="11.2"/>
    <rect x="23" y="9.8" width="4.4" height="17.2"/>
  </g>
`);

/** Demir. Ring, stock, shank, arms. */
const anchorage = icon(`
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${INK}" stroke-width="3.3">
      <circle cx="16" cy="4.8" r="2.3"/>
      <path d="M16 7.1v12.4M6.8 9.3h18.4"/>
      <path d="M16 18.8c0 4.6-6.4 6-9.2 3.6M16 18.8c0 4.6 6.4 6 9.2 3.6"/>
      <path d="M6.8 22.4 5.4 19.2M25.2 22.4l1.4-3.2"/>
    </g>
    <g stroke="${CYAN}" stroke-width="1.9">
      <circle cx="16" cy="4.8" r="2.3"/>
      <path d="M16 7.1v12.4M6.8 9.3h18.4"/>
      <path d="M16 18.8c0 4.6-6.4 6-9.2 3.6M16 18.8c0 4.6 6.4 6 9.2 3.6"/>
      <path d="M6.8 22.4 5.4 19.2M25.2 22.4l1.4-3.2"/>
    </g>
  </g>
`);

/** Yakıt. Pump and hose. */
const fuel = icon(`
  <rect x="7.6" y="5.2" width="11.2" height="21.2" rx="1.3" fill="${PAPER}" stroke="${INK}" stroke-width="0.7"/>
  <rect x="9.8" y="7.6" width="6.8" height="4.2" fill="${AMBER}"/>
  <path d="M18.8 10.6h3.4c.9 0 1.6.7 1.6 1.6v6.2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
`);

/** Tehlike. One red diamond. SOS uses this mark. */
const hazard = icon(`
  <path d="M16 3 29 16 16 29 3 16Z" fill="${RED}" stroke="${INK}" stroke-width="0.75" stroke-linejoin="round"/>
`);

/** Lokanta. A fork. */
const restaurant = icon(`
  <g fill="${PAPER}" stroke="${INK}" stroke-width="0.55">
    <rect x="11.2" y="3" width="1.8" height="8.4"/>
    <rect x="15.1" y="3" width="1.8" height="8.4"/>
    <rect x="19" y="3" width="1.8" height="8.4"/>
    <rect x="14.5" y="10.8" width="3" height="2.1"/>
    <rect x="13.6" y="12.6" width="4.8" height="15.2" rx="1.6"/>
  </g>
`);

/** Own ship. Ring, dot, one heading tick. */
const own = icon(`
  <circle cx="16" cy="17.4" r="6.5" stroke="${INK}" stroke-width="2.7"/>
  <circle cx="16" cy="17.4" r="6.5" stroke="${CYAN}" stroke-width="1.45"/>
  <circle cx="16" cy="17.4" r="1.7" fill="${CYAN}"/>
  <path d="M16 4.6v4.6" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M16 4.6v4.6" stroke="${CYAN}" stroke-width="1.6" stroke-linecap="round"/>
`);

/** Diver. Mask and shoulders. */
const diver = icon(`
  <circle cx="16" cy="12.2" r="5.8" fill="${PAPER}" stroke="${INK}" stroke-width="0.7"/>
  <rect x="11.2" y="11.4" width="9.6" height="2.5" fill="${CYAN}"/>
  <path d="M8.4 25.6c1.8-4 4.4-5.8 7.6-5.8s5.8 1.8 7.6 5.8H8.4z" fill="${PAPER}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
`);

/** Tekne. Hull and cabin. */
const vessel = icon(`
  <rect x="10.2" y="11.4" width="7.2" height="5.4" fill="${PAPER}" stroke="${INK}" stroke-width="0.7"/>
  <path d="M3.6 16.8h20.4l4.4 3.4-4 3H6.2L3.6 20.2Z" fill="${PAPER}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>
`);

/** Tavsiye. Staff and pennant. */
const report = icon(`
  <rect x="7.6" y="2.8" width="1.7" height="26" fill="${INK}"/>
  <path d="M9.3 4.4h12.6L16.2 10l5.7 5.4H9.3Z" fill="${CYAN}" stroke="${INK}" stroke-width="0.5" stroke-linejoin="round"/>
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
      `<g transform="translate(1.2 1.2) scale(1.22)" fill="${color}" stroke="${INK}" stroke-width="0.35" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>`,
    );
  }
  const crown = tone === "red" ? "#F8D0D0" : PAPER;
  const band = tone === "red" ? RED : AMBER;
  return icon(`
    <path d="M5.2 18.8V12.6c0-3 2.6-5.2 6-5.6.6-1.3 1.8-2.1 3.2-2.1 1.5 0 2.7.8 3.3 2.1 3.3.4 5.9 2.6 5.9 5.6v6.2H5.2z" fill="${crown}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>
    <path d="M5.2 15.4h21.6v2.5H5.2z" fill="${band}" stroke="${INK}" stroke-width="0.45"/>
    <path d="M13.2 17.6h9.2c3.2.1 5.6 1.5 5.8 3-2.2 2.4-8.6 3.2-12.6 1.2-1.4-.7-2-2.6-2.4-4.2z" fill="${INK}"/>
  `);
}

export const CHART_PIN_SIZE: [number, number] = [SIZE, SIZE];
export const CHART_PIN_ANCHOR: [number, number] = [SIZE / 2, SIZE / 2];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -22];
