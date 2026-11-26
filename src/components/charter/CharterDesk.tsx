import { useEffect, useMemo, useState } from "react";
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
import { blockedStarts, toDeskYacht, type StoredYacht } from "@/lib/charter-fleet";
import {
  CHARTER_BASES,
  SEED_FLEET,
  SEED_INQUIRIES,
  bookingNights,
  buildSeedBookings,
  buildWeekStrip,
  charterMoney,
  filterBookings,
  filterFleet,
  fleetStats,
  formatLoa,
  handoverItems,
  handoverWindow,
  occupancyCell,
  saturdayWeeks,
  todayIso,
  todaysOps,
  yachtById,
  type HandoverItem,
  type OccupancyTone,
  type BookingStatus,
  type CharterBase,
  type CharterBooking,
  type CharterInquiry,
  type CharterKind,
  type CharterYacht,
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

type Tab = "sheet" | "today" | "fleet" | "bookings" | "inquiries";
type YachtFilter = YachtStatus | "all";
const NO_COMPANY_YACHTS: StoredYacht[] = [];

export function CharterDesk({ companyYachts = NO_COMPANY_YACHTS }: { companyYachts?: StoredYacht[] }) {
  const { t, i18n } = useTranslation();
  const [base, setBase] = useState<CharterBase | "all">("all");
  const [tab, setTab] = useState<Tab>("sheet");
  const [dayIso, setDayIso] = useState<string | null>(null);
  const [yachtFilter, setYachtFilter] = useState<YachtFilter>("all");
  const [openYacht, setOpenYacht] = useState<string | null>(null);
  const [bookings, setBookings] = useState<CharterBooking[]>(() => buildSeedBookings());
  const [fleetRows, setFleetRows] = useState(() => [...SEED_FLEET, ...companyYachts.map(toDeskYacht)]);
  const [inquiries, setInquiries] = useState<CharterInquiry[]>(SEED_INQUIRIES);
  const [handover, setHandover] = useState<Record<string, HandoverItem[]>>({});

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
  const weeks = useMemo(() => saturdayWeeks(), []);
  const closedWeeks = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const yacht of companyYachts) map.set(yacht.id, blockedStarts(yacht));
    return map;
  }, [companyYachts]);

  useEffect(() => {
    setFleetRows([...SEED_FLEET, ...companyYachts.map(toDeskYacht)]);
  }, [companyYachts]);
  const sheetFleet = filterFleet(fleetRows, base, "all");

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

  const toggleHandover = (yachtId: string, item: HandoverItem) => {
    setHandover((current) => {
      const done = current[yachtId] ?? [];
      const next = done.includes(item) ? done.filter((entry) => entry !== item) : [...done, item];
      return { ...current, [yachtId]: next };
    });
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
        <p className="mt-1 text-[11px] text-amber-100/70">{t("charter.rhythm")}</p>
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

      {tab !== "sheet" && (
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
      )}

      <div className="flex gap-2 overflow-x-auto">
        {(["sheet", "today", "fleet", "bookings", "inquiries"] as const).map((key) => (
          <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
            {t(`charter.tab_${key}`)}
          </Chip>
        ))}
      </div>

      {tab === "sheet" && (
        <OccupancySheet
          fleet={sheetFleet}
          weeks={weeks}
          bookings={scopedBookings}
          today={today}
          locale={i18n.language}
          closedWeeks={closedWeeks}
          onOpen={setOpenYacht}
        />
      )}

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
            className="thalvo-dark max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#071422] p-4 shadow-2xl"
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
            <p className="mt-1 text-[12px] text-white/60">
              {t("charter.embark")} {handoverWindow(yacht.kind).embark} · {t("charter.disembark")} {handoverWindow(yacht.kind).disembark}
            </p>
            {yachtBooking && (
              <BookingMoney booking={yachtBooking} yacht={yacht} />
            )}
            <HandoverList
              yachtId={yacht.id}
              kind={yacht.kind}
              done={handover[yacht.id] ?? []}
              onToggle={toggleHandover}
            />
          </div>
        </div>
      )}
    </CockpitPage>
  );
}

const CELL_CLASS: Record<OccupancyTone, string> = {
  free: "border-white/10 bg-white/[0.03] text-white/45",
  booked: "border-cyan-300/40 bg-cyan-400/15 text-cyan-50",
  option: "border-amber-300/50 bg-amber-400/15 text-amber-50",
  one_way: "border-cyan-200/30 bg-cyan-400/10 text-cyan-50",
  service: "border-rose-400/30 bg-rose-500/10 text-rose-100",
  closed: "border-white/10 bg-white/[0.04] text-white/40",
};

function OccupancySheet({
  fleet,
  weeks,
  bookings,
  today,
  locale,
  closedWeeks,
  onOpen,
}: {
  fleet: CharterYacht[];
  weeks: ReturnType<typeof saturdayWeeks>;
  bookings: CharterBooking[];
  today: string;
  locale: string;
  closedWeeks: Map<string, string[]>;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const fmt = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" });
  return (
    <GlassPanel padded={false} className="overflow-hidden">
      <p className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">{t("charter.sheet_label")}</p>
      <div className="overflow-x-auto px-0 pb-3">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-36 bg-[#071422] py-2 pl-3 pr-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.tab_fleet")}</th>
            {weeks.map((week) => {
              const start = week.startIso.split("-").map(Number);
              const end = week.endIso.split("-").map(Number);
              const current = today >= week.startIso && today < week.endIso;
              return (
                <th
                  key={week.startIso}
                  className={"px-1 py-1 text-[10px] font-semibold uppercase tracking-wider " + (current ? "text-cyan-200" : "text-white/40")}
                >
                  {fmt.format(new Date(start[0]!, start[1]! - 1, start[2]!))}–{fmt.format(new Date(end[0]!, end[1]! - 1, end[2]!))}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {fleet.map((boat) => (
            <tr key={boat.id}>
              <th className="sticky left-0 z-10 bg-[#071422] py-1 pl-3 pr-2 text-left shadow-[8px_0_12px_rgba(0,0,0,0.45)]">
                <button type="button" onClick={() => onOpen(boat.id)} className="block max-w-36 text-left">
                  <span className="block truncate text-[12px] font-semibold text-white">{boat.name}</span>
                  <span className="block truncate text-[10px] font-normal text-white/45">{boat.base}</span>
                </button>
              </th>
              {weeks.map((week) => {
                const cell = occupancyCell(boat, week, bookings, today, closedWeeks.get(boat.id) ?? []);
                const guest = cell.booking?.guest.split(" ")[0] ?? t(`charter.cell_${cell.tone}`);
                return (
                  <td key={week.startIso} className="p-1">
                    <button
                      type="button"
                      onClick={() => onOpen(boat.id)}
                      className={"h-12 w-full rounded-lg border px-2 text-left text-[11px] font-semibold " + CELL_CLASS[cell.tone]}
                    >
                      <span className="block truncate">{guest}</span>
                      <span className="block truncate text-[9px] font-medium uppercase tracking-wider opacity-70">
                        {t(`charter.cell_${cell.tone}`)}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </GlassPanel>
  );
}

function BookingMoney({
  booking,
  yacht,
}: {
  booking: CharterBooking;
  yacht: CharterYacht;
}) {
  const { t } = useTranslation();
  const money = charterMoney(booking, yacht);
  const window = handoverWindow(yacht.kind);
  return (
    <GlassPanel className="mt-3 p-3">
      <p className="text-[12px] font-semibold text-white">{booking.guest}</p>
      <p className="text-[11px] text-white/55">{booking.ref} · {booking.baseOut} → {booking.baseIn}</p>
      <p className="mt-1 text-[11px] text-white/55">
        {bookingNights(booking)} {t("charter.nights")} · {booking.party} {t("charter.party")} · {window.embark}/{window.disembark}
      </p>
      {booking.status === "option" && (
        <p className="mt-1 text-[11px] text-amber-200">{t("charter.option_hold", { until: booking.startIso })}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/70">
        <span>{t("charter.money_collected")} <MoneyAmount value={money.collected} currency="EUR" className="text-[11px]" /></span>
        <span>{t("charter.money_balance")} <MoneyAmount value={money.balance} currency="EUR" className="text-[11px]" /></span>
        {money.deposit > 0 && (
          <span>{t("charter.money_deposit")} <MoneyAmount value={money.deposit} currency="EUR" className="text-[11px]" /></span>
        )}
        {money.apa > 0 && (
          <span>{t("charter.money_apa")} <MoneyAmount value={money.apa} currency="EUR" className="text-[11px]" /></span>
        )}
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/35">{t("charter.simulated")}</p>
    </GlassPanel>
  );
}

function HandoverList({
  yachtId,
  kind,
  done,
  onToggle,
}: {
  yachtId: string;
  kind: CharterKind;
  done: HandoverItem[];
  onToggle: (yachtId: string, item: HandoverItem) => void;
}) {
  const { t } = useTranslation();
  const items = handoverItems(kind);
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {t("charter.handover")} · {done.length}/{items.length}
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-1.5">
        {items.map((item) => {
          const on = done.includes(item);
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => onToggle(yachtId, item)}
                className={
                  "w-full rounded-lg border px-2 py-1.5 text-left text-[11px] " +
                  (on ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 text-white/70")
                }
              >
                {t(`charter.check_${item}`)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
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
