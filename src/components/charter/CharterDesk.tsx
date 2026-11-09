import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Anchor,
  CalendarDays,
  ClipboardList,
  Inbox,
  Ship,
  Sparkles,
  Wrench,
} from "lucide-react";
import { CockpitHeader, EmptyState, MetricCard, StatusBadge } from "@/components/core";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { MarketplaceShell } from "@/components/marketplace/MarketplaceShell";
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
  formatEur,
  formatLoa,
  todayIso,
  todaysOps,
  yachtById,
  type BookingStatus,
  type CharterBase,
  type CharterBooking,
  type CharterInquiry,
  type CharterYacht,
  type InquiryStatus,
  type YachtStatus,
} from "@/lib/charter-desk";

type Tab = "today" | "fleet" | "bookings" | "inquiries";

const YACHT_TONE: Record<YachtStatus, "success" | "info" | "warning" | "danger"> = {
  available: "success",
  on_charter: "info",
  turnaround: "warning",
  maintenance: "danger",
};

const BOOKING_TONE: Record<BookingStatus, "success" | "info" | "warning" | "neutral" | "danger"> = {
  confirmed: "info",
  checked_in: "success",
  checked_out: "warning",
  option: "neutral",
  cancelled: "danger",
};

const INQUIRY_TONE: Record<InquiryStatus, "info" | "warning" | "success" | "neutral" | "danger"> = {
  new: "info",
  quoted: "warning",
  hold: "neutral",
  won: "success",
  lost: "danger",
};

/**
 * Charter operator desk — professional fleet / booking / turnaround board.
 * Sample Aegean data; not wired to live Supabase yet.
 */
export function CharterDesk() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "tr";
  const [tab, setTab] = useState<Tab>("today");
  const [base, setBase] = useState<CharterBase | "all">("all");
  const [statusFilter, setStatusFilter] = useState<YachtStatus | "all">("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedYacht, setSelectedYacht] = useState<CharterYacht | null>(null);

  const bookings = useMemo(() => buildSeedBookings(), []);
  const today = useMemo(() => todayIso(), []);
  const week = useMemo(() => buildWeekStrip(bookings, SEED_FLEET), [bookings]);
  const stats = useMemo(() => fleetStats(SEED_FLEET), []);
  const ops = useMemo(() => todaysOps(bookings, today), [bookings, today]);

  const fleet = useMemo(
    () => filterFleet(SEED_FLEET, base, statusFilter),
    [base, statusFilter],
  );
  const visibleBookings = useMemo(
    () => filterBookings(bookings, base, selectedDay),
    [bookings, base, selectedDay],
  );
  const openInquiries = SEED_INQUIRIES.filter((i) => i.status === "new" || i.status === "quoted" || i.status === "hold");

  return (
    <MarketplaceShell
      eyebrow={t("charter.eyebrow")}
      title={t("charter.title")}
      subtitle={t("charter.subtitle")}
      right={
        <StatusBadge tone="warning" icon={<Sparkles className="size-3" />}>
          {t("charter.demo_badge")}
        </StatusBadge>
      }
      banner={
        <GlassPanel className="border-amber-400/20 bg-amber-500/[0.06] px-4 py-3">
          <p className="text-[12px] leading-snug text-amber-100/90">{t("charter.demo_note")}</p>
        </GlassPanel>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <BaseChip active={base === "all"} onClick={() => setBase("all")} label={t("charter.base_all")} />
        {CHARTER_BASES.map((b) => (
          <BaseChip key={b} active={base === b} onClick={() => setBase(b)} label={b} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard
          label={t("charter.stat_on_charter")}
          value={stats.onCharter}
          tone="info"
          icon={<Ship className="size-3" />}
          hint={t("charter.stat_on_charter_hint")}
        />
        <MetricCard
          label={t("charter.stat_available")}
          value={stats.available}
          tone="success"
          icon={<Anchor className="size-3" />}
          hint={t("charter.stat_available_hint")}
        />
        <MetricCard
          label={t("charter.stat_turnaround")}
          value={ops.checkOuts.length + stats.turnaround}
          tone="warning"
          icon={<ClipboardList className="size-3" />}
          hint={t("charter.stat_turnaround_hint")}
        />
        <MetricCard
          label={t("charter.stat_inquiries")}
          value={openInquiries.length}
          tone="neutral"
          icon={<Inbox className="size-3" />}
          hint={t("charter.stat_inquiries_hint")}
        />
      </div>

      <WeekStrip
        days={week}
        selected={selectedDay}
        today={today}
        onSelect={(iso) => setSelectedDay((prev) => (prev === iso ? null : iso))}
        tLabel={t("charter.week_label")}
      />

      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-1">
        {(
          [
            ["today", t("charter.tab_today")],
            ["fleet", t("charter.tab_fleet")],
            ["bookings", t("charter.tab_bookings")],
            ["inquiries", t("charter.tab_inquiries")],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              "h-9 rounded-xl text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:text-[11px] " +
              (tab === key ? "bg-amber-500/20 text-amber-100" : "text-white/50 hover:text-white/80")
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-300">
        {tab === "today" ? (
          <TodayBoard
            checkIns={filterByBase(ops.checkIns, base)}
            checkOuts={filterByBase(ops.checkOuts, base)}
            active={filterByBase(ops.active, base)}
          />
        ) : null}

        {tab === "fleet" ? (
          <FleetBoard
            fleet={fleet}
            statusFilter={statusFilter}
            onStatus={setStatusFilter}
            onSelect={setSelectedYacht}
            locale={locale}
          />
        ) : null}

        {tab === "bookings" ? (
          <BookingsBoard bookings={visibleBookings} locale={locale} dayFilter={selectedDay} />
        ) : null}

        {tab === "inquiries" ? <InquiriesBoard inquiries={SEED_INQUIRIES} locale={locale} /> : null}
      </div>

      {selectedYacht ? (
        <YachtSheet yacht={selectedYacht} locale={locale} onClose={() => setSelectedYacht(null)} />
      ) : null}
    </MarketplaceShell>
  );
}

function filterByBase(rows: CharterBooking[], base: CharterBase | "all") {
  if (base === "all") return rows;
  return rows.filter((b) => b.baseOut === base || b.baseIn === base);
}

function BaseChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-8 rounded-full border px-3 text-[11px] font-semibold tracking-wide transition-colors duration-200 " +
        (active
          ? "border-amber-400/50 bg-amber-500/20 text-amber-100"
          : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white/85")
      }
    >
      {label}
    </button>
  );
}

function WeekStrip({
  days,
  selected,
  today,
  onSelect,
  tLabel,
}: {
  days: ReturnType<typeof buildWeekStrip>;
  selected: string | null;
  today: string;
  onSelect: (iso: string) => void;
  tLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
        <CalendarDays className="size-3.5" />
        {tLabel}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const active = selected === d.iso;
          const isToday = d.iso === today;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onSelect(d.iso)}
              className={
                "min-w-[4.25rem] shrink-0 rounded-2xl border px-2.5 py-2 text-left transition-all duration-200 " +
                (active
                  ? "border-amber-400/55 bg-amber-500/15 shadow-[0_0_0_1px_rgb(245_185_66/0.2)]"
                  : isToday
                    ? "border-cyan-400/35 bg-cyan-500/[0.08]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20")
              }
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                {d.weekday}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{d.label}</p>
              <p className="mt-1 text-[10px] text-white/50">
                <span className="text-emerald-300/90">{d.checkIns}↓</span>
                {" · "}
                <span className="text-amber-200/90">{d.checkOuts}↑</span>
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TodayBoard({
  checkIns,
  checkOuts,
  active,
}: {
  checkIns: CharterBooking[];
  checkOuts: CharterBooking[];
  active: CharterBooking[];
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <OpsColumn
        title={t("charter.col_checkin")}
        emptyTitle={t("charter.empty_checkin_title")}
        emptyBody={t("charter.empty_checkin_body")}
        tone="success"
        rows={checkIns}
      />
      <OpsColumn
        title={t("charter.col_checkout")}
        emptyTitle={t("charter.empty_checkout_title")}
        emptyBody={t("charter.empty_checkout_body")}
        tone="warning"
        rows={checkOuts}
      />
      <OpsColumn
        title={t("charter.col_active")}
        emptyTitle={t("charter.empty_active_title")}
        emptyBody={t("charter.empty_active_body")}
        tone="info"
        rows={active}
      />
    </div>
  );
}

function OpsColumn({
  title,
  emptyTitle,
  emptyBody,
  tone,
  rows,
}: {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  tone: "success" | "warning" | "info";
  rows: CharterBooking[];
}) {
  const { t } = useTranslation();
  return (
    <GlassPanel className="space-y-2.5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{title}</p>
        <StatusBadge tone={tone}>{rows.length}</StatusBadge>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Ship className="size-4" />} title={emptyTitle} body={emptyBody} />
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => {
            const yacht = yachtById(SEED_FLEET, b.yachtId);
            return (
              <li
                key={b.id}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 transition-colors hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {yacht?.name ?? b.yachtId}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-white/55">{b.guest}</p>
                  </div>
                  <StatusBadge tone={BOOKING_TONE[b.status]}>
                    {t(`charter.booking_${b.status}`)}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-[11px] text-white/45">
                  {b.baseOut}
                  {b.baseIn !== b.baseOut ? ` → ${b.baseIn}` : ""} · {b.ref} · {b.party} pax
                </p>
                {b.notes ? <p className="mt-1 text-[11px] text-amber-100/70">{b.notes}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}

function FleetBoard({
  fleet,
  statusFilter,
  onStatus,
  onSelect,
  locale,
}: {
  fleet: CharterYacht[];
  statusFilter: YachtStatus | "all";
  onStatus: (s: YachtStatus | "all") => void;
  onSelect: (y: CharterYacht) => void;
  locale: string;
}) {
  const { t } = useTranslation();
  const filters: Array<YachtStatus | "all"> = [
    "all",
    "available",
    "on_charter",
    "turnaround",
    "maintenance",
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatus(s)}
            className={
              "h-8 rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors " +
              (statusFilter === s
                ? "border-amber-400/50 bg-amber-500/20 text-amber-100"
                : "border-white/10 bg-white/[0.03] text-white/55")
            }
          >
            {s === "all" ? t("charter.status_all") : t(`charter.yacht_${s}`)}
          </button>
        ))}
      </div>

      {fleet.length === 0 ? (
        <GlassPanel>
          <EmptyState
            icon={<Ship className="size-4" />}
            title={t("charter.empty_fleet_title")}
            body={t("charter.empty_fleet_body")}
          />
        </GlassPanel>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.map((y) => (
            <button
              key={y.id}
              type="button"
              onClick={() => onSelect(y)}
              className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b192c] via-[#12233a] to-[#0a1524] p-3.5 text-left transition-all duration-300 hover:border-amber-400/35 hover:shadow-[0_12px_40px_-24px_rgb(245_185_66/0.45)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">{y.name}</p>
                  <p className="mt-0.5 text-[12px] text-white/55">
                    {y.model} · {y.year}
                  </p>
                </div>
                <StatusBadge
                  tone={YACHT_TONE[y.status]}
                  icon={
                    y.status === "on_charter" ? (
                      <span className="relative flex size-1.5">
                        <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300 opacity-70" />
                        <span className="relative size-1.5 rounded-full bg-cyan-300" />
                      </span>
                    ) : y.status === "maintenance" ? (
                      <Wrench className="size-3" />
                    ) : undefined
                  }
                >
                  {t(`charter.yacht_${y.status}`)}
                </StatusBadge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/60">
                <span>{formatLoa(y.loaM)}</span>
                <span>
                  {y.cabins} {t("charter.cabins")}
                </span>
                <span>
                  {y.berths} {t("charter.berths")}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                <span className="text-[11px] text-white/50">{y.base}</span>
                <span className="text-[12px] font-semibold text-amber-200">
                  {formatEur(y.weeklyFromEur, locale)}
                  <span className="ml-1 text-[10px] font-medium text-white/40">
                    /{t("charter.week")}
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsBoard({
  bookings,
  locale,
  dayFilter,
}: {
  bookings: CharterBooking[];
  locale: string;
  dayFilter: string | null;
}) {
  const { t } = useTranslation();
  if (bookings.length === 0) {
    return (
      <GlassPanel>
        <EmptyState
          icon={<CalendarDays className="size-4" />}
          title={t("charter.empty_bookings_title")}
          body={
            dayFilter ? t("charter.empty_bookings_day_body") : t("charter.empty_bookings_body")
          }
        />
      </GlassPanel>
    );
  }

  return (
    <ul className="space-y-2">
      {bookings.map((b) => {
        const yacht = yachtById(SEED_FLEET, b.yachtId);
        return (
          <li key={b.id}>
            <GlassPanel className="px-3.5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">
                    {yacht?.name ?? b.yachtId}
                    <span className="ml-2 text-[11px] font-medium text-white/45">{b.ref}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-white/60">{b.guest}</p>
                </div>
                <StatusBadge tone={BOOKING_TONE[b.status]}>
                  {t(`charter.booking_${b.status}`)}
                </StatusBadge>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/50">
                <span>
                  {b.startIso} → {b.endIso} · {bookingNights(b)} {t("charter.nights")}
                </span>
                <span>
                  {b.baseOut}
                  {b.baseIn !== b.baseOut ? ` → ${b.baseIn}` : ""}
                </span>
                <span>
                  {b.party} pax · {t(`charter.kind_${b.kind}`)}
                </span>
                {yacht ? (
                  <span className="text-amber-200/80">{formatEur(yacht.weeklyFromEur, locale)}</span>
                ) : null}
              </div>
            </GlassPanel>
          </li>
        );
      })}
    </ul>
  );
}

function InquiriesBoard({ inquiries, locale }: { inquiries: CharterInquiry[]; locale: string }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2">
      {inquiries.map((inq) => (
        <li key={inq.id}>
          <GlassPanel className="px-3.5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white">{inq.guest}</p>
                <p className="mt-0.5 text-[12px] text-white/55">
                  {inq.from} · {inq.dates}
                </p>
              </div>
              <StatusBadge tone={INQUIRY_TONE[inq.status]}>
                {t(`charter.inquiry_${inq.status}`)}
              </StatusBadge>
            </div>
            <p className="mt-2 text-[12px] text-white/70">{inq.yachtHint}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/45">
              <span>{t(`charter.channel_${inq.channel}`)}</span>
              <span className="text-amber-200/85">{formatEur(inq.valueEur, locale)}</span>
            </div>
          </GlassPanel>
        </li>
      ))}
    </ul>
  );
}

function YachtSheet({
  yacht,
  locale,
  onClose,
}: {
  yacht: CharterYacht;
  locale: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-end bg-black/55 p-3 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <GlassPanel
        className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 p-4 sm:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        <CockpitHeader
          eyebrow={yacht.base}
          title={yacht.name}
          subtitle={`${yacht.model} · ${yacht.year}`}
          actions={
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-white/15 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70"
            >
              {t("common.close")}
            </button>
          }
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge tone={YACHT_TONE[yacht.status]}>{t(`charter.yacht_${yacht.status}`)}</StatusBadge>
          <StatusBadge tone="neutral">{t(`charter.kind_${yacht.kind}`)}</StatusBadge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <dt className="text-white/40">{t("charter.loa")}</dt>
            <dd className="mt-0.5 font-semibold text-white">{formatLoa(yacht.loaM)}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("charter.cabins")}</dt>
            <dd className="mt-0.5 font-semibold text-white">{yacht.cabins}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("charter.berths")}</dt>
            <dd className="mt-0.5 font-semibold text-white">{yacht.berths}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("charter.from_week")}</dt>
            <dd className="mt-0.5 font-semibold text-amber-200">
              {formatEur(yacht.weeklyFromEur, locale)}
            </dd>
          </div>
        </dl>
        {yacht.skipper ? (
          <p className="mt-4 text-[12px] text-white/65">
            {t("charter.skipper")}: <span className="text-white">{yacht.skipper}</span>
          </p>
        ) : (
          <p className="mt-4 text-[12px] text-white/45">{t("charter.bareboat_note")}</p>
        )}
      </GlassPanel>
    </div>
  );
}
