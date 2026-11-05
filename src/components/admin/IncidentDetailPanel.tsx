import { useState } from "react";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { StatusChip } from "@/components/mission/StatusChip";
import { AlertTriangle, ExternalLink, Flag, LifeBuoy, MapPin, Ship, Wallet } from "lucide-react";
import type { MissionRow } from "./MissionCommandBoard";
import { Link } from "@tanstack/react-router";
import { formatTL } from "@/lib/filter";
import { supabase } from "@/integrations/supabase/client";
import { emitEvent } from "@/lib/events";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  mission: MissionRow | null;
  offersCount?: number;
}

/**
 * IncidentDetailPanel — right rail focus view for the selected mission.
 * Flag + dispute resolve call SECURITY DEFINER RPCs (admin-only).
 */
export function IncidentDetailPanel({ mission, offersCount }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<"flag" | "dispute" | null>(null);

  if (!mission) {
    return (
      <GlassPanel className="min-h-[320px] grid place-items-center text-center">
        <div className="text-white/50">
          <LifeBuoy className="size-6 mx-auto mb-2 text-white/30" />
          <p className="text-xs uppercase tracking-[0.2em]">{t("admin.incident.select_title")}</p>
          <p className="text-[11px] mt-1">{t("admin.incident.select_body")}</p>
        </div>
      </GlassPanel>
    );
  }

  const isSos = mission.status === "Requested" || mission.sos;

  const flagMission = async () => {
    if (busy) return;
    setBusy("flag");
    try {
      const { error } = await supabase.rpc("flag_mission_for_review", {
        _job_id: mission.id,
        _note: "Flagged from Control Tower",
      } as never);
      if (error) throw error;
      emitEvent({
        type: "admin.mission_flagged",
        subject_type: "mission",
        subject_id: mission.id,
      });
      toast.success(t("admin.incident.flag_ok"));
    } catch (err) {
      console.error(err);
      toast.error(t("admin.incident.flag_fail"));
    } finally {
      setBusy(null);
    }
  };

  const resolveDispute = async () => {
    if (busy) return;
    setBusy("dispute");
    try {
      const { data, error } = await supabase
        .from("job_disputes")
        .select("id")
        .eq("job_id", mission.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const disputeId = (data as { id: string }[] | null)?.[0]?.id;
      if (!disputeId) {
        toast.message(t("admin.incident.resolve_none"));
        return;
      }
      const { error: resolveError } = await supabase.rpc("resolve_job_dispute", {
        _dispute_id: disputeId,
        _resolution: t("admin.incident.resolve_note"),
        _status: "resolved",
      } as never);
      if (resolveError) throw resolveError;
      emitEvent({
        type: "admin.dispute_resolved",
        subject_type: "mission",
        subject_id: mission.id,
        metadata: { dispute_id: disputeId },
      });
      toast.success(t("admin.incident.resolve_ok"));
    } catch (err) {
      console.error(err);
      toast.error(t("admin.incident.resolve_fail"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <GlassPanel padded={false} className="overflow-hidden">
      <div
        className={
          "p-4 border-b border-white/[0.06] " +
          (isSos ? "bg-gradient-to-br from-rose-500/15 via-transparent to-transparent" : "")
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {t("admin.incident.detail_eyebrow")}
            </p>
            <p className="text-base font-semibold text-white mt-0.5 truncate">
              {mission.problem_category}
            </p>
          </div>
          <StatusChip tone={isSos ? "danger" : "info"} icon={isSos ? <AlertTriangle className="size-3" /> : undefined}>
            {mission.status}
          </StatusChip>
        </div>
      </div>

      <dl className="p-4 space-y-3 text-[12px]">
        <Row icon={<Ship className="size-3.5" />} label="Service">
          {mission.service_type ?? "—"}
        </Row>
        <Row icon={<MapPin className="size-3.5" />} label="Marina">
          {mission.marina ?? "Unknown"}
        </Row>
        <Row icon={<Wallet className="size-3.5" />} label="Escrow">
          {mission.total_escrow_pool ? formatTL(Math.round(Number(mission.total_escrow_pool))) : "—"}
        </Row>
        <Row icon={<LifeBuoy className="size-3.5" />} label="Offers">
          {offersCount ?? 0}
        </Row>
      </dl>

      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <Link
          to="/app/job/$id"
          params={{ id: mission.id }}
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[12px] font-semibold"
        >
          <span>{t("admin.incident.open_cockpit")}</span>
          <ExternalLink className="size-3.5" />
        </Link>
        {mission.provider_id ? (
          <Link
            to="/app/reputation"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[12px] font-semibold"
          >
            <span>{t("admin.incident.view_provider")}</span>
            <ExternalLink className="size-3.5" />
          </Link>
        ) : null}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void flagMission()}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-100 text-[12px] font-semibold hover:bg-amber-400/15 disabled:opacity-50"
        >
          <span>{t("admin.incident.flag_review")}</span>
          <Flag className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void resolveDispute()}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-100 text-[12px] font-semibold hover:bg-rose-500/15 disabled:opacity-50"
        >
          <span>{t("admin.incident.resolve_dispute")}</span>
          <LifeBuoy className="size-3.5" />
        </button>
      </div>
    </GlassPanel>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-white/45 uppercase tracking-[0.14em] text-[10px] font-semibold">
        {icon} {label}
      </dt>
      <dd className="text-white/90 font-medium truncate max-w-[60%] text-right">{children}</dd>
    </div>
  );
}
