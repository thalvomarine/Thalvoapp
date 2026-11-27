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
 * Soft-capsule chart cards. The tip disc sits on the coordinate.
 * Fills stay muted brass, sea, ochre, and brick — no neon.
 */
const FILL: Record<ChartPinKind, string> = {
  marina: "#C4A15A",
  anchorage: "#3E7A62",
  fuel: "#C4893A",
  hazard: "#C45C4A",
  lighthouse: "#E0C98A",
  restaurant: "#A89078",
  own: "#C4A15A",
  diver: "#4E7C86",
  vessel: "#6E8494",
  report: "#E4DDD0",
};

const GLYPH: Record<ChartPinKind, string> = {
  marina:
    '<path d="M5 18.5h14l-1.6 1.8H6.6L5 18.5zM12 4.2v14.3M12 5.2l6.8 10.2H12V5.2zM12 8.2 7.2 14.5H12V8.2z" fill="none" stroke="#041018" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  anchorage:
    '<path d="M12 4v11M8 8.5h8M12 15c-3.2 0-5 1.8-5 4h10c0-2.2-1.8-4-5-4z" fill="none" stroke="#041018" stroke-width="1.7" stroke-linecap="round"/>',
  fuel:
    '<path d="M8 19V6.5A1.5 1.5 0 0 1 9.5 5h4A1.5 1.5 0 0 1 15 6.5V19M8 10h7M15 8.5h1.4a2 2 0 0 1 2 2V14a1.6 1.6 0 1 1-3.2 0" fill="none" stroke="#041018" stroke-width="1.7" stroke-linecap="round"/>',
  hazard:
    '<path d="M12 4.5 20 19H4L12 4.5zM12 10v4M12 16.2v.6" fill="none" stroke="#041018" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  lighthouse:
    '<path d="M12 4v2M9.5 20h5M10 18V9.5h4V18M9 9.5h6M8 7.2 10 9.5M16 7.2 14 9.5" fill="none" stroke="#041018" stroke-width="1.7" stroke-linecap="round"/>',
  restaurant:
    '<path d="M8 4.5v6a2 2 0 0 0 2 2V20M14 4.5v15M17 4.5v6" fill="none" stroke="#041018" stroke-width="1.7" stroke-linecap="round"/>',
  own: '<circle cx="12" cy="12" r="3.2" fill="#041018"/>',
  diver:
    '<circle cx="12" cy="11" r="4.2" fill="none" stroke="#041018" stroke-width="1.7"/><path d="M8.6 11.2h6.8" stroke="#041018" stroke-width="1.7" stroke-linecap="round"/>',
  vessel:
    '<path d="M5 18.5h14l-1.6 1.8H6.6L5 18.5zM12 4.2v14.3M12 5.2l6.8 10.2H12V5.2z" fill="none" stroke="#041018" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  report:
    '<path d="M8 4.2v16M8 5.2h9.2L13.4 9.6l3.8 4.2H8" fill="none" stroke="#041018" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
};

const ACTOR_FILL: Record<ActorTone, string> = {
  cyan: "#C4A15A",
  gold: "#C4A15A",
  red: "#C45C4A",
};

const GLYPH_SIZE = 20;

function capsule(fill: string, glyph: string): string {
  return `<div style="width:30px;height:46px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45))"><div style="width:30px;height:38px;border-radius:15px 15px 12px 12px;background:${fill};border:2px solid #fff;display:grid;place-items:center;box-sizing:border-box"><svg width="${GLYPH_SIZE}" height="${GLYPH_SIZE}" viewBox="0 0 24 24" aria-hidden="true">${glyph}</svg></div><div style="width:10px;height:10px;margin:-5px auto 0;background:${fill};border-radius:50%;border:2px solid #fff;box-sizing:border-box"></div></div>`;
}

/** Soft capsule. The tip disc is the chart coordinate. */
export function chartPinHtml(kind: ChartPinKind): string {
  return capsule(FILL[kind], GLYPH[kind]);
}

/** Wrench and peaked cap, in the same capsule as the chart marks. */
export function actorPinHtml(actor: ActorPin, tone: ActorTone = "cyan"): string {
  const fill = ACTOR_FILL[tone];
  const glyph =
    actor === "wrench"
      ? '<path d="M14.2 7.2 16 9l1.2-1.2 2.2-2.2a4.2 4.2 0 0 1-5.6 5.6L8.2 16.8a1.5 1.5 0 0 1-2.1-2.1l5.6-5.6a4.2 4.2 0 0 1 5.6-5.6L14.2 7.2z" fill="none" stroke="#041018" stroke-width="1.6" stroke-linejoin="round"/>'
      : '<path d="M5 15.2V10.2C5 8 6.8 6.4 9.2 6.4h4.2c2 0 3.4 1.4 3.4 3.4v5.4H5z" fill="none" stroke="#041018" stroke-width="1.6"/><path d="M5 13.2h12" stroke="#041018" stroke-width="1.6"/><path d="M12.4 15.2c4 .2 7.2.8 8.2 1.6-1 1.4-4.6 1.8-7.6 1.2" fill="none" stroke="#041018" stroke-width="1.6" stroke-linecap="round"/>';
  return capsule(fill, glyph);
}

export const CHART_PIN_SIZE: [number, number] = [30, 46];
export const CHART_PIN_ANCHOR: [number, number] = [15, 46];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -42];
