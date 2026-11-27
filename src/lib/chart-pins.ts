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

/** One clear color per named mark. No disc, no glow. */
const MARK = {
  light: "#E2B04A",
  pier: "#2F9A94",
  anchor: "#3E9468",
  wrench: "#D5DEE6",
  ink: "#E6E0D4",
  hazard: "#C45C4A",
} as const;

const SIZE = 40;

function icon(body: string): string {
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 40 40" aria-hidden="true">${body}</svg>`;
}

const PLACE: Record<ChartPinKind, string> = {
  lighthouse: icon(
    `<g fill="${MARK.light}"><path d="M15.2 7.2h9.6v5.2h-9.6z"/><path d="M16.4 4.6c1-1.8 6.2-1.8 7.2 0z"/><rect x="12.4" y="12.2" width="15.2" height="2.2"/><path d="M16.2 14.4 13.4 32.2h13.2L23.8 14.4z"/><rect x="11" y="32.2" width="18" height="2.6"/><rect x="17.4" y="8.4" width="5.2" height="2.6" fill="#F6E7B4"/></g><path d="M4.5 10.2H12M28 10.2h7.5" stroke="${MARK.light}" stroke-width="1.6" stroke-linecap="round"/>`,
  ),
  marina: icon(
    `<g fill="${MARK.pier}"><rect x="3" y="10" width="34" height="5.2" rx=".4"/><rect x="7" y="15.2" width="3.1" height="14"/><rect x="18.45" y="15.2" width="3.1" height="14"/><rect x="29.9" y="15.2" width="3.1" height="14"/></g>`,
  ),
  anchorage: icon(
    `<g fill="none" stroke="${MARK.anchor}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="8" r="3.1"/><path d="M20 11.2V27M12.5 15.2h15M9 23.5c1.6 7 7.2 7.6 11 4.2 3.8 3.4 9.4 2.8 11-4.2"/></g>`,
  ),
  fuel: icon(
    `<g fill="${MARK.ink}"><rect x="9" y="6" width="14" height="27" rx="1.6"/><rect x="12" y="9" width="8" height="5.5" fill="#141C28"/><path d="M23 9.5h3.6c1.2 0 2.1 1 2.1 2.2v7.2h-2.3v-6.4H23z"/></g>`,
  ),
  hazard: icon(`<path d="M20 4.5 35 20 20 35.5 5 20z" fill="${MARK.hazard}"/>`),
  restaurant: icon(
    `<g fill="${MARK.ink}"><rect x="13.2" y="4" width="2.1" height="10"/><rect x="16.95" y="4" width="2.1" height="10"/><rect x="20.7" y="4" width="2.1" height="10"/><rect x="16.7" y="13.4" width="2.6" height="2.4"/><rect x="15.6" y="15.6" width="4.8" height="18" rx="2"/></g>`,
  ),
  own: icon(
    `<circle cx="20" cy="22" r="8" fill="none" stroke="${MARK.ink}" stroke-width="1.7"/><circle cx="20" cy="22" r="2.4" fill="${MARK.ink}"/><path d="M20 6.5v5" stroke="${MARK.ink}" stroke-width="1.8" stroke-linecap="round"/>`,
  ),
  diver: icon(
    `<g fill="${MARK.ink}"><circle cx="20" cy="18" r="9"/><rect x="13.4" y="16.2" width="13.2" height="3.6" fill="#141C28"/><rect x="14" y="26.5" width="12" height="2.6" rx=".4"/></g>`,
  ),
  vessel: icon(`<path d="M20 5.5 28.5 33H11.5L20 5.5z" fill="${MARK.ink}"/>`),
  report: icon(
    `<g fill="${MARK.ink}"><rect x="10" y="5" width="2.2" height="29"/><path d="M12.2 6.5h16.2L22.2 14.2l6.2 7.4H12.2z"/></g>`,
  ),
};

/** The object itself is the mark. The geographic point is the center of the box. */
export function chartPinHtml(kind: ChartPinKind): string {
  return PLACE[kind];
}

/**
 * Open-end wrench for the master. Peaked cap for the captain.
 * The wrench turns a few degrees around its own center.
 */
export function actorPinHtml(actor: ActorPin, tone: ActorTone = "cyan"): string {
  if (actor === "wrench") {
    const color = tone === "red" ? MARK.hazard : MARK.wrench;
    return icon(
      `<g transform="translate(20 20) scale(1.55) translate(-12 -12)"><g fill="${color}"><animateTransform attributeName="transform" type="rotate" values="-8 12 12;8 12 12;-8 12 12" dur="2.8s" repeatCount="indefinite"/><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g></g>`,
    );
  }
  const crown = tone === "red" ? "#F0D2CC" : "#F7F4EE";
  return icon(
    `<path d="M6 25.5V14.2C6 9.2 9.6 6.2 14.2 6.2h6.2c3.6 0 6.2 2.6 6.2 6.6v12.7H6z" fill="${crown}"/><rect x="6.2" y="19.4" width="20.2" height="2.5" fill="#C6A15A"/><circle cx="13.2" cy="14.6" r="1.5" fill="#C6A15A"/><path d="M20 22.8h15.2l-1.5 3.1H20.6z" fill="#16120C"/>`,
  );
}

export const CHART_PIN_SIZE: [number, number] = [SIZE, SIZE];
export const CHART_PIN_ANCHOR: [number, number] = [SIZE / 2, SIZE / 2];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -24];
