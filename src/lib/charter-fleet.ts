import type { CharterBase, CharterHull, CharterKind, CharterYacht, InquiryStatus } from "@/lib/charter-desk";

export interface FleetYachtInput {
  name: string;
  model: string;
  year: number;
  loaM: number;
  berths: number;
  cabins: number;
  base: CharterBase;
  hull: CharterHull;
  kind: CharterKind;
  weeklyEur: number;
  skipper: string;
  listed: boolean;
}

export interface StoredWeek {
  startIso: string;
  status: "open" | "blocked";
}

export interface StoredYacht {
  id: string;
  ownerId: string;
  operatorName: string;
  name: string;
  model: string;
  year: number;
  loaM: number;
  berths: number;
  cabins: number;
  base: CharterBase;
  hull: CharterHull;
  kind: CharterKind;
  weeklyEur: number;
  skipper: string | null;
  listed: boolean;
  photos: string[];
  weeks: StoredWeek[];
}

export const SAMPLE_PHOTOS: Record<string, string> = {
  "yt-aegean-pearl": "/charter/aegean-pearl.webp",
  "yt-meltemi": "/charter/meltemi.webp",
  "yt-lycian-wind": "/charter/lycian-wind.webp",
  "yt-blue-anatolia": "/charter/blue-anatolia.webp",
  "yt-twin-coast": "/charter/twin-coast.webp",
  "yt-karia": "/charter/karia.webp",
};

export interface StoredInquiry {
  id: string;
  yachtId: string;
  guestName: string;
  contact: string;
  party: number;
  startIso: string;
  note: string | null;
  status: InquiryStatus;
}

export interface InquiryInput {
  guestName: string;
  contact: string;
  party: number;
  startIso: string;
  note: string;
}

const HULLS = new Set<CharterHull>(["sail", "catamaran", "motor", "gulet"]);
const KINDS = new Set<CharterKind>(["bareboat", "crewed", "cabin"]);

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Upcoming Saturday-to-Saturday starts, including today when today is Saturday. */
export function upcomingSaturdays(now = new Date(), count = 8): string[] {
  const today = startOfDay(now);
  const ahead = today.getDay() === 6 ? 0 : 6 - today.getDay();
  const first = new Date(today.getTime() + ahead * 86_400_000);
  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    days.push(toIsoDate(new Date(first.getTime() + i * 7 * 86_400_000)));
  }
  return days;
}

export function isSaturdayIso(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  return new Date(y, m - 1, d).getDay() === 6;
}

export function yachtInputError(input: FleetYachtInput): "name" | "model" | "year" | "loa" | "berths" | "cabins" | "base" | "hull" | "kind" | "price" | "skipper" | null {
  if (input.name.trim().length < 2 || input.name.trim().length > 80) return "name";
  if (input.model.trim().length < 2 || input.model.trim().length > 80) return "model";
  if (!Number.isInteger(input.year) || input.year < 1970 || input.year > 2040) return "year";
  if (!(input.loaM > 0) || input.loaM > 80) return "loa";
  if (!Number.isInteger(input.berths) || input.berths < 1 || input.berths > 40) return "berths";
  if (!Number.isInteger(input.cabins) || input.cabins < 1 || input.cabins > 20) return "cabins";
  const base = input.base.trim();
  if (base.length < 2 || base.length > 80) return "base";
  if (!HULLS.has(input.hull)) return "hull";
  if (!KINDS.has(input.kind)) return "kind";
  if (!(input.weeklyEur >= 0) || input.weeklyEur > 500_000) return "price";
  const skipper = input.skipper.trim();
  if (skipper && (skipper.length < 2 || skipper.length > 80)) return "skipper";
  return null;
}

export function inquiryInputError(input: InquiryInput): "name" | "contact" | "party" | "week" | "note" | null {
  if (input.guestName.trim().length < 2 || input.guestName.trim().length > 80) return "name";
  if (input.contact.trim().length < 5 || input.contact.trim().length > 120) return "contact";
  if (!Number.isInteger(input.party) || input.party < 1 || input.party > 24) return "party";
  if (!isSaturdayIso(input.startIso)) return "week";
  if (input.note.trim().length > 500) return "note";
  return null;
}

export function toDeskYacht(yacht: StoredYacht): CharterYacht {
  return {
    id: yacht.id,
    name: yacht.name,
    model: yacht.model,
    year: yacht.year,
    loaM: yacht.loaM,
    berths: yacht.berths,
    cabins: yacht.cabins,
    base: yacht.base,
    hull: yacht.hull,
    kind: yacht.kind,
    status: yacht.listed ? "available" : "turnaround",
    weeklyFromEur: yacht.weeklyEur,
    skipper: yacht.skipper,
  };
}

export function samplePhoto(id: string): string | null {
  return SAMPLE_PHOTOS[id] ?? null;
}

export function blockedStarts(yacht: StoredYacht): string[] {
  return yacht.weeks.filter((week) => week.status === "blocked").map((week) => week.startIso);
}

export function openStarts(yacht: StoredYacht): string[] {
  return yacht.weeks.filter((week) => week.status === "open").map((week) => week.startIso);
}

export interface CatalogueProbe {
  base: string;
  openWeeks: string[];
  berths: number;
  hull: CharterHull | null;
  kind: CharterKind;
  weeklyEur: number;
  loaM: number;
}

export interface CatalogueQuery {
  place: string;
  week: string;
  party: number;
  hull: CharterHull | "all";
  kind: CharterKind | "all";
}

/** Guest search: place, Saturday, party size, hull and contract. */
export function catalogueMatch(row: CatalogueProbe, query: CatalogueQuery): boolean {
  const place = query.place.trim().toLocaleLowerCase("tr");
  if (place && !row.base.toLocaleLowerCase("tr").includes(place)) return false;
  if (query.week && !row.openWeeks.includes(query.week)) return false;
  if (query.party > row.berths) return false;
  if (query.hull !== "all" && row.hull !== query.hull) return false;
  if (query.kind !== "all" && row.kind !== query.kind) return false;
  return true;
}

export type CatalogueSort = "open" | "price" | "loa";

export function sortCatalogue<T extends CatalogueProbe>(rows: T[], sort: CatalogueSort): T[] {
  const copy = rows.slice();
  copy.sort((a, b) => {
    if (sort === "price") return a.weeklyEur - b.weeklyEur || a.base.localeCompare(b.base, "tr");
    if (sort === "loa") return b.loaM - a.loaM || a.weeklyEur - b.weeklyEur;
    const aWeek = a.openWeeks[0] ?? "9999";
    const bWeek = b.openWeeks[0] ?? "9999";
    return aWeek.localeCompare(bWeek) || a.weeklyEur - b.weeklyEur;
  });
  return copy;
}
