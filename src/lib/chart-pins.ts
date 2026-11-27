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

const TONE: Record<ActorTone, string> = {
  cyan: "#00F0FF",
  gold: "#F5B942",
  red: "#FB7185",
};

const PLACE: Record<ChartPinKind, { color: string; glyph: string }> = {
  marina: {
    color: "#F5B942",
    glyph: `<path d="M3.4 7.4h17.2" stroke-width="2.2"/><path d="M12 7.4v10.4" stroke-width="2.2"/><circle cx="4.6" cy="7.4" r="1.2" fill="#F5B942" stroke="none"/><circle cx="19.4" cy="7.4" r="1.2" fill="#F5B942" stroke="none"/><path d="M8.6 17.8h6.8"/>`,
  },
  anchorage: {
    color: "#34D399",
    glyph: `<circle cx="12" cy="4.4" r="1.35" fill="#34D399" stroke="none"/><path d="M12 5.7v8.6M8.6 8.1h6.8"/><path d="M12 14.2c-3.6 0-5.6 2.1-5.6 4.4h2.3c0-1.3 1.1-2.2 3.3-2.2s3.3.9 3.3 2.2h2.3c0-2.3-2-4.4-5.6-4.4z"/>`,
  },
  fuel: {
    color: "#FBBF24",
    glyph: `<rect x="4.4" y="6.2" width="8.4" height="12.6" rx="1.3"/><path d="M6.2 9.4h4.8M12.8 8.2c2.4.1 3.6 1.3 3.6 3v3.4"/><path d="M16.4 14.6v2.2" stroke-width="2.1"/><circle cx="16.4" cy="18.2" r=".7" fill="#FBBF24" stroke="none"/>`,
  },
  hazard: {
    color: "#FB7185",
    glyph: `<path d="M12 3.6 20.4 12 12 20.4 3.6 12 12 3.6z"/><path d="M12 8.2v4.6M12 15.4v.6" stroke-width="2"/>`,
  },
  lighthouse: {
    color: "#FDE68A",
    glyph: `<path d="M1.6 7.6h6.2M16.2 7.6h6.2" stroke-width="1.6"/><rect x="9.2" y="4.4" width="5.6" height="3.1" rx=".35"/><path d="M8 7.8h8M10 7.8 8.6 16.4h6.8L14 7.8M7.2 16.4h9.6M8.8 18.8h6.4"/>`,
  },
  restaurant: {
    color: "#C4B5FD",
    glyph: `<path d="M5.2 3.8v6.2M3.6 3.8v2.8c0 1.2.9 1.7 1.6 1.7s1.6-.5 1.6-1.7V3.8M5.2 10v9.4"/><circle cx="14.4" cy="13.6" r="5.1"/>`,
  },
  own: {
    color: "#00F0FF",
    glyph: `<circle cx="12" cy="12.6" r="6.3"/><circle cx="12" cy="12.6" r="2.15" fill="#00F0FF" stroke="none"/><path d="M12 3v3.2" stroke-width="2.1"/>`,
  },
  diver: {
    color: "#22D3EE",
    glyph: `<circle cx="11" cy="13.2" r="5"/><path d="M7.2 13.6h7.6"/><circle cx="9.2" cy="12.1" r=".85" fill="#22D3EE" stroke="none"/><circle cx="12.8" cy="12.1" r=".85" fill="#22D3EE" stroke="none"/><circle cx="16.8" cy="7.6" r="1.2"/><circle cx="18.8" cy="5.1" r=".75"/><circle cx="15.2" cy="5.6" r=".55"/>`,
  },
  vessel: {
    color: "#7DD3FC",
    glyph: `<path d="M12 3.2 17.6 19.2H6.4L12 3.2z"/><path d="M12 8.4v6.4" stroke-width="1.5"/>`,
  },
  report: {
    color: "#F8FAFC",
    glyph: `<path d="M6.6 3.8v16.4"/><path d="M6.6 4.6h10.2L13.2 9.2l3.6 4.4H6.6z" fill="#F8FAFC" fill-opacity=".2"/>`,
  },
};

function disc(color: string, body: string): string {
    return `<div class="thalvo-disc" style="width:44px;height:44px;border-radius:50%;background:#071422;border:2px solid ${color};box-shadow:0 0 0 3px ${color}40;display:grid;place-items:center;box-sizing:border-box">${body}</div>`;
}

function stroked(color: string, body: string): string {
  return `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}

/** Centered chart disc. The geographic anchor is the middle of the circle. */
export function chartPinHtml(kind: ChartPinKind): string {
  const place = PLACE[kind];
  return disc(place.color, stroked(place.color, place.glyph));
}

/**
 * Mission actors. The wrench turns around its own center.
 * The captain's cap stays still. Both discs share the same 44px box.
 */
export function actorPinHtml(actor: ActorPin, tone: ActorTone = "cyan"): string {
  const color = TONE[tone];
  if (actor === "wrench") {
    const body = `<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><g fill="${color}"><animateTransform attributeName="transform" type="rotate" values="-22 12 12;22 12 12;-22 12 12" dur="1.15s" repeatCount="indefinite"/><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g></svg>`;
    return disc(color, body);
  }
  const body = `<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.4 14.2h8.4c.55 0 .75.7.35 1.05l-1.5 1.15c-1.3.7-3.4.7-5.1.35l-2.15-.4v-2.15z" fill="${color}"/><path d="M3.6 15.5V9.2C3.6 6.4 5.8 4.4 8.6 4.4h2.4c2.5 0 4.4 1.7 4.4 4.4v6.7H3.6z" fill="#10243f" stroke="#F8FAFC" stroke-width="1.2"/><rect x="3.8" y="12.2" width="11.4" height="1.7" fill="${color}"/><circle cx="7.4" cy="9.4" r="1.15" fill="${color}"/></svg>`;
  return disc(color, body);
}

export const CHART_PIN_SIZE: [number, number] = [44, 44];
export const CHART_PIN_ANCHOR: [number, number] = [22, 22];
export const CHART_POPUP_ANCHOR: [number, number] = [0, -28];
