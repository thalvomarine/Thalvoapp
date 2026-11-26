import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Anchor, BedDouble, Minus, Plus, Ruler, Ship, Users, X } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PiriChartBackdrop } from "@/components/brand/PiriChartBackdrop";
import { CharterStayPicker } from "@/components/charter/CharterStayPicker";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Wordmark } from "@/components/Wordmark";
import { ClientOnly, MapPlaceholder } from "@/components/ClientOnly";
import { MoneyAmount, StatusBadge } from "@/components/core";
import {
  SEED_FLEET,
  buildSeedBookings,
  formatLoa,
  occupancyCell,
  parseIsoDate,
  todayIso,
  type CharterHull,
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
  stayFullyOpen,
  stayNights,
  upcomingDays,
  type CatalogueQuery,
  type CatalogueSort,
  type StoredYacht,
} from "@/lib/charter-fleet";

const CharterBaseChart = lazy(() =>
  import("@/components/charter/CharterBaseChart").then((mod) => ({ default: mod.CharterBaseChart })),
);

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
const EMBARK = "17:00";
const DISEMBARK = "09:00";
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
  weeklyEur: number;
  skipper: string | null;
  operator: string;
  photos: string[];
  openDays: string[];
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
  const days = upcomingDays(now, 42);
  const fromSeed = SEED_FLEET.map((yacht) => {
    const openDays = days.filter((iso) => {
      const week = weekOf(iso);
      if (yacht.status === "maintenance" && today >= week.startIso && today < week.endIso) return false;
      const probe = yacht.status === "on_charter" || yacht.status === "turnaround" ? { ...yacht, status: "available" as const } : yacht;
      const cell = occupancyCell(probe, week, bookings, today);
      return cell.tone === "free" || cell.tone === "service";
    });
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
      weeklyEur: yacht.weeklyFromEur,
      skipper: yacht.skipper,
      operator: "THALVO sample",
      photos: [samplePhoto(yacht.id)].filter((url): url is string => !!url),
      openDays: openDays.slice().sort(),
      yard: yacht.status === "maintenance",
      sample: true,
    };
  });
  const wider: Listing[] = [
    { id: "yt-bogaz", name: "Boğaz", model: "Motor yacht 18 m", year: 2018, loaM: 18, berths: 8, cabins: 4, base: "İstanbul", hull: "motor", weeklyEur: 9800, skipper: "Capt. Kerem Y.", operator: "THALVO sample", photos: [], openDays: days, yard: false, sample: true },
    { id: "yt-dalmatia", name: "Dalmatia", model: "Bavaria C42", year: 2021, loaM: 12.8, berths: 8, cabins: 3, base: "Split", hull: "sail", weeklyEur: 3600, skipper: null, operator: "THALVO sample", photos: [], openDays: days, yard: false, sample: true },
    { id: "yt-saronic", name: "Saronic", model: "Oceanis 46.1", year: 2022, loaM: 14.6, berths: 8, cabins: 4, base: "Atina", hull: "sail", weeklyEur: 4400, skipper: null, operator: "THALVO sample", photos: [], openDays: days, yard: false, sample: true },
    { id: "yt-palma", name: "Palma Noon", model: "Lagoon 40", year: 2023, loaM: 11.7, berths: 10, cabins: 4, base: "Palma", hull: "catamaran", weeklyEur: 6100, skipper: null, operator: "THALVO sample", photos: [], openDays: days, yard: false, sample: true },
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
    weeklyEur: yacht.weeklyEur,
    skipper: yacht.skipper,
    operator: yacht.operatorName,
    photos: yacht.photos,
    openDays: openStarts(yacht).slice().sort(),
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

function formatDay(iso: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(y!, m! - 1, d!));
}

export function CharterCatalogue() {
  const { t, i18n } = useTranslation();
  const [place, setPlace] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [party, setParty] = useState(1);
  const [minCabins, setMinCabins] = useState(1);
  const [hull, setHull] = useState<CharterHull | "all">("all");
  const [budget, setBudget] = useState<Budget>("all");
  const [sort, setSort] = useState<CatalogueSort>("open");
  const [live, setLive] = useState<Listing[]>([]);
  const [open, setOpen] = useState<Listing | null>(null);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const money = budgetRange(budget);
  const query: CatalogueQuery = { place, checkIn, checkOut, party, minCabins, ...money, hull };
  const relaxed: CatalogueQuery = { ...query, place: "" };
  const pool = [...live, ...samples];
  const exact = sortCatalogue(pool.filter((row) => catalogueMatch(row, query)), sort);
  const wider = sortCatalogue(pool.filter((row) => catalogueMatch(row, relaxed)), sort);
  const fallback = exact.length === 0 && place.trim() !== "" && wider.length > 0;
  const shown = fallback ? wider : exact;
  const firms = shown.filter((row) => !row.sample);
  const examples = shown.filter((row) => row.sample);

  const ports = useMemo(() => {
    const tally = new Map<string, { name: string; lat: number; lng: number; count: number }>();
    for (const boat of shown) {
      const fix = placeFix(boat.base);
      if (!fix) continue;
      const key = boat.base.trim().toLocaleLowerCase("tr");
      const current = tally.get(key);
      if (current) current.count += 1;
      else tally.set(key, { name: boat.base, lat: fix.lat, lng: fix.lng, count: 1 });
    }
    return [...tally.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [shown]);

  const clearAll = () => {
    setPlace("");
    setCheckIn("");
    setCheckOut("");
    setParty(1);
    setMinCabins(1);
    setHull("all");
    setBudget("all");
  };

  const filtering =
    place.trim() !== "" ||
    checkIn !== "" ||
    checkOut !== "" ||
    party > 1 ||
    minCabins > 1 ||
    hull !== "all" ||
    budget !== "all";

  const summaryBits = [
    place.trim() || t("charter.search_place"),
    checkIn && checkOut ? `${formatDay(checkIn, i18n.language)} – ${formatDay(checkOut, i18n.language)}` : t("charter.stay_label"),
    t("charter.party_count", { count: party }),
  ].join(" · ");

  const scrollToSearch = () => {
    document.getElementById("charter-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="thalvo-dark min-h-dvh bg-[#06101c] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06101c]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Wordmark size="sm" className="text-white" decorative />
            <span className="thalvo-display text-[15px] tracking-[0.2em]">THALVO</span>
          </Link>

          <button
            type="button"
            onClick={scrollToSearch}
            className={
              "hidden max-w-[min(28rem,42vw)] truncate rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[12px] text-white/70 transition-[opacity,transform] duration-300 md:block " +
              (scrolled ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0")
            }
          >
            {summaryBits}
          </button>

          <div className="flex items-center gap-2">
            <LanguageSwitcher tone="dark" />
            <Link to="/auth" search={{ next: "/app/charter" }} className="inline-flex h-9 items-center rounded-full bg-[#F5B942] px-4 text-xs font-semibold text-[#1a1203]">
              {t("charter.firm_entry")}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <PiriChartBackdrop />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06101c]/20 via-transparent to-[#06101c]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-14 sm:pt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5B942]/85 animate-[fadeUp_0.6s_ease_both]">{t("charter.guest_eyebrow")}</p>
          <h1 className="thalvo-display mt-3 max-w-3xl text-[clamp(2.8rem,9vw,5rem)] leading-[0.9] tracking-[0.04em] animate-[fadeUp_0.7s_ease_both]">
            THALVO
          </h1>
          <p className="mt-3 max-w-xl text-[clamp(1.05rem,2.4vw,1.4rem)] font-semibold tracking-wide text-[#F5B942] animate-[fadeUp_0.8s_ease_both]">
            {t("charter.guest_title")}
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 animate-[fadeUp_0.9s_ease_both]">{t("charter.guest_body")}</p>

          <form
            id="charter-search"
            className="mt-10 grid gap-3 rounded-[1.85rem] border border-white/12 bg-[#06101c]/78 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-md animate-[fadeUp_1s_ease_both] lg:grid-cols-[1.05fr_1.45fr_7rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("charter-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Field label={t("charter.search_place")}>
              <input value={place} onChange={(event) => setPlace(event.target.value)} placeholder={t("charter.search_place_ph")} className={fieldCls} />
            </Field>
            <div className="self-end">
              <CharterStayPicker
                checkIn={checkIn}
                checkOut={checkOut}
                embark={EMBARK}
                disembark={DISEMBARK}
                onChange={({ checkIn: nextIn, checkOut: nextOut }) => {
                  setCheckIn(nextIn);
                  setCheckOut(nextOut);
                }}
              />
            </div>
            <Field label={t("charter.search_party")}>
              <input type="number" min={1} max={24} value={party} onChange={(event) => setParty(Math.min(24, Math.max(1, Math.floor(Number(event.target.value) || 1))))} className={fieldCls} />
            </Field>
            <button type="submit" className="h-12 self-end rounded-2xl bg-[#F5B942] px-5 text-sm font-semibold text-[#1a1203] transition-[transform,box-shadow] duration-200 hover:scale-[1.01] hover:shadow-[0_0_0_4px_rgba(245,185,66,0.15)]">
              {t("charter.search_go")}
            </button>
          </form>
          <p className="mt-3 text-[12px] text-white/45">{t("charter.date_hint")}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("charter.door_guest_kicker")}</p>
              <p className="mt-2 text-[15px] font-semibold text-white">{t("charter.door_guest_title")}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/60">{t("charter.door_guest_body")}</p>
            </div>
            <Link
              to="/auth"
              search={{ next: "/app/charter" }}
              className="rounded-[1.25rem] border border-[#F5B942]/30 bg-[#F5B942]/10 p-4 transition-colors hover:border-[#F5B942]/55"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5B942]">{t("charter.door_owner_kicker")}</p>
              <p className="mt-2 text-[15px] font-semibold text-white">{t("charter.door_owner_title")}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/70">{t("charter.door_owner_body")}</p>
            </Link>
          </div>
        </div>
      </section>

      <main id="charter-results" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pb-16 pt-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px]">
          <div className="min-w-0 space-y-7">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00F0FF]/80">{t("charter.map_kicker")}</p>
                  <h2 className="thalvo-display mt-1 text-[1.55rem] tracking-wide">{t("charter.map_title")}</h2>
                </div>
                <p className="max-w-xs text-[12px] text-white/45">{t("charter.map_body")}</p>
              </div>
              <div className="relative z-0 mt-3 isolate">
                <ClientOnly fallback={<MapPlaceholder className="h-[220px] rounded-[1.5rem] border border-white/10 sm:h-[300px]" style={{ minHeight: 220 }} />}>
                  <Suspense fallback={<MapPlaceholder className="h-[220px] rounded-[1.5rem] border border-white/10 sm:h-[300px]" style={{ minHeight: 220 }} />}>
                    <CharterBaseChart ports={ports} active={place} onSelect={setPlace} />
                  </Suspense>
                </ClientOnly>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-white/70">{t("charter.result_count", { count: shown.length })}</p>
              {filtering && (
                <button type="button" onClick={clearAll} className="text-[12px] font-semibold text-[#F5B942]">
                  {t("charter.search_reset")}
                </button>
              )}
              <label className="ml-auto flex items-center gap-2 text-[12px] text-white/50">
                <span>{t("charter.sort_label")}</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as CatalogueSort)} className="h-9 rounded-full border border-white/15 bg-transparent px-3 text-white outline-none">
                  <option value="open">{t("charter.sort_open")}</option>
                  <option value="price">{t("charter.sort_price")}</option>
                  <option value="loa">{t("charter.sort_loa")}</option>
                </select>
              </label>
            </div>

            {fallback && (
              <p className="rounded-2xl border border-[#F5B942]/35 bg-[#F5B942]/10 px-4 py-3 text-[13px] leading-relaxed text-[#F5B942]/95">
                {t("charter.fallback_body", { place: place.trim(), count: shown.length })}
              </p>
            )}

            {shown.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center">
                <p className="text-sm text-white/65">{t("charter.no_match")}</p>
                <button type="button" onClick={clearAll} className="mt-3 text-[13px] font-semibold text-[#F5B942]">
                  {t("charter.search_reset")}
                </button>
              </div>
            )}

            {firms.length > 0 && (
              <section>
                <h2 className="thalvo-display text-[1.45rem] tracking-wide">{t("charter.live_heading")}</h2>
                <p className="mt-1 text-[13px] text-white/50">{t("charter.live_body")}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {firms.map((boat) => (
                    <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />
                  ))}
                </div>
              </section>
            )}

            {live.length === 0 && shown.length > 0 && firms.length === 0 && (
              <p className="text-[13px] text-white/45">{t("charter.live_empty")}</p>
            )}

            {examples.length > 0 && (
              <section>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="thalvo-display text-[1.45rem] tracking-wide">{t("charter.sample_heading")}</h2>
                  <StatusBadge tone="warning">{t("charter.demo_badge")}</StatusBadge>
                </div>
                <p className="mt-1 text-[13px] text-white/50">{t("charter.sample_body")}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {examples.map((boat) => (
                    <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit space-y-5 rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 lg:sticky lg:top-[4.5rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.filters")}</p>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("charter.search_cabins")}</p>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 px-2 py-1">
                <button type="button" aria-label="-" disabled={minCabins <= 1} onClick={() => setMinCabins(Math.max(1, minCabins - 1))} className="grid size-8 place-items-center rounded-lg disabled:opacity-30">
                  <Minus className="size-4" />
                </button>
                <span className="text-sm font-semibold">{minCabins}+</span>
                <button type="button" aria-label="+" disabled={minCabins >= 8} onClick={() => setMinCabins(Math.min(8, minCabins + 1))} className="grid size-8 place-items-center rounded-lg disabled:opacity-30">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("charter.field_hull")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip active={hull === "all"} onClick={() => setHull("all")}>{t("charter.hull_all")}</Chip>
                {HULLS.map((value) => (
                  <Chip key={value} active={hull === value} onClick={() => setHull(value)}>{t(`charter.hull_${value}`)}</Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("charter.budget_title")}</p>
              <div className="mt-2 flex flex-col gap-1">
                {(["all", "low", "mid", "high"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setBudget(value)} className={"rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors " + (budget === value ? "bg-[#F5B942]/20 text-[#F5B942]" : "text-white/70 hover:bg-white/5")}>
                    {t(`charter.budget_${value}`)}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <h2 className="thalvo-display text-[1.45rem] tracking-wide">{t("charter.season_title")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SeasonCard title={t("charter.season_shoulder")} body={t("charter.season_shoulder_body")} />
            <SeasonCard title={t("charter.season_fair")} body={t("charter.season_fair_body")} />
            <SeasonCard title={t("charter.season_peak")} body={t("charter.season_peak_body")} />
            <SeasonCard title={t("charter.season_quiet")} body={t("charter.season_quiet_body")} />
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="thalvo-display text-[1.45rem] tracking-wide">{t("charter.faq_title")}</h2>
          <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
            <Faq q={t("charter.faq_price_q")} a={t("charter.faq_price_a")} />
            <Faq q={t("charter.faq_stay_q")} a={t("charter.faq_stay_a")} />
            <Faq q={t("charter.faq_pay_q")} a={t("charter.faq_pay_a")} />
          </div>
        </section>

        <p className="mt-10 text-[13px] text-white/40">
          <Link to="/services" className="text-[#F5B942]">{t("charter.door_service")}</Link>
          <span> · </span>
          <Link to="/marketplace" className="text-[#F5B942]">{t("charter.door_parts")}</Link>
        </p>
      </main>

      <PublicFooter />
      {open && (
        <BoatSheet
          boat={open}
          locale={i18n.language}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setOpen(null)}
        />
      )}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const fieldCls =
  "h-12 w-full rounded-2xl border border-white/15 bg-[#06101c]/80 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#F5B942]/60";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function BoatCard({ boat, locale, onOpen }: { boat: Listing; locale: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const photo = boat.photos[0];
  const next = boat.openDays[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03] text-left transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#F5B942]/45"
    >
      <div className="relative aspect-[16/9] bg-[#0A192F]">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        ) : (
          <div className="h-full bg-[radial-gradient(circle_at_18%_80%,rgba(0,240,255,0.16),transparent_46%),linear-gradient(165deg,#0A192F,#06101c)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06101c] via-[#06101c]/25 to-transparent" />
        <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full border border-white/15 bg-[#06101c]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5B942] backdrop-blur-sm">
          {boat.sample ? t("charter.card_sample") : boat.operator}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/65">{boat.base}</p>
          <p className="thalvo-display text-[1.55rem] tracking-wide">{boat.name}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-[13px] text-white/55">{boat.model} · {boat.year}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/70">
          <span className="inline-flex items-center gap-1"><Ruler className="size-3.5 text-[#00F0FF]/80" />{formatLoa(boat.loaM)}</span>
          <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5 text-[#00F0FF]/80" />{boat.cabins} {t("charter.cabins")}</span>
          <span className="inline-flex items-center gap-1"><Users className="size-3.5 text-[#00F0FF]/80" />{boat.berths}</span>
          <span className="inline-flex items-center gap-1"><Ship className="size-3.5 text-[#00F0FF]/80" />{t(`charter.hull_${boat.hull}`)}</span>
        </p>
        {boat.skipper && <p className="text-[12px] text-white/55">{t("charter.skipper")}: {boat.skipper}</p>}
        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-3">
          <div>
            <p className="text-[15px]">
              <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
              <span className="text-white/40"> / {t("charter.per_week")}</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">{t("charter.simulated")}</p>
          </div>
          {next ? (
            <span className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
              {t("charter.next_open")} {formatDay(next, locale)}
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/40">
              {t("charter.no_open_week")}
            </span>
          )}
        </div>
        {boat.yard && <p className="text-[12px] text-[#F5B942]">{t("charter.yard_note")}</p>}
      </div>
    </button>
  );
}

function BoatSheet({
  boat,
  locale,
  checkIn: preferredIn,
  checkOut: preferredOut,
  onClose,
}: {
  boat: Listing;
  locale: string;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(0);
  const initialIn = preferredIn && preferredOut && stayFullyOpen(boat.openDays, preferredIn, preferredOut) ? preferredIn : boat.openDays[0] ?? "";
  const initialOut = preferredIn && preferredOut && stayFullyOpen(boat.openDays, preferredIn, preferredOut) ? preferredOut : "";
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [guestName, setGuestName] = useState("");
  const [contact, setContact] = useState("");
  const [party, setParty] = useState("2");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState(false);
  const fix = placeFix(boat.base);
  const src = boat.photos[photo] ?? boat.photos[0];
  const nights = stayNights(checkIn, checkOut).length;
  const openSet = useMemo(() => new Set(boat.openDays), [boat.openDays]);
  const matrixDays = useMemo(() => upcomingDays(undefined, 42), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (gallery) setGallery(false);
        else onClose();
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, gallery]);

  const submit = async () => {
    const input = { guestName, contact, party: Number(party), startIso: checkIn, endIso: checkOut, note };
    const error = inquiryInputError(input);
    if (!error && !stayFullyOpen(boat.openDays, checkIn, checkOut)) {
      toast.error(t("charter.inquiry_need_dates"));
      return;
    }
    if (error) {
      const key =
        error === "name"
          ? "inquiry_need_name"
          : error === "contact"
            ? "inquiry_need_contact"
            : error === "party"
              ? "inquiry_need_party"
              : error === "dates"
                ? "inquiry_need_dates"
                : "inquiry_invalid";
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

  const command = (
    <div className="space-y-4 rounded-[1.35rem] border border-[#F5B942]/25 bg-[#0A192F]/90 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
      <div>
        <p className="text-[15px]">
          <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
          <span className="text-white/45"> / {t("charter.per_week")}</span>
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/35">{t("charter.simulated")}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/70">{t("charter.include_rate")}</p>
        {nights > 0 && <p className="mt-2 text-[12px] text-[#00F0FF]/90">{t("charter.nights_count", { count: nights })}</p>}
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.stay_label")}</p>
        <CharterStayPicker
          checkIn={checkIn}
          checkOut={checkOut}
          openDays={boat.openDays}
          embark={EMBARK}
          disembark={DISEMBARK}
          onChange={({ checkIn: nextIn, checkOut: nextOut }) => {
            setCheckIn(nextIn);
            setCheckOut(nextOut);
          }}
        />
      </div>
      <div className="grid gap-2">
        <SheetField label={t("charter.field_name")} value={guestName} onChange={setGuestName} />
        <SheetField label={t("charter.field_contact")} value={contact} onChange={setContact} />
        <SheetField label={t("charter.field_party")} value={party} onChange={setParty} />
        <SheetField label={t("charter.field_note")} value={note} onChange={setNote} />
      </div>
      <button type="button" disabled={busy || !checkIn || !checkOut} onClick={() => void submit()} className="h-12 w-full rounded-full bg-[#F5B942] text-sm font-semibold text-[#1a1203] transition-opacity disabled:opacity-40">
        {t("charter.ask_week")}
      </button>
      <p className="text-[11px] leading-relaxed text-white/40">{boat.sample ? t("charter.sample_note") : t("charter.inquiry_note")}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5" onClick={onClose}>
      <div
        className="thalvo-dark relative z-[1201] flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.6rem] border border-white/10 bg-[#071422] shadow-2xl sm:rounded-[1.6rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0 bg-[#0A192F]">
          {src ? (
            <button type="button" className="block w-full" onClick={() => boat.photos.length > 0 && setGallery(true)}>
              <div className="aspect-[16/8]"><img src={src} alt="" className="h-full w-full object-cover" /></div>
            </button>
          ) : (
            <div className="flex h-40 items-end bg-[radial-gradient(circle_at_18%_80%,rgba(0,240,255,0.16),transparent_46%),linear-gradient(165deg,#0A192F,#06101c)] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00F0FF]/80">{t(`charter.hull_${boat.hull}`)}</p>
                <p className="thalvo-display text-[2rem] tracking-wide">{boat.name}</p>
              </div>
            </div>
          )}
          <button type="button" aria-label={t("common.close")} onClick={onClose} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/70 text-white">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-h-0 space-y-5 overflow-y-auto p-5">
            {boat.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {boat.photos.map((url, index) => (
                  <button key={url} type="button" onClick={() => setPhoto(index)} className={"h-14 w-20 shrink-0 overflow-hidden rounded-lg border " + (index === photo ? "border-[#F5B942]" : "border-white/10")}>
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{boat.sample ? t("charter.card_sample") : boat.operator} · {boat.base}</p>
              <h2 className="thalvo-display mt-1 text-[2rem] tracking-wide">{boat.name}</h2>
              <p className="text-[13px] text-white/55">{boat.model} · {boat.year}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px] text-white/70">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Ruler className="size-3" />{formatLoa(boat.loaM)}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Anchor className="size-3" />{boat.cabins} {t("charter.cabins")}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Users className="size-3" />{boat.berths} {t("charter.berths")}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">{t(`charter.hull_${boat.hull}`)}</span>
            </div>
            {fix && <p className="font-mono text-[12px] text-white/50">{formatDm(fix.lat, fix.lng)}</p>}
            {boat.skipper && <p className="text-[14px] text-white/75">{t("charter.skipper")}: {boat.skipper}</p>}

            <OpenDaysBoard
              days={matrixDays}
              openSet={openSet}
              checkIn={checkIn}
              checkOut={checkOut}
              locale={locale}
              onPick={(iso) => {
                if (!openSet.has(iso)) return;
                if (!checkIn || (checkIn && checkOut)) {
                  setCheckIn(iso);
                  setCheckOut("");
                  return;
                }
                if (iso <= checkIn) {
                  setCheckIn(iso);
                  setCheckOut("");
                  return;
                }
                setCheckOut(iso);
              }}
            />

            <div className="lg:hidden">{command}</div>
          </div>

          <aside className="hidden min-h-0 overflow-y-auto border-l border-white/10 bg-[#06101c]/70 p-4 lg:block">
            {command}
          </aside>
        </div>
      </div>

      {gallery && src && (
        <div className="fixed inset-0 z-[1300] flex bg-black/90" onClick={() => setGallery(false)}>
          <div className="relative m-auto flex max-h-[92dvh] w-full max-w-5xl flex-col gap-3 p-4 lg:flex-row" onClick={(event) => event.stopPropagation()}>
            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl">
              <img src={boat.photos[photo] ?? src} alt="" className="max-h-[70dvh] w-full object-contain" />
              {boat.photos.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {boat.photos.map((url, index) => (
                    <button key={url} type="button" onClick={() => setPhoto(index)} className={"h-16 w-24 shrink-0 overflow-hidden rounded-lg border " + (index === photo ? "border-[#F5B942]" : "border-white/20")}>
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full shrink-0 lg:w-72">{command}</div>
            <button type="button" aria-label={t("common.close")} onClick={() => setGallery(false)} className="absolute right-6 top-6 grid size-9 place-items-center rounded-full bg-black/70 text-white">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OpenDaysBoard({
  days,
  openSet,
  checkIn,
  checkOut,
  locale,
  onPick,
}: {
  days: string[];
  openSet: Set<string>;
  checkIn: string;
  checkOut: string;
  locale: string;
  onPick: (iso: string) => void;
}) {
  const { t } = useTranslation();
  const today = todayIso();
  const months = useMemo(() => {
    const groups: Array<{ key: string; label: string; days: string[] }> = [];
    for (const iso of days) {
      const key = iso.slice(0, 7);
      const last = groups[groups.length - 1];
      if (!last || last.key !== key) {
        const [y, m] = iso.split("-").map(Number);
        const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
        groups.push({
          key,
          label: new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(new Date(y!, m! - 1, 1)),
          days: [iso],
        });
      } else {
        last.days.push(iso);
      }
    }
    return groups;
  }, [days, locale]);

  const openCount = days.filter((iso) => openSet.has(iso)).length;
  const closedCount = days.length - openCount;

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.open_days")}</p>
          <p className="mt-1 text-[13px] text-white/65">{t("charter.matrix_hint")}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <LegendSwatch className="bg-emerald-400/90" label={t("charter.day_open", { count: openCount })} />
          <LegendSwatch className="bg-[#F5B942]" label={t("charter.day_selected")} />
          <LegendSwatch className="bg-white/15 ring-1 ring-inset ring-white/20" label={t("charter.day_closed", { count: closedCount })} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {months.map((month) => (
          <div key={month.key}>
            <p className="mb-2 text-[12px] font-semibold capitalize tracking-wide text-[#00F0FF]/85">{month.label}</p>
            <div className="grid grid-cols-7 gap-1.5">
              {month.days.map((iso) => {
                const openDay = openSet.has(iso);
                const inStay = Boolean(checkIn && checkOut && iso >= checkIn && iso < checkOut);
                const isEdge = iso === checkIn || iso === checkOut;
                const isToday = iso === today;
                const dayNum = Number(iso.slice(8));
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!openDay}
                    title={iso}
                    onClick={() => onPick(iso)}
                    className={
                      "relative grid aspect-square place-items-center rounded-lg text-[11px] font-semibold transition-[transform,background-color,color,box-shadow] duration-150 " +
                      (isEdge
                        ? "bg-[#F5B942] text-[#1a1203] shadow-[0_0_0_1px_rgba(245,185,66,0.55)] "
                        : inStay
                          ? "bg-[#F5B942]/25 text-[#F5B942] "
                          : openDay
                            ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-inset ring-emerald-300/35 hover:bg-emerald-400/25 hover:text-white "
                            : "cursor-not-allowed bg-white/[0.03] text-white/25 line-through decoration-white/25 ") +
                      (isToday && !isEdge ? "ring-1 ring-[#00F0FF]/70 " : "")
                    }
                  >
                    {dayNum}
                    {isToday && !isEdge && (
                      <span className="absolute inset-x-[30%] bottom-1 h-0.5 rounded-full bg-[#00F0FF]/80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/55">
      <span className={"size-2.5 rounded-sm " + className} />
      {label}
    </span>
  );
}

function SeasonCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F5B942]">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/65">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="py-3">
      <summary className="cursor-pointer text-[14px] font-semibold text-white/90">{q}</summary>
      <p className="mt-2 text-[13px] leading-relaxed text-white/60">{a}</p>
    </details>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={"rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors " + (active ? "border-[#F5B942]/60 bg-[#F5B942]/15 text-[#F5B942]" : "border-white/10 text-white/70")}>
      {children}
    </button>
  );
}

function SheetField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#F5B942]/50" />
    </label>
  );
}
