/** Charter operator desk — sample fleet & bookings (UI preview, not live DB). */

export type CharterBase = "Göcek" | "Marmaris" | "Bodrum" | "Fethiye";

export type YachtStatus = "available" | "on_charter" | "turnaround" | "maintenance";

export type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "option"
  | "cancelled";

export type InquiryStatus = "new" | "quoted" | "hold" | "won" | "lost";

export type CharterKind = "bareboat" | "crewed" | "cabin";

export interface CharterYacht {
  id: string;
  name: string;
  model: string;
  year: number;
  loaM: number;
  berths: number;
  cabins: number;
  base: CharterBase;
  kind: CharterKind;
  status: YachtStatus;
  weeklyFromEur: number;
  skipper: string | null;
}

export interface CharterBooking {
  id: string;
  yachtId: string;
  guest: string;
  party: number;
  baseOut: CharterBase;
  baseIn: CharterBase;
  startIso: string;
  endIso: string;
  status: BookingStatus;
  kind: CharterKind;
  ref: string;
  notes?: string;
}

export interface CharterInquiry {
  id: string;
  guest: string;
  from: string;
  dates: string;
  yachtHint: string;
  status: InquiryStatus;
  channel: "web" | "whatsapp" | "broker" | "walk_in";
  valueEur: number;
}

export interface DayCell {
  iso: string;
  label: string;
  weekday: string;
  checkIns: number;
  checkOuts: number;
  onCharter: number;
}

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export const CHARTER_BASES: CharterBase[] = ["Göcek", "Marmaris", "Bodrum", "Fethiye"];

export const SEED_FLEET: CharterYacht[] = [
  {
    id: "yt-aegean-pearl",
    name: "Aegean Pearl",
    model: "Lagoon 42",
    year: 2022,
    loaM: 12.8,
    berths: 10,
    cabins: 4,
    base: "Göcek",
    kind: "bareboat",
    status: "on_charter",
    weeklyFromEur: 6800,
    skipper: null,
  },
  {
    id: "yt-meltemi",
    name: "Meltemi",
    model: "Bavaria C46",
    year: 2023,
    loaM: 14.4,
    berths: 8,
    cabins: 4,
    base: "Bodrum",
    kind: "bareboat",
    status: "available",
    weeklyFromEur: 5200,
    skipper: null,
  },
  {
    id: "yt-lycian-wind",
    name: "Lycian Wind",
    model: "Sun Odyssey 440",
    year: 2021,
    loaM: 13.4,
    berths: 8,
    cabins: 3,
    base: "Marmaris",
    kind: "bareboat",
    status: "turnaround",
    weeklyFromEur: 4100,
    skipper: null,
  },
  {
    id: "yt-blue-anatolia",
    name: "Blue Anatolia",
    model: "Gulet 28 m",
    year: 2019,
    loaM: 28,
    berths: 16,
    cabins: 8,
    base: "Göcek",
    kind: "crewed",
    status: "on_charter",
    weeklyFromEur: 18500,
    skipper: "Capt. Deniz A.",
  },
  {
    id: "yt-twin-coast",
    name: "Twin Coast",
    model: "Excess 14",
    year: 2024,
    loaM: 13.3,
    berths: 10,
    cabins: 4,
    base: "Bodrum",
    kind: "bareboat",
    status: "maintenance",
    weeklyFromEur: 7400,
    skipper: null,
  },
  {
    id: "yt-karia",
    name: "Karia",
    model: "Hanse 460",
    year: 2022,
    loaM: 14.6,
    berths: 8,
    cabins: 3,
    base: "Fethiye",
    kind: "bareboat",
    status: "available",
    weeklyFromEur: 4800,
    skipper: null,
  },
];

/** Bookings anchored to "today" so the ops board stays current. */
export function buildSeedBookings(now = new Date()): CharterBooking[] {
  const today = startOfDay(now);
  const iso = (offset: number) => toIsoDate(addDays(today, offset));
  return [
    {
      id: "bk-1001",
      yachtId: "yt-aegean-pearl",
      guest: "Helena & Markus W.",
      party: 6,
      baseOut: "Göcek",
      baseIn: "Göcek",
      startIso: iso(-4),
      endIso: iso(3),
      status: "checked_in",
      kind: "bareboat",
      ref: "THV-C-2401",
      notes: "APA settled · dinghy brief done",
    },
    {
      id: "bk-1002",
      yachtId: "yt-blue-anatolia",
      guest: "Broker · Aegean Blue",
      party: 12,
      baseOut: "Göcek",
      baseIn: "Bodrum",
      startIso: iso(-2),
      endIso: iso(5),
      status: "checked_in",
      kind: "crewed",
      ref: "THV-C-2402",
    },
    {
      id: "bk-1003",
      yachtId: "yt-lycian-wind",
      guest: "Can Öztürk",
      party: 5,
      baseOut: "Marmaris",
      baseIn: "Marmaris",
      startIso: iso(-7),
      endIso: iso(0),
      status: "checked_out",
      kind: "bareboat",
      ref: "THV-C-2398",
      notes: "Turnaround · fuel + linen",
    },
    {
      id: "bk-1004",
      yachtId: "yt-meltemi",
      guest: "Sophie Laurent",
      party: 7,
      baseOut: "Bodrum",
      baseIn: "Bodrum",
      startIso: iso(0),
      endIso: iso(7),
      status: "confirmed",
      kind: "bareboat",
      ref: "THV-C-2410",
      notes: "Check-in 14:00 · skipper option",
    },
    {
      id: "bk-1005",
      yachtId: "yt-karia",
      guest: "Nordic Yacht Club",
      party: 6,
      baseOut: "Fethiye",
      baseIn: "Göcek",
      startIso: iso(2),
      endIso: iso(9),
      status: "confirmed",
      kind: "bareboat",
      ref: "THV-C-2412",
    },
    {
      id: "bk-1006",
      yachtId: "yt-lycian-wind",
      guest: "Elena Rossi",
      party: 4,
      baseOut: "Marmaris",
      baseIn: "Marmaris",
      startIso: iso(1),
      endIso: iso(8),
      status: "option",
      kind: "bareboat",
      ref: "THV-C-2415",
    },
  ];
}

export const SEED_INQUIRIES: CharterInquiry[] = [
  {
    id: "inq-1",
    guest: "James P.",
    from: "London",
    dates: "12–19 Jul",
    yachtHint: "Catamaran 40–45 ft · Göcek",
    status: "new",
    channel: "web",
    valueEur: 7200,
  },
  {
    id: "inq-2",
    guest: "Marina Broker TR",
    from: "İstanbul",
    dates: "02–09 Aug",
    yachtHint: "Crewed gulet · family 10 pax",
    status: "quoted",
    channel: "broker",
    valueEur: 21000,
  },
  {
    id: "inq-3",
    guest: "Walk-in · Bodrum",
    from: "Bodrum",
    dates: "This weekend",
    yachtHint: "Day sail / cabin",
    status: "hold",
    channel: "walk_in",
    valueEur: 1800,
  },
  {
    id: "inq-4",
    guest: "Anna K.",
    from: "Berlin",
    dates: "22–29 Jun",
    yachtHint: "Bavaria / Hanse · bareboat",
    status: "won",
    channel: "whatsapp",
    valueEur: 4900,
  },
];

export function yachtById(fleet: CharterYacht[], id: string): CharterYacht | undefined {
  return fleet.find((y) => y.id === id);
}

export function filterFleet(
  fleet: CharterYacht[],
  base: CharterBase | "all",
  status: YachtStatus | "all",
): CharterYacht[] {
  return fleet.filter((y) => {
    if (base !== "all" && y.base !== base) return false;
    if (status !== "all" && y.status !== status) return false;
    return true;
  });
}

export function filterBookings(
  bookings: CharterBooking[],
  base: CharterBase | "all",
  dayIso: string | null,
): CharterBooking[] {
  return bookings.filter((b) => {
    if (base !== "all" && b.baseOut !== base && b.baseIn !== base) return false;
    if (!dayIso) return true;
    return b.startIso <= dayIso && b.endIso >= dayIso;
  });
}

export function todaysOps(bookings: CharterBooking[], todayIso: string) {
  const checkIns = bookings.filter(
    (b) => b.startIso === todayIso && (b.status === "confirmed" || b.status === "checked_in"),
  );
  const checkOuts = bookings.filter(
    (b) => b.endIso === todayIso && (b.status === "checked_out" || b.status === "checked_in"),
  );
  const active = bookings.filter(
    (b) => b.startIso < todayIso && b.endIso > todayIso && b.status === "checked_in",
  );
  return { checkIns, checkOuts, active };
}

export function fleetStats(fleet: CharterYacht[]) {
  return {
    total: fleet.length,
    onCharter: fleet.filter((y) => y.status === "on_charter").length,
    available: fleet.filter((y) => y.status === "available").length,
    turnaround: fleet.filter((y) => y.status === "turnaround").length,
    maintenance: fleet.filter((y) => y.status === "maintenance").length,
  };
}

export function buildWeekStrip(
  bookings: CharterBooking[],
  fleet: CharterYacht[],
  now = new Date(),
): DayCell[] {
  const today = startOfDay(now);
  const cells: DayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, i);
    const iso = toIsoDate(day);
    const checkIns = bookings.filter((b) => b.startIso === iso && b.status !== "cancelled").length;
    const checkOuts = bookings.filter((b) => b.endIso === iso && b.status !== "cancelled").length;
    const onCharter = bookings.filter(
      (b) => b.startIso <= iso && b.endIso > iso && (b.status === "checked_in" || b.status === "confirmed"),
    ).length;
    cells.push({
      iso,
      label: String(day.getDate()),
      weekday: day.toLocaleDateString("en-GB", { weekday: "short" }),
      checkIns,
      checkOuts,
      onCharter: Math.max(onCharter, i === 0 ? fleet.filter((y) => y.status === "on_charter").length : onCharter),
    });
  }
  return cells;
}

export function todayIso(now = new Date()): string {
  return toIsoDate(startOfDay(now));
}

export function formatLoa(m: number): string {
  return `${m.toFixed(1)} m`;
}

export function formatEur(n: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : locale === "el" ? "el-GR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function bookingNights(b: CharterBooking): number {
  const start = parseIsoDate(b.startIso).getTime();
  const end = parseIsoDate(b.endIso).getTime();
  return Math.max(1, Math.round((end - start) / DAY_MS));
}
