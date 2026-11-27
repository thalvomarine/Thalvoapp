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

/** Night-chart ink. One material, shape does the telling. */
const FACE = "#141C28";
const INK = "#E6E0D4";
const HAIR = "rgba(230,224,212,0.34)";
const SIZE = 34;

const EDGE: Record<ActorTone, string> = {
  cyan: "rgba(176,196,208,0.55)",
  gold: "rgba(198,161,90,0.72)",
  red: "rgba(196,92,74,0.9)",
};

function face(edge: string, body: string): string {
  return `<div class="thalvo-disc" style="width:${SIZE}px;height:${SIZE}px;border-radius:50%;background:${FACE};box-shadow:inset 0 0 0 1px ${edge};display:grid;place-items:center;box-sizing:border-box">${body}</div>`;
}

function svg(body: string, width = 18): string {
  return `<svg width="${width}" height="${width}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

const PLACE: Record<ChartPinKind, { edge: string; glyph: string }> = {
  marina: {
    edge: HAIR,
    glyph: svg(
      `<rect x="2.2" y="6.4" width="19.6" height="2.5" rx=".3" fill="${INK}"/><rect x="10.75" y="8.7" width="2.5" height="10.4" rx=".3" fill="${INK}"/>`,
    ),
  },
  anchorage: {
    edge: HAIR,
    glyph: svg(
      `<g fill="${INK}"><circle cx="12" cy="4.05" r="1.7"/><circle cx="12" cy="4.05" r=".72" fill="${FACE}"/><rect x="11.25" y="5.55" width="1.5" height="7"/><rect x="7.5" y="6.7" width="9" height="1.4"/><path d="M12 12.2c-3.7 0-5.7 2.2-5.9 4.7h1.9c.2-1.3 1.5-2.4 4-2.4s3.8 1.1 4 2.4h1.9c-.2-2.5-2.2-4.7-5.9-4.7z"/></g>`,
    ),
  },
  fuel: {
    edge: HAIR,
    glyph: svg(
      `<g fill="${INK}"><rect x="5.6" y="4.2" width="8.4" height="15.4" rx="1.15"/><rect x="7.15" y="6.15" width="5.3" height="3" fill="${FACE}"/><path d="M14 6.7h1.7c.95 0 1.7.75 1.7 1.7v4.3h-1.45V8.55H14z"/></g>`,
    ),
  },
  hazard: {
    edge: "rgba(196,92,74,0.85)",
    glyph: svg(`<path d="M12 3.4 20.1 12 12 20.6 3.9 12z" fill="#C45C4A"/>`),
  },
  lighthouse: {
    edge: HAIR,
    glyph: svg(
      `<g fill="${INK}"><rect x="9.3" y="3.5" width="5.4" height="2.7"/><rect x="10.55" y="4.05" width="2.9" height="1.35" fill="${FACE}"/><rect x="8.15" y="6.05" width="7.7" height="1.15"/><path d="M10.25 7.2 8.7 17.1h6.6L13.75 7.2z"/><rect x="7.5" y="17.1" width="9" height="1.55"/></g>`,
    ),
  },
  restaurant: {
    edge: HAIR,
    glyph: svg(
      `<g fill="${INK}"><rect x="8.7" y="2.8" width="1.25" height="6.1"/><rect x="11.38" y="2.8" width="1.25" height="6.1"/><rect x="14.05" y="2.8" width="1.25" height="6.1"/><rect x="11.15" y="8.5" width="1.7" height="1.7"/><rect x="10.35" y="10" width="3.3" height="10.2" rx="1.35"/></g>`,
    ),
  },
  own: {
    edge: "rgba(176,196,208,0.6)",
    glyph: svg(
      `<circle cx="12" cy="13" r="5.1" fill="none" stroke="${INK}" stroke-width="1.35"/><circle cx="12" cy="13" r="1.65" fill="${INK}"/><path d="M12 4.1v3.05" stroke="${INK}" stroke-width="1.45" stroke-linecap="round"/>`,
    ),
  },
  diver: {
    edge: HAIR,
    glyph: svg(
      `<g fill="${INK}"><circle cx="12" cy="10.6" r="5.35"/><rect x="8.3" y="9.55" width="7.4" height="2.35" fill="${FACE}"/><rect x="8.4" y="15.7" width="7.2" height="1.7" rx=".3"/></g>`,
    ),
  },
  vessel: {
    edge: HAIR,
    glyph: svg(`<path d="M12 3.3 16.5 18.8H7.5L12 3.3z" fill="${INK}"/>`),
  },
  report: {
    edge: HAIR,
    glyph: svg(
      `<g fill="${INK}"><rect x="6.3" y="3.2" width="1.45" height="17.2"/><path d="M7.75 4.1h9.4L13.5 8.7l3.65 4.3H7.75z"/></g>`,
    ),
  },
};

/** Centered chart disc. The geographic point is the middle of the circle. */
export function chartPinHtml(kind: ChartPinKind): string {
  const place = PLACE[kind];
  return face(place.edge, place.glyph);
}

/**
 * Mission actors on the same disc.
 * The wrench is a real open-end, turning a few degrees.
 * The cap is a peaked captain's cap: white crown, black visor, dull gold band.
 */
export function actorPinHtml(actor: ActorPin, tone: ActorTone = "cyan"): string {
  if (actor === "wrench") {
    const body = svg(
      `<g fill="${INK}"><animateTransform attributeName="transform" type="rotate" values="-9 12 12;9 12 12;-9 12 12" dur="2.8s" repeatCount="indefinite"/><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>`,
      17,
    );
    return face(EDGE[tone], body);
  }
  const body = svg(
    `<path d="M12.2 14.5h8.5c.45 0 .62.58.28.9l-1.35 1c-1.45.65-3.7.6-5.3.25l-2.13-.4V14.5z" fill="#1A140C"/><path d="M3.7 15.4V9.5c0-2.55 2.05-4.5 4.7-4.5h2.15c2.35 0 4.15 1.65 4.15 4.2v6.2H3.7z" fill="#F3F0E8"/><rect x="3.85" y="12.35" width="10.7" height="1.45" fill="#C6A15A"/><circle cx="7.5" cy="9.55" r=".9" fill="#C6A15A"/>`,
    20,
  );
  return face(EDGE[tone], body);
}

export const CHART_PIN_SIZE: [number, number] = [SIZE, SIZE];
export const CHART_PIN_ANCHOR: [number, number] = [SIZE / 2, SIZE / 2];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -22];
