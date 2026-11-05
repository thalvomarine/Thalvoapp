import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { StatusChip } from "@/components/mission/StatusChip";
import { SecurityEventCard, type SecurityEvent } from "./SecurityEventCard";
import { ShieldCheck } from "lucide-react";
import { classifyLeakRisk } from "@/lib/security";

interface MessageRow {
  id: string;
  text: string;
  masked: boolean;
  blocked_terms: string[] | null;
  created_at: string;
  job_id: string;
}

interface SecurityEventRow {
  id: string;
  risk: string;
  summary: string | null;
  categories: string[] | null;
  source: string;
  job_id: string | null;
  created_at: string;
}

/**
 * AdminSecurityPanel — anti-leak visibility for admin/operator role.
 * Merges masked job_messages with durable `security_events` (client blocks
 * that never reached the DB).
 */
export function AdminSecurityPanel() {
  const [rows, setRows] = useState<MessageRow[] | null>(null);
  const [audit, setAudit] = useState<SecurityEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      supabase
        .from("job_messages")
        .select("id, text, masked, blocked_terms, created_at, job_id")
        .eq("masked", true)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("security_events")
        .select("id, risk, summary, categories, source, job_id, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
    ]).then(([messages, events]) => {
      if (messages.error) setError(messages.error.message);
      else setRows((messages.data as MessageRow[]) ?? []);
      if (!events.error) setAudit((events.data as SecurityEventRow[]) ?? []);
    });
  }, []);

  const events = useMemo<SecurityEvent[]>(() => {
    const fromMessages = (rows ?? []).map((r) => {
      const report = classifyLeakRisk(r.text);
      return {
        id: `msg-${r.id}`,
        risk: (report.risk === "safe" ? "medium" : report.risk) as SecurityEvent["risk"],
        summary: r.text.slice(0, 90),
        detail: `Mission ${r.job_id.slice(0, 8)} · ${(r.blocked_terms ?? []).join(", ") || "masked"}`,
        timestamp: r.created_at,
        categories: r.blocked_terms ?? report.categories,
      };
    });
    const fromAudit = audit.map((r) => ({
      id: `sec-${r.id}`,
      risk: (r.risk === "high" || r.risk === "medium" || r.risk === "low" ? r.risk : "medium") as SecurityEvent["risk"],
      summary: r.summary ?? `Blocked (${r.source})`,
      detail: `${r.source}${r.job_id ? ` · mission ${r.job_id.slice(0, 8)}` : ""}`,
      timestamp: r.created_at,
      categories: r.categories ?? [],
    }));
    return [...fromAudit, ...fromMessages]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 40);
  }, [rows, audit]);

  const termCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows ?? []) {
      for (const term of r.blocked_terms ?? []) counts.set(term, (counts.get(term) ?? 0) + 1);
    }
    for (const r of audit) {
      for (const term of r.categories ?? []) counts.set(term, (counts.get(term) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [rows, audit]);

  const blockedCount = events.length;

  return (
    <div className="space-y-3">
      <GlassPanel padded={false}>
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Security barrier
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {blockedCount} security event{blockedCount === 1 ? "" : "s"}
            </p>
          </div>
          <StatusChip tone="success">Active</StatusChip>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.05]">
          <ProtectionCell label="Phone masking" ok />
          <ProtectionCell label="Email masking" ok />
          <ProtectionCell label="IBAN blocking" ok />
          <ProtectionCell label="Escrow leak guard" ok />
        </div>
      </GlassPanel>

      <GlassPanel padded={false}>
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Top risky terms
          </p>
        </div>
        <ul className="p-3 flex flex-wrap gap-1.5">
          {termCounts.length === 0 && (
            <li className="text-[11px] text-white/40 px-1 py-2">No masked terms yet.</li>
          )}
          {termCounts.map(([term, count]) => (
            <li
              key={term}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70"
            >
              {term} · {count}
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel padded={false}>
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Recent barrier events
          </p>
        </div>
        {error ? (
          <p className="p-4 text-sm text-rose-300">{error}</p>
        ) : events.length === 0 ? (
          <p className="p-4 text-sm text-white/45">No leak blocks recorded.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {events.map((ev) => (
              <li key={ev.id} className="p-3">
                <SecurityEventCard event={ev} />
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}

function ProtectionCell({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={"mt-1 text-xs font-semibold " + (ok ? "text-emerald-300" : "text-rose-300")}>
        {ok ? "On" : "Off"}
      </p>
    </div>
  );
}
