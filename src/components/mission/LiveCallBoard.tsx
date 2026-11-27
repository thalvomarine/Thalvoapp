import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MapPin, Radio, Ship } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  asCoordinate,
  EMERGENCY_CATEGORY_LABEL_KEYS,
  type EmergencyServiceRequest,
} from "@/lib/emergency-service";
import { calculateMarineEta } from "@/lib/geo-eta";
import { getFix } from "@/lib/geolocation";
import { formatDegrees } from "@/lib/marine-data";
import { requestMapFocus } from "@/lib/map-focus-bus";
import { createRealtimeBuffer } from "@/lib/schedule";
import { MissionBidForm } from "@/components/mission/MissionBidForm";

interface AssignedJob {
  id: string;
  problem_category: string;
  status: string;
  marina: string | null;
  lat: number | null;
  lng: number | null;
}

interface PoolJob {
  id: string;
  problem_category: string;
  description: string | null;
  marina: string | null;
  lat: number | null;
  lng: number | null;
}

interface Props {
  userId: string;
}

/**
 * The live fault board. Open calls come from the emergency feed providers
 * can already read; assigned work comes from the provider's own jobs.
 */
export function LiveCallBoard({ userId }: Props) {
  const { t } = useTranslation();
  const [openCalls, setOpenCalls] = useState<EmergencyServiceRequest[]>([]);
  const [pool, setPool] = useState<PoolJob[]>([]);
  const [mine, setMine] = useState<AssignedJob[]>([]);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [bidding, setBidding] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [callsRes, jobsRes, poolRes] = await Promise.all([
      supabase
        .from("emergency_service_requests")
        .select("*")
        .in("status", ["pending", "en_route", "on_scene"])
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("jobs")
        .select("id, problem_category, status, marina, lat, lng")
        .eq("provider_id", userId)
        .not("status", "in", "(Completed,Cancelled)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("jobs")
        .select("id, problem_category, description, marina, lat, lng")
        .in("status", ["Pending", "Offered"])
        .is("provider_id", null)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
    const calls = ((callsRes.data as EmergencyServiceRequest[] | null) ?? []).filter(
      (row) => !row.assigned_provider_id || row.assigned_provider_id === userId,
    );
    const assignedIds = new Set((jobsRes.data ?? []).map((row) => row.id));
    const visibleCalls = calls.filter(
      (row) => row.status === "pending" && (!row.job_id || !assignedIds.has(row.job_id)),
    );
    const linked = new Set(
      visibleCalls.map((row) => row.job_id).filter((id): id is string => Boolean(id)),
    );
    setOpenCalls(visibleCalls);
    setPool(
      ((poolRes.data as PoolJob[] | null) ?? []).filter(
        (job) => !linked.has(job.id) && !assignedIds.has(job.id),
      ),
    );
    setMine((jobsRes.data as AssignedJob[] | null) ?? []);
  }, [userId]);

  useEffect(() => {
    void getFix().then((res) => {
      if (res.ok) setOrigin({ lat: res.fix.lat, lng: res.fix.lng });
    });
    void load();
    const buffer = createRealtimeBuffer(() => {
      void load();
    }, 180);
    const ch = supabase
      .channel(`live-calls:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_service_requests" },
        () => buffer.ping(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => buffer.ping())
      .subscribe();
    return () => {
      buffer.dispose();
      supabase.removeChannel(ch);
    };
  }, [userId, load]);

  return (
    <section className="thalvo-chart-sheet space-y-3 rounded-2xl border p-3 shadow-lg">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--sheet-active-ink)" }}
          >
            <Radio className="size-3.5" />
            {t("ops.live_feed")}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold" style={{ color: "var(--sheet-ink)" }}>
            {t("ops_alerts.pool_title")}
          </h2>
        </div>
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={{
            borderColor: "var(--sheet-active-border)",
            color: "var(--sheet-active-ink)",
          }}
        >
          {openCalls.length + pool.length + mine.length}
        </span>
      </header>

      {mine.length > 0 && (
        <ul className="space-y-2">
          {mine.map((job) => (
            <li key={job.id}>
              <Link
                to="/app/job/$id"
                params={{ id: job.id }}
                className="block rounded-xl border px-3 py-3"
                style={{ borderColor: "var(--sheet-border)", background: "var(--sheet-chip)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  {t("provider.active")}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--sheet-ink)" }}>
                  {t(`problems.${job.problem_category}`, { defaultValue: job.problem_category })}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--sheet-muted)" }}>
                  {t(`status.${job.status}`, { defaultValue: job.status })}
                  {job.marina ? ` · ${job.marina}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {openCalls.length === 0 && pool.length === 0 && mine.length === 0 ? (
        <p
          className="rounded-xl border px-3 py-4 text-center text-[12px] leading-relaxed"
          style={{
            borderColor: "var(--sheet-border)",
            background: "var(--sheet-chip)",
            color: "var(--sheet-muted)",
          }}
        >
          {t("ops_alerts.pool_empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {openCalls.map((row) => {
            const lat = asCoordinate(row.lat);
            const lng = asCoordinate(row.lng);
            const eta =
              origin && lat != null && lng != null
                ? calculateMarineEta({ lat, lng }, origin)
                : null;
            const vessel =
              row.vessel_name?.trim() || row.bay_name?.trim() || t("esvc.unnamed_vessel");
            const urgent = row.urgency_level === "urgent";
            return (
              <li key={row.id}>
                <article
                  className="rounded-xl border px-3 py-3"
                  style={{
                    borderColor: urgent ? "rgba(248,113,113,0.45)" : "var(--sheet-border)",
                    background: "var(--sheet-chip)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold"
                        style={{ color: "var(--sheet-ink)" }}
                      >
                        {vessel}
                      </p>
                      <p
                        className="mt-0.5 text-[12px]"
                        style={{ color: "var(--sheet-active-ink)" }}
                      >
                        {t(EMERGENCY_CATEGORY_LABEL_KEYS[row.category])}
                      </p>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] " +
                        (urgent ? "bg-red-500/20 text-red-100" : "bg-amber-400/15 text-amber-100")
                      }
                    >
                      {t(`esvc.urgency_${row.urgency_level}`)}
                    </span>
                  </div>
                  {lat != null && lng != null && (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] underline-offset-2 hover:underline"
                      style={{ color: "var(--sheet-active-ink)" }}
                      onClick={() => requestMapFocus({ lat, lng, zoom: 15, label: vessel })}
                    >
                      <MapPin className="size-3" />
                      {formatDegrees(lat, lng)}
                      {eta ? ` · ${eta.label}` : ""}
                    </button>
                  )}
                  {row.description ? (
                    <p
                      className="mt-2 line-clamp-3 text-[12px] leading-snug"
                      style={{ color: "var(--sheet-muted)" }}
                    >
                      {row.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-2">
                    {row.job_id ? (
                      <>
                        {bidding === row.id ? (
                          <MissionBidForm
                            jobId={row.job_id}
                            lat={lat}
                            lng={lng}
                            onSent={() => setBidding(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setBidding(row.id)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 text-[12px] font-black uppercase tracking-wider text-[#0A192F]"
                          >
                            <Ship className="size-4" />
                            {t("esvc.bid")}
                          </button>
                        )}
                        <Link
                          to="/app/job/$id"
                          params={{ id: row.job_id }}
                          className="text-center text-[11px] font-semibold uppercase tracking-[0.12em]"
                          style={{ color: "var(--sheet-active-ink)" }}
                        >
                          {t("esvc.open_mission")}
                        </Link>
                      </>
                    ) : (
                      <p className="text-[11px]" style={{ color: "var(--sheet-muted)" }}>
                        {t("esvc.awaiting_mission_link")}
                      </p>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
          {pool.map((job) => {
            const lat = asCoordinate(job.lat);
            const lng = asCoordinate(job.lng);
            return (
              <li key={job.id}>
                <article
                  className="rounded-xl border px-3 py-3"
                  style={{ borderColor: "var(--sheet-border)", background: "var(--sheet-chip)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--sheet-ink)" }}>
                    {t(`problems.${job.problem_category}`, { defaultValue: job.problem_category })}
                  </p>
                  <p className="mt-0.5 text-[12px]" style={{ color: "var(--sheet-muted)" }}>
                    {job.marina || t("esvc.open_water")}
                  </p>
                  {job.description ? (
                    <p
                      className="mt-2 line-clamp-3 text-[12px] leading-snug"
                      style={{ color: "var(--sheet-muted)" }}
                    >
                      {job.description}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    {bidding === job.id ? (
                      <MissionBidForm
                        jobId={job.id}
                        lat={lat}
                        lng={lng}
                        onSent={() => setBidding(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBidding(job.id)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-[12px] font-black uppercase tracking-wider text-[#0A192F]"
                      >
                        <Ship className="size-4" />
                        {t("esvc.bid")}
                      </button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
