import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Anchor, ArrowUpRight, Ship, Users, X } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Wordmark } from "@/components/Wordmark";
import { MoneyAmount, StatusBadge } from "@/components/core";
import {
  CHARTER_BASES,
  SEED_FLEET,
  buildSeedBookings,
  formatLoa,
  occupancyCell,
  parseIsoDate,
  todayIso,
  type CharterBase,
  type CharterKind,
  type OccupancyWeek,
} from "@/lib/charter-desk";
import { formatDm } from "@/lib/formatters";
import { loadListedYachts, sendInquiry } from "@/lib/charter-fleet-api";
import {
  inquiryInputError,
  openStarts,
  samplePhoto,
  upcomingSaturdays,
  type StoredYacht,
} from "@/lib/charter-fleet";

const BASE_FIX: Record<CharterBase, { lat: number; lng: number }> = {
  Göcek: { lat: 36.7531, lng: 28.9386 },
  Marmaris: { lat: 36.851, lng: 28.2742 },
  Bodrum: { lat: 37.0344, lng: 27.4305 },
  Fethiye: { lat: 36.621, lng: 29.1164 },
};

type Listing = {
  id: string;
  name: string;
  model: string;
  year: number;
  loaM: number;
  berths: number;
  cabins: number;
  base: CharterBase;
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
  const saturdays = upcomingSaturdays(now, 6);
  return SEED_FLEET.map((yacht) => ({
    id: yacht.id,
    name: yacht.name,
    model: yacht.model,
    year: yacht.year,
    loaM: yacht.loaM,
    berths: yacht.berths,
    cabins: yacht.cabins,
    base: yacht.base,
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

export function CharterCatalogue() {
  const { t, i18n } = useTranslation();
  const [base, setBase] = useState<CharterBase | "all">("all");
  const [kind, setKind] = useState<CharterKind | "all">("all");
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

  const match = (row: Listing) => (base === "all" || row.base === base) && (kind === "all" || row.kind === kind);
  const firms = live.filter(match);
  const examples = samples.filter(match);

  return (
    <div className="thalvo-dark min-h-dvh bg-[#06101c] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-5">
        <Link to="/">
          <Wordmark size="sm" className="text-white" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher tone="dark" />
          <Link to="/auth" search={{ next: "/app/charter" }} className="inline-flex h-9 items-center rounded-full bg-[#F5B942] px-4 text-xs font-semibold text-[#1a1203]">
            {t("charter.firm_entry")}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5B942]/80">{t("charter.guest_eyebrow")}</p>
        <h1 className="mt-3 max-w-2xl text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight text-white">
          {t("charter.guest_title")}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">{t("charter.guest_body")}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-[#F5B942]/30 bg-[#F5B942]/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5B942]">{t("charter.door_charter")}</p>
            <p className="mt-2 text-sm text-white/80">{t("charter.door_charter_body")}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <Link to="/services" className="block">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                {t("charter.door_service")} <ArrowUpRight className="size-3" />
              </p>
              <p className="mt-2 text-sm text-white/70">{t("charter.door_service_body")}</p>
            </Link>
            <Link to="/marketplace" className="mt-3 inline-flex text-[12px] font-semibold text-[#F5B942]">{t("charter.door_parts")}</Link>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={base === "all"} onClick={() => setBase("all")}>{t("charter.base_all")}</FilterChip>
          {CHARTER_BASES.map((name) => (
            <FilterChip key={name} active={base === name} onClick={() => setBase(name)}>{name}</FilterChip>
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          <FilterChip active={kind === "all"} onClick={() => setKind("all")}>{t("charter.status_all")}</FilterChip>
          {(["bareboat", "crewed", "cabin"] as const).map((value) => (
            <FilterChip key={value} active={kind === value} onClick={() => setKind(value)}>{t(`charter.kind_${value}`)}</FilterChip>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">{t("charter.live_heading")}</h2>
          <p className="mt-1 text-[13px] text-white/50">{t("charter.live_body")}</p>
          {firms.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-[13px] text-white/45">{t("charter.live_empty")}</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {firms.map((boat) => (
                <BoatCard key={boat.id} boat={boat} locale={i18n.language} onOpen={() => setOpen(boat)} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
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
      </main>

      {open && <BoatSheet boat={open} locale={i18n.language} onClose={() => setOpen(null)} />}
    </div>
  );
}

function BoatCard({ boat, locale, onOpen }: { boat: Listing; locale: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const photo = boat.photos[0];
  const next = boat.openWeeks[0];
  return (
    <button type="button" onClick={onOpen} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left transition-colors hover:border-[#F5B942]/40">
      <div className="relative aspect-[16/10] bg-[#0c1c30]">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-white/30"><Ship className="size-8" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06101c] to-transparent p-4 pt-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">{boat.base}</p>
          <p className="text-xl font-semibold">{boat.name}</p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-[13px] text-white/55">{boat.model} · {boat.year} · {formatLoa(boat.loaM)}</p>
        <p className="text-[13px] text-white/80">
          <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
          <span className="text-white/40"> / {t("charter.per_week")}</span>
        </p>
        {boat.yard && <p className="text-[12px] text-[#F5B942]">{t("charter.yard_note")}</p>}
        <p className="text-[12px] text-white/50">
          {next ? `${t("charter.next_open")} ${formatDay(next, locale)}` : t("charter.no_open_week")}
        </p>
      </div>
    </button>
  );
}

function BoatSheet({ boat, locale, onClose }: { boat: Listing; locale: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(0);
  const [week, setWeek] = useState(boat.openWeeks[0] ?? "");
  const [guestName, setGuestName] = useState("");
  const [contact, setContact] = useState("");
  const [party, setParty] = useState("2");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fix = BASE_FIX[boat.base];
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
      <div className="thalvo-dark max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#071422] shadow-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative aspect-[16/9] bg-[#0c1c30]">
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Ship className="size-10 text-white/30" /></div>}
          <button type="button" aria-label={t("common.close")} onClick={onClose} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/50 text-white">
            <X className="size-4" />
          </button>
        </div>
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{boat.operator} · {boat.base}</p>
            <h2 className="mt-1 text-2xl font-semibold">{boat.name}</h2>
            <p className="text-[13px] text-white/55">{boat.model} · {boat.year}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px] text-white/70">
            <span className="rounded-full border border-white/10 px-3 py-1">{formatLoa(boat.loaM)}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Anchor className="size-3" /> {boat.cabins} {t("charter.cabins")}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1"><Users className="size-3" /> {boat.berths} {t("charter.berths")}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{t(`charter.kind_${boat.kind}`)}</span>
          </div>
          <p className="font-mono text-[12px] text-white/50">{formatDm(fix.lat, fix.lng)}</p>
          <p className="text-[14px] text-white/75">{boat.skipper ? `${t("charter.skipper")}: ${boat.skipper}` : t("charter.bareboat_note")}</p>
          <p className="text-[15px]">
            <MoneyAmount value={boat.weeklyEur} currency="EUR" tone="gold" />
            <span className="text-white/40"> / {t("charter.per_week")} · {t("charter.simulated")}</span>
          </p>
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
