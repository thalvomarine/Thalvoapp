import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Anchor, Crosshair, MapPin, Send, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDegrees } from "@/lib/marine-data";
import { requestMapFocus } from "@/lib/map-focus-bus";
import { createRealtimeBuffer, runWhenIdle } from "@/lib/schedule";

interface OpenJob {
  id: string;
  problem_category: string;
  description: string;
  marina: string;
  lat: number;
  lng: number;
  service_type: string;
  status: string;
  total_escrow_pool: number | null;
  profiles: { full_name: string; boat_name: string | null } | null;
}

interface Props {
  userId: string;
  embedded?: boolean;
}

/** Open mission pool — providers bid; no unpaid claim shortcut. */
export function ActiveJobPool({ userId, embedded = false }: Props) {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<OpenJob[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, problem_category, description, marina, lat, lng, service_type, status, total_escrow_pool, profiles!jobs_client_id_fkey(full_name, boat_name)",
      )
      .in("status", ["Pending", "Offered"])
      .is("provider_id", null)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) {
      console.warn("[job-pool]", error.message);
      setJobs([]);
      return;
    }
    setJobs((data as unknown as OpenJob[]) ?? []);
  }, []);

  useEffect(() => {
    const stopIdle = runWhenIdle(() => {
      void load();
    }, 900);
    const buffer = createRealtimeBuffer(() => {
      void load();
    }, 180);
    const ch = supabase
      .channel(`job-pool:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => buffer.ping())
      .subscribe();
    return () => {
      stopIdle();
      buffer.dispose();
      supabase.removeChannel(ch);
    };
  }, [userId, load]);

  const body = (
    <>
      {!embedded ? (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--sheet-active-ink)" }}
            >
              <Crosshair className="size-3.5 shrink-0" />
              {t("ops_alerts.pool_title")}
            </p>
            <p className="mt-1 text-[12px] leading-snug" style={{ color: "var(--sheet-muted)" }}>
              {jobs.length > 0 ? t("ops_alerts.pool_bid_hint") : t("ops_alerts.pool_empty")}
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
            style={{
              borderColor: "var(--sheet-active-border)",
              background: "var(--sheet-active-bg)",
              color: "var(--sheet-active-ink)",
            }}
          >
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {jobs.length}
          </span>
        </div>
      ) : (
        <p className="text-[11px] leading-snug" style={{ color: "var(--sheet-muted)" }}>
          {jobs.length > 0 ? t("ops_alerts.pool_bid_hint") : t("ops_alerts.pool_empty")}
        </p>
      )}

      {jobs.length === 0 ? (
        <div
          className="rounded-xl border px-3 py-4 text-center text-[12px] leading-relaxed"
          style={{
            borderColor: "var(--sheet-border)",
            background: "var(--sheet-chip)",
            color: "var(--sheet-muted)",
          }}
        >
          {t("ops_alerts.pool_empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => {
            const isDiver = job.service_type === "Underwater Diver";
            return (
              <li key={job.id}>
                <article
                  className="rounded-xl border px-3 py-3 transition-colors"
                  style={{
                    borderColor: "var(--sheet-border)",
                    background: "var(--sheet-chip)",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[10px] border"
                      style={{
                        borderColor: "var(--sheet-active-border)",
                        background: "var(--sheet-active-bg)",
                        color: "var(--sheet-active-ink)",
                      }}
                    >
                      {isDiver ? <Anchor className="size-4" /> : <Wrench className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--sheet-ink)" }}>
                        {t(`problems.${job.problem_category}`, {
                          defaultValue: job.problem_category,
                        })}
                      </p>
                      <p
                        className="mt-1 flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--sheet-muted)" }}
                      >
                        <MapPin className="size-3 shrink-0" style={{ color: "var(--sheet-active-ink)" }} />
                        <span className="truncate">
                          {job.profiles?.full_name ?? "—"}
                          {job.profiles?.boat_name ? ` · ${job.profiles.boat_name}` : ""}
                          {job.marina ? ` · ${job.marina}` : ""}
                        </span>
                      </p>
                      <button
                        type="button"
                        className="mt-1 font-mono text-[10px] tabular-nums underline-offset-2 hover:underline"
                        style={{ color: "var(--sheet-active-ink)" }}
                        onClick={() => {
                          const lat = Number(job.lat);
                          const lng = Number(job.lng);
                          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                          requestMapFocus({
                            lat,
                            lng,
                            zoom: 14,
                            label: job.profiles?.boat_name || job.marina || undefined,
                          });
                        }}
                      >
                        {formatDegrees(Number(job.lat), Number(job.lng))}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--sheet-muted)" }}
                    >
                      {t(`status.${job.status}`, { defaultValue: job.status })}
                    </p>
                    <Link
                      to="/app/job/$id"
                      params={{ id: job.id }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[11px] font-black uppercase tracking-wider"
                      style={{
                        background: "#f5b942",
                        color: "#0a192f",
                      }}
                    >
                      <Send className="size-3.5" />
                      {t("ops_alerts.bid")}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{body}</div>;
  }

  return (
    <section className="thalvo-chart-sheet space-y-3 overflow-hidden rounded-2xl border p-3 shadow-lg">
      {body}
    </section>
  );
}
