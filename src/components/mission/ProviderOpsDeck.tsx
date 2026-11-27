import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Radio,
  Radar,
} from "lucide-react";
import { EmergencyCallRadar } from "@/components/mission/EmergencyCallRadar";
import { ActiveJobPool } from "@/components/mission/ActiveJobPool";
import { MissionStatusTrack, stageFromJob } from "@/components/mission/MissionStatusTrack";
import { VesselRange } from "@/components/mission/VesselRange";
import type { LiveAlert } from "@/components/LiveMapLazy";

type TabId = "radar" | "pool" | "missions";

interface ActiveJob {
  id: string;
  problem_category: string;
  status: string;
}

interface Props {
  userId: string;
  alerts: LiveAlert[];
  activeJobs: ActiveJob[];
  sosCount: number;
  poolCount: number;
  /** Optional inline offer forms for open pool jobs. */
  offerFeed?: ReactNode;
}

/**
 * Usta / servis map ops deck — floating triage above the dock.
 * Collapsed: live counts + radar sweep. Expanded: SOS radar, job pool, missions.
 */
export function ProviderOpsDeck({
  userId,
  alerts,
  activeJobs,
  sosCount,
  poolCount,
  offerFeed,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>(() =>
    sosCount > 0 ? "radar" : poolCount > 0 ? "pool" : "missions",
  );

  const focusAlert = alerts[0] ?? null;
  const totalLive = sosCount + poolCount + activeJobs.length;

  const tabs = useMemo(
    () =>
      [
        {
          id: "radar" as const,
          label: t("esvc.radar_eyebrow"),
          count: sosCount,
          icon: <Radar className="size-3.5" />,
          tone: "danger" as const,
        },
        {
          id: "pool" as const,
          label: t("ops_alerts.pool_short", { defaultValue: "Havuz" }),
          count: poolCount,
          icon: <Crosshair className="size-3.5" />,
          tone: "command" as const,
        },
        {
          id: "missions" as const,
          label: t("ops_alerts.active_jobs"),
          count: activeJobs.length,
          icon: <Activity className="size-3.5" />,
          tone: "active" as const,
        },
      ] as const,
    [t, sosCount, poolCount, activeJobs.length],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[50] flex justify-center px-3 sm:px-6">
      <div
        className={
          "thalvo-provider-ops pointer-events-auto w-full max-w-[22rem] overflow-hidden border shadow-2xl backdrop-blur-xl transition-[max-height] duration-300 " +
          (open ? "max-h-[min(62vh,36rem)]" : "max-h-[4.25rem]")
        }
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative flex w-full items-center gap-3 overflow-hidden px-3.5 py-2.5 text-left"
          aria-expanded={open}
        >
          <span className="thalvo-radar-sweep" aria-hidden />
          <span className="relative grid size-10 shrink-0 place-items-center rounded-[10px] border border-[color:var(--sheet-active-border)] bg-[color:var(--sheet-active-bg)]">
            <Radio className="size-4" style={{ color: "var(--sheet-active-ink)" }} />
            {totalLive > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-[#EF4444] px-1 text-[9px] font-black text-white">
                {totalLive > 9 ? "9+" : totalLive}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="block text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--sheet-active-ink)" }}
            >
              {t("ops_alerts.pool_title")}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]" style={{ color: "var(--sheet-muted)" }}>
              <LiveChip label="SOS" value={sosCount} danger={sosCount > 0} />
              <LiveChip label={t("ops_alerts.pool_short", { defaultValue: "Havuz" })} value={poolCount} />
              <LiveChip label={t("ops_alerts.active_jobs")} value={activeJobs.length} />
            </span>
          </span>
          <span className="shrink-0 text-[color:var(--sheet-muted)]">
            {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </span>
        </button>

        {open ? (
          <div className="border-t border-[color:var(--sheet-border)]">
            {focusAlert ? (
              <div className="px-3 pt-2">
                <VesselRange lat={focusAlert.lat} lng={focusAlert.lng} />
              </div>
            ) : null}

            <div className="flex gap-1 px-3 pt-2">
              {tabs.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={
                      "inline-flex flex-1 items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors " +
                      (active
                        ? item.tone === "danger"
                          ? "border-red-400/45 bg-red-500/15 text-red-100"
                          : "border-[color:var(--sheet-active-border)] bg-[color:var(--sheet-active-bg)] text-[color:var(--sheet-active-ink)]"
                        : "border-transparent bg-white/[0.04] text-white/50 hover:text-white/75")
                    }
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                    <span className="tabular-nums opacity-80">{item.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-[min(42vh,26rem)] space-y-3 overflow-y-auto px-3 py-3">
              {tab === "radar" ? <EmergencyCallRadar userId={userId} hideChart embedded /> : null}
              {tab === "pool" ? (
                <div className="space-y-3">
                  <ActiveJobPool userId={userId} embedded />
                  {offerFeed}
                </div>
              ) : null}
              {tab === "missions" ? (
                <MissionsPane jobs={activeJobs} empty={t("ops_alerts.no_active_jobs")} />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LiveChip({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={danger && value > 0 ? "text-red-300" : undefined}>{label}</span>
      <span
        className={
          "font-mono tabular-nums " +
          (danger && value > 0 ? "text-red-200" : "text-[color:var(--sheet-ink)]")
        }
      >
        {value}
      </span>
    </span>
  );
}

function MissionsPane({
  jobs,
  empty,
}: {
  jobs: ActiveJob[];
  empty: string;
}) {
  const { t } = useTranslation();
  if (jobs.length === 0) {
    return (
      <div
        className="rounded-xl border px-3 py-4 text-center text-[12px] leading-relaxed"
        style={{
          borderColor: "var(--sheet-border)",
          background: "var(--sheet-chip)",
          color: "var(--sheet-muted)",
        }}
      >
        {empty}
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {jobs.map((j) => {
        const stage = stageFromJob(j.status);
        return (
          <li key={j.id}>
            <Link
              to="/app/job/$id"
              params={{ id: j.id }}
              className="block rounded-xl border px-3 py-3 transition-colors hover:border-[color:var(--sheet-active-border)]"
              style={{
                borderColor: "var(--sheet-border)",
                background: "var(--sheet-chip)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--sheet-muted)" }}>
                {t("ops_alerts.mission_opportunity")}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: "var(--sheet-ink)" }}>
                {t(`problems.${j.problem_category}`, { defaultValue: j.problem_category })}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--sheet-muted)" }}>
                {t(`status.${j.status}`, { defaultValue: j.status })}
              </p>
              <div className="mt-2.5 border-t border-[color:var(--sheet-border)] pt-2.5">
                <MissionStatusTrack stage={stage} compact />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
