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

const MARK = {
  light: "#E6B15C",
  pier: "#3AA89F",
  anchor: "#3E9A6A",
  wrench: "#E4EDF2",
  ink: "#E7E1D4",
  hazard: "#C45C4A",
  sea: "#0C2226",
} as const;

const SIZE = 36;

function icon(body: string): string {
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
}

const PLACE: Record<ChartPinKind, string> = {
  lighthouse: icon(
    `<g fill="${MARK.light}"><path d="M16 2.2c1.8 0 2.8 1.1 2.8 2H13.2c0-.9 1-2 2.8-2z"/><rect x="12.2" y="4.2" width="7.6" height="4.8"/><rect x="13.1" y="5" width="1.5" height="3.2" fill="#F8E7B0"/><rect x="15.25" y="5" width="1.5" height="3.2" fill="#F8E7B0"/><rect x="17.4" y="5" width="1.5" height="3.2" fill="#F8E7B0"/><rect x="10" y="8.8" width="12" height="1.5"/><path d="M13.4 10.3 11.2 26.4h9.6L18.6 10.3z"/><rect x="9.2" y="26.4" width="13.6" height="2.2"/></g>`,
  ),
  marina: icon(
    `<g fill="${MARK.pier}"><rect x="2" y="4.2" width="28" height="5.4" rx=".6"/><rect x="4.2" y="9.6" width="4.6" height="16.4" rx=".7"/><rect x="13.7" y="9.6" width="4.6" height="11.2" rx=".7"/><rect x="23.2" y="9.6" width="4.6" height="17.6" rx=".7"/></g>`,
  ),
  anchorage: icon(
    `<g fill="${MARK.anchor}"><path fill-rule="evenodd" d="M16 1.8a2.5 2.5 0 1 0 .01 0zM16 3a1.15 1.15 0 1 1-.01 0z"/><rect x="14.8" y="4.6" width="2.4" height="12.6"/><rect x="7.6" y="7.4" width="16.8" height="2.3" rx=".4"/><path d="M16 16.4c-5.4 0-8.6 3-9.2 6.6 1.5-1.5 2.6-2 3.8-1.5 1 .5 1.1 2.2.2 3.4C9.2 22.4 12.2 20.6 16 20.4c3.8.2 6.8 2 5.2 4.5-.9-1.2-.8-2.9.2-3.4 1.2-.5 2.3 0 3.8 1.5-.6-3.6-3.8-6.6-9.2-6.6z"/></g>`,
  ),
  fuel: icon(
    `<g fill="${MARK.ink}"><rect x="8" y="5" width="11" height="22" rx="1.4"/><rect x="10.2" y="7.4" width="6.6" height="4.2" fill="${MARK.sea}"/><path d="M19 8h3.2c1 0 1.8.8 1.8 1.8v6.2h-2V10.2H19z"/></g>`,
  ),
  hazard: icon(`<path d="M16 3.2 28.8 16 16 28.8 3.2 16z" fill="${MARK.hazard}"/>`),
  restaurant: icon(
    `<g fill="${MARK.ink}"><rect x="11.2" y="3" width="1.7" height="8.2"/><rect x="14.15" y="3" width="1.7" height="8.2"/><rect x="17.1" y="3" width="1.7" height="8.2"/><rect x="13.9" y="10.8" width="2.2" height="2"/><rect x="13.1" y="12.6" width="3.8" height="15.2" rx="1.6"/></g>`,
  ),
  own: icon(
    `<circle cx="16" cy="18" r="6.4" fill="none" stroke="${MARK.ink}" stroke-width="1.6"/><circle cx="16" cy="18" r="2" fill="${MARK.ink}"/><path d="M16 5.2v4.2" stroke="${MARK.ink}" stroke-width="1.7" stroke-linecap="round"/>`,
  ),
  diver: icon(
    `<g fill="${MARK.ink}"><circle cx="16" cy="15" r="7.2"/><rect x="10.6" y="13.4" width="10.8" height="3" fill="${MARK.sea}"/><rect x="11.2" y="22" width="9.6" height="2.2" rx=".4"/></g>`,
  ),
  vessel: icon(`<path d="M16 4.2 23.4 27.2H8.6L16 4.2z" fill="${MARK.ink}"/>`),
  report: icon(
    `<g fill="${MARK.ink}"><rect x="8" y="4" width="1.8" height="24"/><path d="M9.8 5.2h13.2L17.6 11.6l5.4 6H9.8z"/></g>`,
  ),
};

/** The object is the mark. Its box center is the chart coordinate. */
export function chartPinHtml(kind: ChartPinKind): string {
  return PLACE[kind];
}

/** Open-end wrench for the master. Flat-crowned peaked cap for the captain. */
export function actorPinHtml(actor: ActorPin, tone: ActorTone = "cyan"): string {
  if (actor === "wrench") {
    const color = tone === "red" ? MARK.hazard : MARK.wrench;
    return icon(
      `<g transform="translate(1.2 1.2) scale(1.22)" fill="${color}"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>`,
    );
  }
  const crown = tone === "red" ? "#F0D2CC" : "#F4F1EA";
  return icon(
    `<path d="M4.2 21.2V12.4C4.2 9.6 6.4 7.4 9.4 7.4h8.2c2.6 0 4.4 1.8 4.4 4.4v9.4H4.2z" fill="${crown}"/><rect x="4.2" y="16.6" width="17.8" height="2.2" fill="#C6A15A"/><circle cx="8" cy="13.2" r="1.15" fill="#C6A15A"/><path d="M15.2 18.4c5.8-.4 11.6.4 13.6 2-1.4 2-7 2.8-12.4 1.8-1-.2-1.5-1.6-1.2-3.8z" fill="#1A140E"/>`,
  );
}

export const CHART_PIN_SIZE: [number, number] = [SIZE, SIZE];
export const CHART_PIN_ANCHOR: [number, number] = [SIZE / 2, SIZE / 2];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -22];
