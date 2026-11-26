import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Anchor, Users, X } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Wordmark } from "@/components/Wordmark";
import { MoneyAmount, StatusBadge } from "@/components/core";
import {
  SEED_FLEET,
  buildSeedBookings,
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

export function CharterCatalogue() {
  const { t, i18n } = useTranslation();
  const [place, setPlace] = useState("");
  const [week, setWeek] = useState("");
  const [party, setParty] = useState(1);
  const [hull, setHull] = useState<CharterHull | "all">("all");
  const [kind, setKind] = useState<CharterKind | "all">("all");
  const [sort, setSort] = useState<CatalogueSort>("open");
  const [live, setLive] = useState<Listing[]>([]);
  const [open, setOpen] = useState<Listing | null>(null);
  const saturdays = useMemo(() => upcomingSaturdays(undefined, 8), []);
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

  const query: CatalogueQuery = { place, week, party, hull, kind };
  const firms = sortCatalogue(live.filter((row) => catalogueMatch(row, query)), sort);
  const examples = sortCatalogue(samples.filter((row) => catalogueMatch(row, query)), sort);
  const total = firms.length + examples.length;
  const filtering = place.trim() !== "" || week !== "" || party > 1 || hull !== "all" || kind !== "all";

  const reset = () => {
    setPlace("");
    setWeek("");
    setParty(1);
    setHull("all");
    setKind("all");
  };

  return (
    <div className="thalvo-dark min-h-dvh bg-[#06101c] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06101c]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Wordmark size="sm" className="text-white" />
            <span className="hidden text-[12px] font-semibold tracking-[0.18em] text-white/70 sm:inline">CHARTER</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher tone="dark" />
            <Link to="/auth" search={{ next: "/app/charter" }} className="inline-flex h-9 items-center rounded-full bg-[#F5B942] px-4 text-xs font-semibold text-[#1a1203]">
              {t("charter.firm_entry")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-8 pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5B942]/80">{t("charter.guest_eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2.1rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight">
          {t("charter.guest_title")}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">{t("charter.guest_body")}</p>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.search_place")}</span>
              <input
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                placeholder={t("charter.search_place_ph")}
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#06101c] px-3 text-sm outline-none placeholder:text-white/30 focus:border-[#F5B942]/60"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.search_week")}</span>
              <select
                value={week}
                onChange={(event) => setWeek(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#06101c] px-3 text-sm outline-none focus:border-[#F5B942]/60"
              >
                <option value="">{t("charter.search_week_any")}</option>
                {saturdays.map((iso) => (
                  <option key={iso} value={iso}>{formatDay(iso, i18n.language)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.search_party")}</span>
              <input
                type="number"
                min={1}
                max={24}
                value={party}
                onChange={(event) => setParty(Math.min(24, Math.max(1, Number(event.target.value) || 1)))}
                className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#06101c] px-3 text-sm outline-none focus:border-[#F5B942]/60"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={hull === "all"} onClick={() => setHull("all")}>{t("charter.hull_all")}</FilterChip>
            {HULLS.map((value) => (
              <FilterChip key={value} active={hull === value} onClick={() => setHull(value)}>{t(`charter.hull_${value}`)}</FilterChip>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FilterChip active={kind === "all"} onClick={() => setKind("all")}>{t("charter.status_all")}</FilterChip>
            {KINDS.map((value) => (
              <FilterChip key={value} active={kind === value} onClick={() => setKind(value)}>{t(`charter.kind_${value}`)}</FilterChip>
            ))}
            {filtering && (
              <button type="button" onClick={reset} className="ml-auto text-[12px] font-semibold text-[#F5B942]">
                {t("charter.search_reset")}
              </button>
            )}
          </div>
        </section>

        <div className="mt-8 flex items-end justify-between gap-3">
          <p className="text-sm text-white/70">{t("charter.result_count", { count: total })}</p>
          <label className="flex items-center gap-2 text-[12px] text-white/50">
            <span>{t("charter.sort_label")}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogueSort)}
              className="h-9 rounded-full border border-white/10 bg-transparent px-3 text-white outline-none"
            >
              <option value="open">{t("charter.sort_open")}</option>
              <option value="price">{t("charter.sort_price")}</option>
              <option value="loa">{t("charter.sort_loa")}</option>
            </select>
          </label>
        </div>

        {total === 0 && (
          <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-[13px] text-white/45">{t("charter.no_match")}</p>
        )}

        {firms.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">{t("charter.live_heading")}</h2>
            <p className="mt-1 text-[13px] text-white/50">{t("charter.live_body")}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {firms.map((boat) => (
                <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />
              ))}
            </div>
          </section>
        )}

        {live.length === 0 && !filtering && (
          <p className="mt-6 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-[13px] text-white/45">{t("charter.live_empty")}</p>
        )}

        {examples.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("charter.sample_heading")}</h2>
              <StatusBadge tone="warning">{t("charter.demo_badge")}</StatusBadge>
            </div>
            <p className="mt-1 max-w-xl text-[13px] text-white/50">{t("charter.sample_body")}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {examples.map((boat) => (
                <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14">
          <h2 className="text-lg font-semibold">{t("charter.season_title")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SeasonCard title={t("charter.season_shoulder")} body={t("charter.season_shoulder_body")} />
            <SeasonCard title={t("charter.season_fair")} body={t("charter.season_fair_body")} />
            <SeasonCard title={t("charter.season_peak")} body={t("charter.season_peak_body")} />
            <SeasonCard title={t("charter.season_quiet")} body={t("charter.season_quiet_body")} />
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-lg font-semibold">{t("charter.faq_title")}</h2>
          <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
            <Faq q={t("charter.faq_price_q")} a={t("charter.faq_price_a")} />
            <Faq q={t("charter.faq_licence_q")} a={t("charter.faq_licence_a")} />
            <Faq q={t("charter.faq_saturday_q")} a={t("charter.faq_saturday_a")} />
            <Faq q={t("charter.faq_pay_q")} a={t("charter.faq_pay_a")} />
          </div>
        </section>

        <p className="mt-10 text-[13px] text-white/45">
          <Link to="/services" className="text-[#F5B942]">{t("charter.door_service")}</Link>
          <span> · </span>
          <Link to="/marketplace" className="text-[#F5B942]">{t("charter.door_parts")}</Link>
        </p>
      </main>

      <PublicFooter />
      {open && <BoatSheet boat={open} locale={i18n.language} preferredWeek={week} onClose={() => setOpen(null)} />}
    </div>
  );
}

function BoatCard({ boat, locale, onOpen }: { boat: Listing; locale: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const photo = boat.photos[0];
  const next = boat.openWeeks[0];
  return (
    <button type="button" onClick={onOpen} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left transition-colors hover:border-[#F5B942]/50">
      <div className="relative aspect-[16/10] bg-[#0A192F]">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="h-full bg-[radial-gradient(circle_at_18%_80%,rgba(0,240,255,0.16),transparent_46%),linear-gradient(165deg,#0A192F,#06101c)]" />
        )}
        <div className="absolute left-3 top-3 max-w-[70%]">
          <span className="inline-block truncate rounded-full border border-white/20 bg-[#06101c]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5B942] shadow-sm backdrop-blur-sm">
            {boat.sample ? t("charter.card_sample") : boat.operator}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06101c] via-[#06101c]/70 to-transparent p-4 pt-14">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">{boat.base}</p>
          <p className="text-xl font-semibold">{boat.name}</p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-[13px] text-white/55">{boat.model} · {boat.year} · {formatLoa(boat.loaM)}</p>
        <p className="text-[12px] text-white/70">
          {t(`charter.hull_${boat.hull}`)} · {t(`charter.kind_${boat.kind}`)} · {boat.cabins} {t("charter.cabins")} · {boat.berths} {t("charter.berths")}
        </p>
        <p className="text-[15px]">
          <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
          <span className="text-white/40"> / {t("charter.per_week")} · {t("charter.simulated")}</span>
        </p>
        <p className="text-[12px] leading-relaxed text-white/55">{t(`charter.include_${boat.kind}`)}</p>
        {boat.yard && <p className="text-[12px] text-[#F5B942]">{t("charter.yard_note")}</p>}
        <p className="text-[12px] text-white/50">
          {next ? `${t("charter.next_open")} ${formatDay(next, locale)} · ${t("charter.open_count", { count: boat.openWeeks.length })}` : t("charter.no_open_week")}
        </p>
      </div>
    </button>
  );
}

function BoatSheet({ boat, locale, preferredWeek, onClose }: { boat: Listing; locale: string; preferredWeek: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(0);
  const [week, setWeek] = useState(preferredWeek && boat.openWeeks.includes(preferredWeek) ? preferredWeek : boat.openWeeks[0] ?? "");
  const [guestName, setGuestName] = useState("");
  const [contact, setContact] = useState("");
  const [party, setParty] = useState("2");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fix = placeFix(boat.base);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const src = boat.photos[photo] ?? boat.photos[0];

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
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="thalvo-dark flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#071422] shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative shrink-0 bg-[#0A192F]">
          {src ? (
            <div className="aspect-[16/9]">
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-36 items-end bg-[radial-gradient(circle_at_18%_80%,rgba(0,240,255,0.16),transparent_46%),linear-gradient(165deg,#0A192F,#06101c)] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00F0FF]/80">{t(`charter.hull_${boat.hull}`)}</p>
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
              <button key={url} type="button" onClick={() => setPhoto(index)} className={"h-14 w-20 shrink-0 overflow-hidden rounded-lg border " + (index === photo ? "border-[#F5B942]" : "border-white/10")}>
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="space-y-4 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{boat.sample ? t("charter.card_sample") : boat.operator} · {boat.base}</p>
            <h2 className="mt-1 text-2xl font-semibold">{boat.name}</h2>
            <p className="text-[13px] text-white/55">{boat.model} · {boat.year}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px] text-white/70">
            <span className="rounded-full border border-white/10 px-3 py-1">{formatLoa(boat.loaM)}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Anchor className="size-3" /> {boat.cabins} {t("charter.cabins")}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Users className="size-3" /> {boat.berths} {t("charter.berths")}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{t(`charter.hull_${boat.hull}`)}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{t(`charter.kind_${boat.kind}`)}</span>
          </div>
          {fix && <p className="font-mono text-[12px] text-white/50">{formatDm(fix.lat, fix.lng)}</p>}
          <p className="text-[14px] text-white/75">{boat.skipper ? `${t("charter.skipper")}: ${boat.skipper}` : t("charter.bareboat_note")}</p>
          <div className="rounded-2xl border border-[#F5B942]/30 bg-[#F5B942]/10 p-4">
            <p className="text-[15px]">
              <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
              <span className="text-white/50"> / {t("charter.per_week")} · {t("charter.simulated")}</span>
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/75">{t(`charter.include_${boat.kind}`)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.open_days")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {boat.openWeeks.length === 0 && <p className="text-[13px] text-white/45">{t("charter.no_open_week")}</p>}
              {boat.openWeeks.map((iso) => (
                <button key={iso} type="button" onClick={() => setWeek(iso)} className={"rounded-full border px-3 py-1.5 text-[12px] " + (week === iso ? "border-[#F5B942] bg-[#F5B942]/15 text-[#F5B942]" : "border-white/10 text-white/70")}>
                  {formatDay(iso, locale)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t("charter.field_name")} value={guestName} onChange={setGuestName} />
            <Field label={t("charter.field_contact")} value={contact} onChange={setContact} />
            <Field label={t("charter.field_party")} value={party} onChange={setParty} />
            <Field label={t("charter.field_note")} value={note} onChange={setNote} />
          </div>
          <button type="button" disabled={busy || !week} onClick={() => void submit()} className="h-11 w-full rounded-full bg-[#F5B942] text-sm font-semibold text-[#1a1203] disabled:opacity-40">
            {t("charter.ask_week")}
          </button>
          <p className="text-[11px] leading-relaxed text-white/40">{boat.sample ? t("charter.sample_note") : t("charter.inquiry_note")}</p>
        </div>
        </div>
      </div>
    </div>
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
    <details className="group py-3">
      <summary className="cursor-pointer list-none text-[14px] font-semibold text-white/90">{q}</summary>
      <p className="mt-2 text-[13px] leading-relaxed text-white/60">{a}</p>
    </details>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={"shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold " + (active ? "border-[#F5B942]/60 bg-[#F5B942]/15 text-[#F5B942]" : "border-white/10 text-white/70")}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#F5B942]/50" />
    </label>
  );
}

function formatDay(iso: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(y!, m! - 1, d!));
}
