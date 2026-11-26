import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Anchor, Ship, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  CockpitHeader,
  CockpitPage,
  DataPill,
  EmptyState,
  MetricCard,
  MoneyAmount,
  StatusBadge,
} from "@/components/core";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { formatDm } from "@/lib/formatters";
import {
  CHARTER_BASES,
  SEED_FLEET,
  SEED_INQUIRIES,
  bookingNights,
  buildSeedBookings,
  buildWeekStrip,
  filterBookings,
  filterFleet,
  fleetStats,
  formatLoa,
  todayIso,
  todaysOps,
  yachtById,
  type BookingStatus,
  type CharterBase,
  type CharterBooking,
  type CharterInquiry,
  type CharterKind,
  type InquiryStatus,
  type YachtStatus,
} from "@/lib/charter-desk";

const BASE_FIX: Record<CharterBase, { lat: number; lng: number }> = {
  Göcek: { lat: 36.7531, lng: 28.9386 },
  Marmaris: { lat: 36.851, lng: 28.2742 },
  Bodrum: { lat: 37.0344, lng: 27.4305 },
  Fethiye: { lat: 36.621, lng: 29.1164 },
};

const YACHT_TONE: Record<YachtStatus, "success" | "info" | "warning" | "danger"> = {
  available: "success",
  on_charter: "info",
  turnaround: "warning",
  maintenance: "danger",
};

const BOOKING_TONE: Record<BookingStatus, "success" | "info" | "warning" | "neutral" | "danger"> = {
  confirmed: "info",
  checked_in: "success",
  checked_out: "neutral",
  option: "warning",
  cancelled: "danger",
};

const INQUIRY_TONE: Record<InquiryStatus, "info" | "warning" | "success" | "neutral" | "danger"> = {
  new: "info",
  quoted: "warning",
  hold: "warning",
  won: "success",
  lost: "danger",
};

type Tab = "today" | "fleet" | "bookings" | "inquiries";
type YachtFilter = YachtStatus | "all";

export function CharterDesk() {
  const { t, i18n } = useTranslation();
  const [base, setBase] = useState<CharterBase | "all">("all");
  const [tab, setTab] = useState<Tab>("today");
  const [dayIso, setDayIso] = useState<string | null>(null);
  const [yachtFilter, setYachtFilter] = useState<YachtFilter>("all");
  const [openYacht, setOpenYacht] = useState<string | null>(null);
  const [bookings, setBookings] = useState<CharterBooking[]>(() => buildSeedBookings());
  const [fleetRows, setFleetRows] = useState(SEED_FLEET);
  const [inquiries, setInquiries] = useState<CharterInquiry[]>(SEED_INQUIRIES);

  const today = todayIso();
  const stats = fleetStats(filterFleet(fleetRows, base, "all"));
  const week = useMemo(() => buildWeekStrip(bookings, fleetRows), [bookings, fleetRows]);
  const scopedBookings = filterBookings(bookings, base, null);
  const dayBookings = filterBookings(bookings, base, dayIso);
  const ops = todaysOps(scopedBookings, today);
  const fleet = filterFleet(fleetRows, base, yachtFilter);
  const yacht = openYacht ? yachtById(fleetRows, openYacht) : undefined;
  const yachtBooking = yacht
    ? bookings.find((b) => b.yachtId === yacht.id && b.status !== "cancelled" && b.status !== "checked_out")
    : undefined;
  const openInquiries = inquiries.filter((q) => q.status === "new" || q.status === "quoted" || q.status === "hold");

  const checkIn = (booking: CharterBooking) => {
    setBookings((rows) =>
      rows.map((row) => (row.id === booking.id ? { ...row, status: "checked_in" } : row)),
    );
    setFleetRows((rows) =>
      rows.map((row) =>
        row.id === booking.yachtId && row.status === "available" ? { ...row, status: "on_charter" } : row,
      ),
    );
    toast.success(t("charter.check_in_done", { guest: booking.guest }));
  };

  const quoteInquiry = (id: string) => {
    setInquiries((rows) => rows.map((row) => (row.id === id && row.status === "new" ? { ...row, status: "quoted" } : row)));
    toast.success(t("charter.quote_done"));
  };

  return (
    <CockpitPage
      header={
        <CockpitHeader
          eyebrow={t("charter.eyebrow")}
          title={t("charter.title")}
          subtitle={t("charter.subtitle")}
          actions={
            <StatusBadge tone="warning">{t("charter.demo_badge")}</StatusBadge>
          }
        />
      }
    >
      <GlassPanel className="border-amber-400/25 bg-amber-400/[0.06]">
        <p className="text-[12px] leading-relaxed text-amber-100/90">{t("charter.demo_note")}</p>
      </GlassPanel>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={base === "all"} onClick={() => setBase("all")}>
          {t("charter.base_all")}
        </Chip>
        {CHARTER_BASES.map((name) => (
          <Chip key={name} active={base === name} onClick={() => setBase(name)}>
            {name}
          </Chip>
        ))}
      </div>

      {base !== "all" && (
        <p className="font-mono text-[11px] tracking-wide text-white/55">{formatDm(BASE_FIX[base].lat, BASE_FIX[base].lng)}</p>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MetricCard label={t("charter.stat_on_charter")} value={stats.onCharter} tone="info" hint={t("charter.stat_on_charter_hint")} />
        <MetricCard label={t("charter.stat_available")} value={stats.available} tone="success" hint={t("charter.stat_available_hint")} />
        <MetricCard label={t("charter.stat_turnaround")} value={stats.turnaround + stats.maintenance} tone="warning" hint={t("charter.stat_turnaround_hint")} />
        <MetricCard label={t("charter.stat_inquiries")} value={openInquiries.length} tone="warning" hint={t("charter.stat_inquiries_hint")} />
      </div>

      <GlassPanel padded={false} className="p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">{t("charter.week_label")}</p>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((cell) => {
            const selected = dayIso === cell.iso;
            const isToday = cell.iso === today;
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => {
                  setDayIso(selected ? null : cell.iso);
                  if (!selected) setTab("bookings");
                }}
                className={
                  "rounded-xl border px-1 py-2 text-center transition-colors " +
                  (selected
                    ? "border-amber-300/60 bg-amber-400/15"
                    : isToday
                      ? "border-cyan-300/40 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                }
              >
                <p className="text-[9px] uppercase tracking-wider text-white/45">{weekdayLabel(cell.iso, i18n.language)}</p>
                <p className="text-sm font-semibold tabular-nums text-white">{cell.label}</p>
                <p className="mt-1 text-[9px] tabular-nums text-white/50">
                  {cell.checkIns}/{cell.checkOuts}
                </p>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      <div className="flex gap-2 overflow-x-auto">
        {(["today", "fleet", "bookings", "inquiries"] as const).map((key) => (
          <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
            {t(`charter.tab_${key}`)}
          </Chip>
        ))}
      </div>

      {tab === "today" && (
        <div className="grid gap-3 lg:grid-cols-3">
          <OpsColumn fleet={fleetRows} title={t("charter.col_checkin")} emptyTitle={t("charter.empty_checkin_title")} emptyBody={t("charter.empty_checkin_body")} rows={ops.checkIns} onOpen={setOpenYacht} onCheckIn={checkIn} />
          <OpsColumn fleet={fleetRows} title={t("charter.col_active")} emptyTitle={t("charter.empty_active_title")} emptyBody={t("charter.empty_active_body")} rows={ops.active} onOpen={setOpenYacht} />
          <OpsColumn fleet={fleetRows} title={t("charter.col_checkout")} emptyTitle={t("charter.empty_checkout_title")} emptyBody={t("charter.empty_checkout_body")} rows={ops.checkOuts} onOpen={setOpenYacht} />
        </div>
      )}

      {tab === "fleet" && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "available", "on_charter", "turnaround", "maintenance"] as const).map((key) => (
              <Chip key={key} active={yachtFilter === key} onClick={() => setYachtFilter(key)}>
                {key === "all" ? t("charter.status_all") : t(`charter.yacht_${key}`)}
              </Chip>
            ))}
          </div>
          {fleet.length === 0 ? (
            <EmptyState icon={<Ship className="size-4" />} title={t("charter.empty_fleet_title")} body={t("charter.empty_fleet_body")} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {fleet.map((boat) => (
                <button key={boat.id} type="button" onClick={() => setOpenYacht(boat.id)} className="text-left">
                  <GlassPanel className="h-full transition-colors hover:border-amber-300/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{boat.name}</p>
                        <p className="text-[12px] text-white/55">{boat.model} · {boat.year}</p>
                      </div>
                      <StatusBadge tone={YACHT_TONE[boat.status]}>{t(`charter.yacht_${boat.status}`)}</StatusBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <DataPill label={t("charter.loa")} value={formatLoa(boat.loaM)} />
                      <DataPill label={t("charter.cabins")} value={String(boat.cabins)} />
                      <DataPill icon={<Users className="size-3" />} label={t("charter.berths")} value={String(boat.berths)} />
                      <DataPill label={boat.base} />
                    </div>
                    <p className="mt-3 text-[12px] text-white/70">
                      {t("charter.from_week")} <MoneyAmount value={boat.weeklyFromEur} currency="EUR" tone="gold" />
                      <span className="text-white/40"> · {t(`charter.kind_${boat.kind}`)}</span>
                    </p>
                  </GlassPanel>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <BookingList
          fleet={fleetRows}
          rows={dayIso ? dayBookings : scopedBookings}
          emptyTitle={t("charter.empty_bookings_title")}
          emptyBody={dayIso ? t("charter.empty_bookings_day_body") : t("charter.empty_bookings_body")}
          onOpen={setOpenYacht}
          locale={i18n.language}
        />
      )}

      {tab === "inquiries" && (
        <div className="space-y-2">
          {inquiries.map((row) => (
            <GlassPanel key={row.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{row.guest}</p>
                  <p className="text-[12px] text-white/55">{row.from} · {row.dates}</p>
                  <p className="mt-1 text-[12px] text-white/70">{row.yachtHint}</p>
                </div>
                <StatusBadge tone={INQUIRY_TONE[row.status]}>{t(`charter.inquiry_${row.status}`)}</StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DataPill label={t(`charter.channel_${row.channel}`)} />
                <MoneyAmount value={row.valueEur} currency="EUR" className="text-[13px]" />
                {row.status === "new" && (
                  <button
                    type="button"
                    onClick={() => quoteInquiry(row.id)}
                    className="ml-auto rounded-full border border-amber-300/40 px-3 py-1 text-[11px] font-semibold text-amber-100"
                  >
                    {t("charter.quote_action")}
                  </button>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {yacht && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setOpenYacht(null)}>
          <div
            className="thalvo-dark w-full max-w-md rounded-3xl border border-white/10 bg-[#071422] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">{yacht.base}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{yacht.name}</h2>
                <p className="text-[12px] text-white/55">{yacht.model} · {yacht.year} · {formatLoa(yacht.loaM)}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setOpenYacht(null)} className="grid size-8 place-items-center rounded-full border border-white/10 text-white/70">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusBadge tone={YACHT_TONE[yacht.status]}>{t(`charter.yacht_${yacht.status}`)}</StatusBadge>
              <DataPill label={t(`charter.kind_${yacht.kind as CharterKind}`)} />
              <DataPill icon={<Anchor className="size-3" />} label={t("charter.cabins")} value={String(yacht.cabins)} />
            </div>
            <p className="mt-3 font-mono text-[11px] text-white/55">{formatDm(BASE_FIX[yacht.base].lat, BASE_FIX[yacht.base].lng)}</p>
            <p className="mt-3 text-[13px] text-white/75">
              {yacht.skipper ? `${t("charter.skipper")}: ${yacht.skipper}` : t("charter.bareboat_note")}
            </p>
            <p className="mt-2 text-[13px] text-white/80">
              {t("charter.from_week")} <MoneyAmount value={yacht.weeklyFromEur} currency="EUR" tone="gold" />
              <span className="text-white/40"> · {t("charter.simulated")}</span>
            </p>
            {yachtBooking && (
              <GlassPanel className="mt-3 p-3">
                <p className="text-[12px] font-semibold text-white">{yachtBooking.guest}</p>
                <p className="text-[11px] text-white/55">{yachtBooking.ref} · {yachtBooking.baseOut} → {yachtBooking.baseIn}</p>
                <p className="mt-1 text-[11px] text-white/55">{bookingNights(yachtBooking)} {t("charter.nights")} · {yachtBooking.party} {t("charter.party")}</p>
              </GlassPanel>
            )}
          </div>
        </div>
      )}
    </CockpitPage>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors " +
        (active
          ? "border-amber-300/50 bg-amber-400/15 text-amber-50"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]")
      }
    >
      {children}
    </button>
  );
}

function OpsColumn({
  fleet,
  title,
  rows,
  emptyTitle,
  emptyBody,
  onOpen,
  onCheckIn,
}: {
  fleet: typeof SEED_FLEET;
  title: string;
  rows: CharterBooking[];
  emptyTitle: string;
  emptyBody: string;
  onOpen: (id: string) => void;
  onCheckIn?: (booking: CharterBooking) => void;
}) {
  const { t } = useTranslation();
  return (
    <GlassPanel className="min-h-40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{title}</p>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} />
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((booking) => {
            const boat = yachtById(fleet, booking.yachtId);
            return (
              <li key={booking.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <button type="button" className="w-full text-left" onClick={() => boat && onOpen(boat.id)}>
                  <p className="text-[13px] font-semibold text-white">{booking.guest}</p>
                  <p className="text-[11px] text-white/55">{boat?.name} · {booking.ref}</p>
                  <div className="mt-2">
                    <StatusBadge tone={BOOKING_TONE[booking.status]}>{t(`charter.booking_${booking.status}`)}</StatusBadge>
                  </div>
                </button>
                {onCheckIn && booking.status === "confirmed" && (
                  <button
                    type="button"
                    onClick={() => onCheckIn(booking)}
                    className="mt-2 rounded-full bg-amber-400/90 px-3 py-1 text-[11px] font-semibold text-[#1a1203]"
                  >
                    {t("charter.check_in_action")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}

function BookingList({
  fleet,
  rows,
  emptyTitle,
  emptyBody,
  onOpen,
  locale,
}: {
  fleet: typeof SEED_FLEET;
  rows: CharterBooking[];
  emptyTitle: string;
  emptyBody: string;
  onOpen: (id: string) => void;
  locale: string;
}) {
  const { t } = useTranslation();
  if (rows.length === 0) return <EmptyState icon={<Ship className="size-4" />} title={emptyTitle} body={emptyBody} />;
  return (
    <div className="space-y-2">
      {rows.map((booking) => {
        const boat = yachtById(fleet, booking.yachtId);
        return (
          <button key={booking.id} type="button" className="block w-full text-left" onClick={() => boat && onOpen(boat.id)}>
            <GlassPanel>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{booking.guest}</p>
                  <p className="text-[12px] text-white/55">
                    {boat?.name} · {booking.baseOut} → {booking.baseIn}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-white/45">
                    {formatRange(booking.startIso, booking.endIso, locale)} · {bookingNights(booking)} {t("charter.nights")}
                  </p>
                </div>
                <StatusBadge tone={BOOKING_TONE[booking.status]}>{t(`charter.booking_${booking.status}`)}</StatusBadge>
              </div>
            </GlassPanel>
          </button>
        );
      })}
    </div>
  );
}

function weekdayLabel(iso: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const parts = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { weekday: "short" }).format(new Date(parts[0]!, parts[1]! - 1, parts[2]!));
}

function formatRange(start: string, end: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const fmt = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "short" });
  const a = start.split("-").map(Number);
  const b = end.split("-").map(Number);
  return `${fmt.format(new Date(a[0]!, a[1]! - 1, a[2]!))} – ${fmt.format(new Date(b[0]!, b[1]! - 1, b[2]!))}`;
}
