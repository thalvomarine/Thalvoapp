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
  endIso: string;
  note: string | null;
  status: InquiryStatus;
}

export interface InquiryInput {
  guestName: string;
  contact: string;
  party: number;
  startIso: string;
  endIso: string;
  note: string;
}

const HULLS = new Set<CharterHull>(["sail", "catamaran", "motor", "gulet"]);
const KINDS = new Set<CharterKind>(["bareboat", "crewed", "cabin"]);
const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addIsoDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, m! - 1, d! + days);
  return toIsoDate(date);
}

export function isIsoDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Upcoming calendar days, including today. */
export function upcomingDays(now = new Date(), count = 42): string[] {
  const today = startOfDay(now);
  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    days.push(toIsoDate(new Date(today.getTime() + i * DAY_MS)));
  }
  return days;
}

/** Nights in [startIso, endIso). */
export function stayNights(startIso: string, endIso: string): string[] {
  if (!isIsoDate(startIso) || !isIsoDate(endIso) || endIso <= startIso) return [];
  const nights: string[] = [];
  let cursor = startIso;
  while (cursor < endIso) {
    nights.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return nights;
}

export function stayFullyOpen(openDays: string[], startIso: string, endIso: string): boolean {
  const nights = stayNights(startIso, endIso);
  if (nights.length === 0) return false;
  const open = new Set(openDays);
  return nights.every((night) => open.has(night));
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

export function inquiryInputError(input: InquiryInput): "name" | "contact" | "party" | "dates" | "note" | null {
  if (input.guestName.trim().length < 2 || input.guestName.trim().length > 80) return "name";
  if (input.contact.trim().length < 5 || input.contact.trim().length > 120) return "contact";
  if (!Number.isInteger(input.party) || input.party < 1 || input.party > 24) return "party";
  if (!isIsoDate(input.startIso) || !isIsoDate(input.endIso) || input.endIso <= input.startIso) return "dates";
  const nights = stayNights(input.startIso, input.endIso);
  if (nights.length < 1 || nights.length > 60) return "dates";
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
  openDays: string[];
  berths: number;
  cabins?: number;
  hull: CharterHull | null;
  weeklyEur: number;
  loaM: number;
}

export interface CatalogueQuery {
  place: string;
  checkIn?: string;
  checkOut?: string;
  party: number;
  minCabins?: number;
  minWeekly?: number;
  maxWeekly?: number;
  hull: CharterHull | "all";
}

/** Guest search: place, stay dates, party, cabins, price and hull. */
export function catalogueMatch(row: CatalogueProbe, query: CatalogueQuery): boolean {
  const place = query.place.trim().toLocaleLowerCase("tr");
  if (place && !row.base.toLocaleLowerCase("tr").includes(place)) return false;
  const checkIn = query.checkIn ?? "";
  const checkOut = query.checkOut ?? "";
  if (checkIn && checkOut && checkOut > checkIn) {
    if (!stayFullyOpen(row.openDays, checkIn, checkOut)) return false;
  } else if (row.openDays.length === 0) {
    return false;
  }
  if (query.party > row.berths) return false;
  const minCabins = query.minCabins ?? 1;
  if (minCabins > 1 && (row.cabins ?? 0) < minCabins) return false;
  const minWeekly = query.minWeekly ?? 0;
  const maxWeekly = query.maxWeekly ?? 0;
  if (minWeekly > 0 && row.weeklyEur < minWeekly) return false;
  if (maxWeekly > 0 && row.weeklyEur > maxWeekly) return false;
  if (query.hull !== "all" && row.hull !== query.hull) return false;
  return true;
}

export type CatalogueSort = "open" | "price" | "loa";

export function sortCatalogue<T extends CatalogueProbe>(rows: T[], sort: CatalogueSort): T[] {
  const copy = rows.slice();
  copy.sort((a, b) => {
    if (sort === "price") return a.weeklyEur - b.weeklyEur || a.base.localeCompare(b.base, "tr");
    if (sort === "loa") return b.loaM - a.loaM || a.weeklyEur - b.weeklyEur;
    const aDay = a.openDays[0] ?? "9999";
    const bDay = b.openDays[0] ?? "9999";
    return aDay.localeCompare(bDay) || a.weeklyEur - b.weeklyEur;
  });
  return copy;
}

