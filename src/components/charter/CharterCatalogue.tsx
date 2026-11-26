import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Anchor, Minus, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Wordmark } from "@/components/Wordmark";
import { MoneyAmount, StatusBadge } from "@/components/core";
import {
  SEED_FLEET,
  buildSeedBookings,
  fleetBases,
  formatLoa,
  occupancyCell,
  parseIsoDate,
  todayIso,
  type CharterHull,
  type CharterKind,
  type OccupancyWeek,
} from "@/lib/charter-desk";
import { formatDm } from "@/lib/formatters";
import { loadListedYachts, sendInquiry } from "@/lib/charter-fleet-api";
import {
  catalogueMatch,
  inquiryInputError,
  openStarts,
  samplePhoto,
  sortCatalogue,
  upcomingSaturdays,
  type CatalogueQuery,
  type CatalogueSort,
  type StoredYacht,
} from "@/lib/charter-fleet";

const PLACE_FIX: Record<string, { lat: number; lng: number }> = {
  göcek: { lat: 36.7531, lng: 28.9386 },
  marmaris: { lat: 36.851, lng: 28.2742 },
  bodrum: { lat: 37.0344, lng: 27.4305 },
  fethiye: { lat: 36.621, lng: 29.1164 },
  istanbul: { lat: 40.975, lng: 29.033 },
  split: { lat: 43.503, lng: 16.441 },
  atina: { lat: 37.9106, lng: 23.704 },
  palma: { lat: 39.568, lng: 2.636 },
};

const HULLS: CharterHull[] = ["sail", "catamaran", "motor", "gulet"];
const KINDS = ["bareboat", "crewed", "cabin"] as const;
type Budget = "all" | "low" | "mid" | "high";

type Listing = {
  id: string;
  name: string;
  model: string;
  year: number;
  loaM: number;
  berths: number;
  cabins: number;
  base: string;
  hull: CharterHull;
  kind: CharterKind;
  weeklyEur: number;
  skipper: string | null;
  operator: string;
  photos: string[];
  openWeeks: string[];
  yard: boolean;
  sample: boolean;
};

function weekOf(iso: string): OccupancyWeek {
  const start = parseIsoDate(iso);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, "0");
  const d = String(end.getDate()).padStart(2, "0");
  return { startIso: iso, endIso: `${y}-${m}-${d}`, label: String(start.getDate()) };
}

function sampleListings(now = new Date()): Listing[] {
  const bookings = buildSeedBookings(now);
  const today = todayIso(now);
  const saturdays = upcomingSaturdays(now, 8);
  const fromSeed = SEED_FLEET.map((yacht) => ({
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
    weeklyEur: yacht.weeklyFromEur,
    skipper: yacht.skipper,
    operator: "THALVO sample",
    photos: [samplePhoto(yacht.id)].filter((url): url is string => !!url),
    openWeeks: saturdays.filter((iso) => {
      const week = weekOf(iso);
      const yardNow = yacht.status === "maintenance" && today >= week.startIso && today < week.endIso;
      if (yardNow) return false;
      const probe = yacht.status === "maintenance" ? { ...yacht, status: "available" as const } : yacht;
      return occupancyCell(probe, week, bookings, today).tone === "free";
    }),
    yard: yacht.status === "maintenance",
    sample: true,
  }));
  const wider: Listing[] = [
    { id: "yt-bogaz", name: "Boğaz", model: "Motor yacht 18 m", year: 2018, loaM: 18, berths: 8, cabins: 4, base: "İstanbul", hull: "motor", kind: "crewed", weeklyEur: 9800, skipper: "Capt. Kerem Y.", operator: "THALVO sample", photos: [], openWeeks: saturdays, yard: false, sample: true },
    { id: "yt-dalmatia", name: "Dalmatia", model: "Bavaria C42", year: 2021, loaM: 12.8, berths: 8, cabins: 3, base: "Split", hull: "sail", kind: "bareboat", weeklyEur: 3600, skipper: null, operator: "THALVO sample", photos: [], openWeeks: saturdays, yard: false, sample: true },
    { id: "yt-saronic", name: "Saronic", model: "Oceanis 46.1", year: 2022, loaM: 14.6, berths: 8, cabins: 4, base: "Atina", hull: "sail", kind: "bareboat", weeklyEur: 4400, skipper: null, operator: "THALVO sample", photos: [], openWeeks: saturdays, yard: false, sample: true },
    { id: "yt-palma", name: "Palma Noon", model: "Lagoon 40", year: 2023, loaM: 11.7, berths: 10, cabins: 4, base: "Palma", hull: "catamaran", kind: "bareboat", weeklyEur: 6100, skipper: null, operator: "THALVO sample", photos: [], openWeeks: saturdays, yard: false, sample: true },
  ];
  return [...fromSeed, ...wider];
}

function fromStored(yacht: StoredYacht): Listing {
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
    weeklyEur: yacht.weeklyEur,
    skipper: yacht.skipper,
    operator: yacht.operatorName,
    photos: yacht.photos,
    openWeeks: openStarts(yacht).slice().sort(),
    yard: false,
    sample: false,
  };
}

function placeFix(base: string): { lat: number; lng: number } | null {
  return PLACE_FIX[base.trim().toLocaleLowerCase("tr")] ?? null;
}

function budgetRange(budget: Budget): { minWeekly: number; maxWeekly: number } {
  if (budget === "low") return { minWeekly: 0, maxWeekly: 5000 };
  if (budget === "mid") return { minWeekly: 5000, maxWeekly: 8000 };
  if (budget === "high") return { minWeekly: 8000, maxWeekly: 0 };
  return { minWeekly: 0, maxWeekly: 0 };
}

export function CharterCatalogue() {
  const { t, i18n } = useTranslation();
  const [place, setPlace] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [party, setParty] = useState(1);
  const [minCabins, setMinCabins] = useState(1);
  const [hull, setHull] = useState<CharterHull | "all">("all");
  const [kind, setKind] = useState<CharterKind | "all">("all");
  const [budget, setBudget] = useState<Budget>("all");
  const [sort, setSort] = useState<CatalogueSort>("open");
  const [live, setLive] = useState<Listing[]>([]);
  const [open, setOpen] = useState<Listing | null>(null);
  const samples = useMemo(() => sampleListings(), []);

  useEffect(() => {
    let cancelled = false;
    loadListedYachts()
      .then((rows) => {
        if (!cancelled) setLive(rows.map(fromStored));
      })
      .catch(() => {
        if (!cancelled) setLive([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const money = budgetRange(budget);
  const query: CatalogueQuery = { place, week: "", checkIn, checkOut, party, minCabins, ...money, hull, kind };
  const relaxed: CatalogueQuery = { ...query, place: "" };
  const pool = [...live, ...samples];
  const exact = sortCatalogue(pool.filter((row) => catalogueMatch(row, query)), sort);
  const wider = sortCatalogue(pool.filter((row) => catalogueMatch(row, relaxed)), sort);
  const fallback = exact.length === 0 && place.trim() !== "" && wider.length > 0;
  const shown = fallback ? wider : exact;
  const firms = shown.filter((row) => !row.sample);
  const examples = shown.filter((row) => row.sample);
  const ports = fleetBases(pool);

  const search = () => {
    document.getElementById("charter-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearAll = () => {
    setPlace("");
    setCheckIn("");
    setCheckOut("");
    setParty(1);
    setMinCabins(1);
    setHull("all");
    setKind("all");
    setBudget("all");
  };

  const title = [hull === "all" ? t("charter.guest_kicker") : t(`charter.hull_${hull}`), place.trim()].filter(Boolean).join(" · ");

  return (
    <div className="min-h-dvh bg-[#eef2f6] text-[#0A192F]">
      <header className="border-b border-[#0A192F]/10 bg-white lg:sticky lg:top-0 lg:z-30">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Wordmark size="sm" />
            <span className="text-[12px] font-semibold tracking-[0.18em] text-[#0A192F]/70">CHARTER</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher tone="light" />
            <Link to="/auth" search={{ next: "/app/charter" }} className="inline-flex h-9 items-center rounded-full bg-[#F5B942] px-4 text-xs font-semibold text-[#1a1203]">
              {t("charter.firm_entry")}
            </Link>
          </div>
        </div>
        <form
          className="mx-auto grid w-full max-w-6xl gap-2 px-4 pb-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_7rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
        >
          <Field label={t("charter.search_place")}>
            <input value={place} onChange={(event) => setPlace(event.target.value)} placeholder={t("charter.search_place_ph")} className={fieldCls} />
          </Field>
          <Field label={t("charter.search_in")}>
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className={fieldCls} />
          </Field>
          <Field label={t("charter.search_out")}>
            <input type="date" value={checkOut} min={checkIn || undefined} onChange={(event) => setCheckOut(event.target.value)} className={fieldCls} />
          </Field>
          <Field label={t("charter.search_party")}>
            <input type="number" min={1} max={24} value={party} onChange={(event) => setParty(Math.min(24, Math.max(1, Math.floor(Number(event.target.value) || 1))))} className={fieldCls} />
          </Field>
          <button type="submit" className="h-11 self-end rounded-xl bg-[#F5B942] px-5 text-sm font-semibold text-[#1a1203]">
            {t("charter.search_go")}
          </button>
        </form>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <details className="rounded-2xl bg-white p-4 shadow-sm lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">{t("charter.filters")}</summary>
            <div className="mt-4">
              <Filters hull={hull} kind={kind} minCabins={minCabins} budget={budget} party={party} place={place} ports={ports} onHull={setHull} onKind={setKind} onCabins={setMinCabins} onBudget={setBudget} onParty={setParty} onPlace={setPlace} />
            </div>
          </details>
          <aside className="hidden rounded-2xl bg-white p-4 shadow-sm lg:block">
            <Filters hull={hull} kind={kind} minCabins={minCabins} budget={budget} party={party} place={place} ports={ports} onHull={setHull} onKind={setKind} onCabins={setMinCabins} onBudget={setBudget} onParty={setParty} onPlace={setPlace} />
          </aside>
        </div>

        <main id="charter-results" className="min-w-0 scroll-mt-36">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0A192F]/45">{t("charter.guest_eyebrow")}</p>
          <h1 className="mt-1 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-[#0A192F]/60">{t("charter.date_hint")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{t("charter.result_count", { count: shown.length })}</p>
            {place.trim() && <Pill onClear={() => setPlace("")}>{place.trim()}</Pill>}
            {checkIn && checkOut && <Pill onClear={() => { setCheckIn(""); setCheckOut(""); }}>{checkIn} – {checkOut}</Pill>}
            {party > 1 && <Pill onClear={() => setParty(1)}>{party} {t("charter.search_party")}</Pill>}
            {minCabins > 1 && <Pill onClear={() => setMinCabins(1)}>{minCabins}+ {t("charter.cabins")}</Pill>}
            {hull !== "all" && <Pill onClear={() => setHull("all")}>{t(`charter.hull_${hull}`)}</Pill>}
            {kind !== "all" && <Pill onClear={() => setKind("all")}>{t(`charter.kind_${kind}`)}</Pill>}
            {budget !== "all" && <Pill onClear={() => setBudget("all")}>{t(`charter.budget_${budget}`)}</Pill>}
            <label className="ml-auto flex items-center gap-2 text-[12px] text-[#0A192F]/55">
              <span>{t("charter.sort_label")}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as CatalogueSort)} className="h-9 rounded-full border border-[#0A192F]/15 bg-white px-3 text-[#0A192F]">
                <option value="open">{t("charter.sort_open")}</option>
                <option value="price">{t("charter.sort_price")}</option>
                <option value="loa">{t("charter.sort_loa")}</option>
              </select>
            </label>
          </div>

          {fallback && (
            <p className="mt-4 rounded-2xl border border-[#F5B942]/50 bg-[#F5B942]/15 px-4 py-3 text-[13px] leading-relaxed">
              {t("charter.fallback_body", { place: place.trim(), count: shown.length })}
            </p>
          )}

          {shown.length === 0 && (
            <div className="mt-4 rounded-2xl bg-white px-4 py-8 text-center shadow-sm">
              <p className="text-sm text-[#0A192F]/70">{t("charter.no_match")}</p>
              <button type="button" onClick={clearAll} className="mt-3 text-[13px] font-semibold text-[#0A192F] underline">
                {t("charter.search_reset")}
              </button>
            </div>
          )}

          {firms.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t("charter.live_heading")}</h2>
              <p className="mt-1 text-[13px] text-[#0A192F]/55">{t("charter.live_body")}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {firms.map((boat) => <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />)}
              </div>
            </section>
          )}

          {live.length === 0 && shown.length > 0 && firms.length === 0 && (
            <p className="mt-4 text-[13px] text-[#0A192F]/50">{t("charter.live_empty")}</p>
          )}

          {examples.length > 0 && (
            <section className="mt-8">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold">{t("charter.sample_heading")}</h2>
                <StatusBadge tone="warning">{t("charter.demo_badge")}</StatusBadge>
              </div>
              <p className="mt-1 text-[13px] text-[#0A192F]/55">{t("charter.sample_body")}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {examples.map((boat) => <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />)}
              </div>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-lg font-semibold">{t("charter.season_title")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SeasonCard title={t("charter.season_shoulder")} body={t("charter.season_shoulder_body")} />
              <SeasonCard title={t("charter.season_fair")} body={t("charter.season_fair_body")} />
              <SeasonCard title={t("charter.season_peak")} body={t("charter.season_peak_body")} />
              <SeasonCard title={t("charter.season_quiet")} body={t("charter.season_quiet_body")} />
            </div>
          </section>

          <section className="mt-10 max-w-3xl">
            <h2 className="text-lg font-semibold">{t("charter.faq_title")}</h2>
            <div className="mt-3 divide-y divide-[#0A192F]/10 border-y border-[#0A192F]/10">
              <Faq q={t("charter.faq_price_q")} a={t("charter.faq_price_a")} />
              <Faq q={t("charter.faq_licence_q")} a={t("charter.faq_licence_a")} />
              <Faq q={t("charter.faq_saturday_q")} a={t("charter.faq_saturday_a")} />
              <Faq q={t("charter.faq_pay_q")} a={t("charter.faq_pay_a")} />
            </div>
          </section>
        </main>
      </div>

      <div className="bg-[#06101c]">
        <PublicFooter />
      </div>
      {open && <BoatSheet boat={open} locale={i18n.language} preferredWeek="" onClose={() => setOpen(null)} />}
    </div>
  );
}

const fieldCls = "h-11 w-full rounded-xl border border-[#0A192F]/15 bg-white px-3 text-sm text-[#0A192F] outline-none focus:border-[#F5B942]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Filters({
  hull, kind, minCabins, budget, party, place, ports, onHull, onKind, onCabins, onBudget, onParty, onPlace,
}: {
  hull: CharterHull | "all";
  kind: CharterKind | "all";
  minCabins: number;
  budget: Budget;
  party: number;
  place: string;
  ports: string[];
  onHull: (value: CharterHull | "all") => void;
  onKind: (value: CharterKind | "all") => void;
  onCabins: (value: number) => void;
  onBudget: (value: Budget) => void;
  onParty: (value: number) => void;
  onPlace: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{t("charter.search_cabins")}</p>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-[#0A192F]/10 px-2 py-1">
          <button type="button" aria-label="-" disabled={minCabins <= 1} onClick={() => onCabins(Math.max(1, minCabins - 1))} className="grid size-8 place-items-center rounded-lg text-[#0A192F] disabled:opacity-30">
            <Minus className="size-4" />
          </button>
          <span className="text-sm font-semibold">{minCabins}+</span>
          <button type="button" aria-label="+" disabled={minCabins >= 8} onClick={() => onCabins(Math.min(8, minCabins + 1))} className="grid size-8 place-items-center rounded-lg text-[#0A192F] disabled:opacity-30">
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{t("charter.field_hull")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip active={hull === "all"} onClick={() => onHull("all")}>{t("charter.hull_all")}</FilterChip>
          {HULLS.map((value) => <FilterChip key={value} active={hull === value} onClick={() => onHull(value)}>{t(`charter.hull_${value}`)}</FilterChip>)}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{t("charter.field_kind")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip active={kind === "all"} onClick={() => onKind("all")}>{t("charter.status_all")}</FilterChip>
          {KINDS.map((value) => <FilterChip key={value} active={kind === value} onClick={() => onKind(value)}>{t(`charter.kind_${value}`)}</FilterChip>)}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{t("charter.group_title")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {([[2, "group_2"], [5, "group_5"], [9, "group_9"], [13, "group_13"]] as const).map(([value, key]) => (
            <FilterChip key={key} active={party === value} onClick={() => onParty(value)}>{t(`charter.${key}`)}</FilterChip>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{t("charter.budget_title")}</p>
        <div className="mt-2 flex flex-col gap-1">
          {(["all", "low", "mid", "high"] as const).map((value) => (
            <button key={value} type="button" onClick={() => onBudget(value)} className={"rounded-lg px-2 py-1.5 text-left text-[13px] " + (budget === value ? "bg-[#F5B942]/25 font-semibold" : "hover:bg-[#0A192F]/5")}>
              {t(`charter.budget_${value}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/45">{t("charter.search_place")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ports.map((port) => (
            <FilterChip key={port} active={place.trim().toLocaleLowerCase("tr") === port.toLocaleLowerCase("tr")} onClick={() => onPlace(place.trim().toLocaleLowerCase("tr") === port.toLocaleLowerCase("tr") ? "" : port)}>{port}</FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

function BoatCard({ boat, locale, onOpen }: { boat: Listing; locale: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const photo = boat.photos[0];
  const next = boat.openWeeks[0];
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <button type="button" onClick={onOpen} className="relative aspect-[16/10] bg-[#0A192F] text-left">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full bg-[radial-gradient(circle_at_18%_80%,rgba(0,240,255,0.18),transparent_46%),linear-gradient(165deg,#0A192F,#123)]" />
        )}
        <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-[#06101c]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5B942]">
          {boat.sample ? t("charter.card_sample") : boat.operator}
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06101c] to-transparent p-4 pt-12 text-white">
          <span className="block text-[11px] uppercase tracking-[0.16em] text-white/75">{boat.base}</span>
          <span className="block text-xl font-semibold">{boat.name}</span>
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[13px] text-[#0A192F]/60">{boat.model} · {boat.year} · {formatLoa(boat.loaM)}</p>
        <p className="text-[12px] text-[#0A192F]/75">
          {t(`charter.hull_${boat.hull}`)} · {t(`charter.kind_${boat.kind}`)} · {boat.cabins} {t("charter.cabins")} · {boat.berths} {t("charter.berths")}
        </p>
        <p className="text-[15px] text-[#0A192F]">
          <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
          <span className="text-[#0A192F]/45"> / {t("charter.per_week")} · {t("charter.simulated")}</span>
        </p>
        <p className="text-[12px] leading-relaxed text-[#0A192F]/60">{t(`charter.include_${boat.kind}`)}</p>
        {boat.yard && <p className="text-[12px] text-[#9a6b10]">{t("charter.yard_note")}</p>}
        <p className="text-[12px] text-[#0A192F]/50">
          {next ? `${t("charter.next_open")} ${formatDay(next, locale)} · ${t("charter.open_count", { count: boat.openWeeks.length })}` : t("charter.no_open_week")}
        </p>
        <button type="button" onClick={onOpen} className="mt-auto h-10 rounded-xl bg-[#0A192F] text-sm font-semibold text-white">
          {t("charter.detail_open")}
        </button>
      </div>
    </article>
  );
}

function BoatSheet({ boat, locale, onClose }: { boat: Listing; locale: string; preferredWeek: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(0);
  const [week, setWeek] = useState(boat.openWeeks[0] ?? "");
  const [guestName, setGuestName] = useState("");
  const [contact, setContact] = useState("");
  const [party, setParty] = useState("2");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fix = placeFix(boat.base);
  const src = boat.photos[photo] ?? boat.photos[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const submit = async () => {
    const input = { guestName, contact, party: Number(party), startIso: week, note };
    const error = !week ? "week" : inquiryInputError(input);
    if (error) {
      const key = error === "name" ? "inquiry_need_name" : error === "contact" ? "inquiry_need_contact" : error === "party" ? "inquiry_need_party" : error === "week" ? "inquiry_need_week" : "inquiry_invalid";
      toast.error(t(`charter.${key}`));
      return;
    }
    if (boat.sample) {
      toast.success(t("charter.sample_inquiry"));
      onClose();
      return;
    }
    setBusy(true);
    try {
      await sendInquiry(boat.id, input);
      toast.success(t("charter.inquiry_sent"));
      onClose();
    } catch {
      toast.error(t("charter.inquiry_failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white text-[#0A192F] shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative shrink-0 bg-[#0A192F]">
          {src ? (
            <div className="aspect-[16/9]"><img src={src} alt="" className="h-full w-full object-cover" /></div>
          ) : (
            <div className="flex h-36 items-end bg-[radial-gradient(circle_at_18%_80%,rgba(0,240,255,0.18),transparent_46%),linear-gradient(165deg,#0A192F,#123)] p-5 text-white">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00F0FF]">{t(`charter.hull_${boat.hull}`)}</p>
                <p className="text-2xl font-semibold">{boat.name}</p>
              </div>
            </div>
          )}
          <button type="button" aria-label={t("common.close")} onClick={onClose} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/70 text-white">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {boat.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pt-3">
              {boat.photos.map((url, index) => (
                <button key={url} type="button" onClick={() => setPhoto(index)} className={"h-14 w-20 shrink-0 overflow-hidden rounded-lg border " + (index === photo ? "border-[#F5B942]" : "border-[#0A192F]/10")}>
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="space-y-4 p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A192F]/45">{boat.sample ? t("charter.card_sample") : boat.operator} · {boat.base}</p>
              <h2 className="mt-1 text-2xl font-semibold">{boat.name}</h2>
              <p className="text-[13px] text-[#0A192F]/55">{boat.model} · {boat.year}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className="rounded-full border border-[#0A192F]/10 px-3 py-1">{formatLoa(boat.loaM)}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#0A192F]/10 px-3 py-1"><Anchor className="size-3" /> {boat.cabins} {t("charter.cabins")}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#0A192F]/10 px-3 py-1"><Users className="size-3" /> {boat.berths} {t("charter.berths")}</span>
              <span className="rounded-full border border-[#0A192F]/10 px-3 py-1">{t(`charter.hull_${boat.hull}`)}</span>
              <span className="rounded-full border border-[#0A192F]/10 px-3 py-1">{t(`charter.kind_${boat.kind}`)}</span>
            </div>
            {fix && <p className="font-mono text-[12px] text-[#0A192F]/50">{formatDm(fix.lat, fix.lng)}</p>}
            <p className="text-[14px]">{boat.skipper ? `${t("charter.skipper")}: ${boat.skipper}` : t("charter.bareboat_note")}</p>
            <div className="rounded-2xl bg-[#F5B942]/15 p-4">
              <p className="text-[15px]">
                <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
                <span className="text-[#0A192F]/50"> / {t("charter.per_week")} · {t("charter.simulated")}</span>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed">{t(`charter.include_${boat.kind}`)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0A192F]/40">{t("charter.open_days")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {boat.openWeeks.length === 0 && <p className="text-[13px] text-[#0A192F]/45">{t("charter.no_open_week")}</p>}
                {boat.openWeeks.map((iso) => (
                  <button key={iso} type="button" onClick={() => setWeek(iso)} className={"rounded-full border px-3 py-1.5 text-[12px] " + (week === iso ? "border-[#F5B942] bg-[#F5B942]/20" : "border-[#0A192F]/10")}>
                    {formatDay(iso, locale)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <SheetField label={t("charter.field_name")} value={guestName} onChange={setGuestName} />
              <SheetField label={t("charter.field_contact")} value={contact} onChange={setContact} />
              <SheetField label={t("charter.field_party")} value={party} onChange={setParty} />
              <SheetField label={t("charter.field_note")} value={note} onChange={setNote} />
            </div>
            <button type="button" disabled={busy || !week} onClick={() => void submit()} className="h-11 w-full rounded-full bg-[#F5B942] text-sm font-semibold text-[#1a1203] disabled:opacity-40">
              {t("charter.ask_week")}
            </button>
            <p className="text-[11px] leading-relaxed text-[#0A192F]/45">{boat.sample ? t("charter.sample_note") : t("charter.inquiry_note")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a6b10]">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-[#0A192F]/70">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="py-3">
      <summary className="cursor-pointer text-[14px] font-semibold">{q}</summary>
      <p className="mt-2 text-[13px] leading-relaxed text-[#0A192F]/65">{a}</p>
    </details>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={"rounded-full border px-3 py-1.5 text-[12px] font-semibold " + (active ? "border-[#F5B942] bg-[#F5B942]/25 text-[#1a1203]" : "border-[#0A192F]/10 text-[#0A192F]/75")}>
      {children}
    </button>
  );
}

function Pill({ children, onClear }: { children: string; onClear: () => void }) {
  return (
    <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] shadow-sm">
      {children}
      <X className="size-3" />
    </button>
  );
}

function SheetField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0A192F]/40">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#0A192F]/15 px-3 text-sm outline-none focus:border-[#F5B942]" />
    </label>
  );
}

function formatDay(iso: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(y!, m! - 1, d!));
}
