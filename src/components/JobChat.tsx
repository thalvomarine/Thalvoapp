import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { filterMessage } from "@/lib/filter";
import { sanitizeMultiline } from "@/lib/sanitize";
import { classifyLeakRisk, riskCopy } from "@/lib/security";
import { SecurityWarningBanner } from "@/components/security/SecurityWarningBanner";
import { emitEvent } from "@/lib/events";
import { AlertTriangle, Send, ShieldCheck } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  masked: boolean;
  created_at: string;
}

export function JobChat({ jobId, meId }: { jobId: string; meId: string }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [alert, setAlert] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase.from("job_messages").select("id,sender_id,text,masked,created_at").eq("job_id", jobId).order("created_at").then(({ data }) => {
      if (mounted && data) setMessages(data as Message[]);
    });
    const ch = supabase
      .channel(`chat:${jobId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_messages", filter: `job_id=eq.${jobId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]))
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [jobId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const preflight = classifyLeakRisk(text);
  const blocked = preflight.risk === "high";
  const preflightCopy = riskCopy(preflight.risk);

  const send = async () => {
    if (!text.trim() || sending) return;
    // The database trigger rejects contact, payment and off-platform text
    // even if this check is skipped.
    if (blocked) {
      setAlert(true);
      // M7: log blocked send attempt as telemetry.
      emitEvent({
        type: "chat.high_risk_blocked",
        subject_type: "chat",
        subject_id: jobId,
        metadata: { categories: preflight.categories, signal_count: preflight.signals.length },
      });
      return;
    }
    const filtered = filterMessage(sanitizeMultiline(text, 2000));
    if (filtered.masked) setAlert(true);
    setSending(true);
    const { error } = await supabase.from("job_messages").insert({
      job_id: jobId,
      sender_id: meId,
      text: filtered.text,
      masked: filtered.masked,
      blocked_terms: filtered.blocked,
    });
    setSending(false);
    if (error) {
      setAlert(true);
      if (/LEAK_BLOCKED/i.test(error.message)) {
        emitEvent({
          type: "chat.high_risk_blocked",
          subject_type: "chat",
          subject_id: jobId,
          metadata: { categories: preflight.categories, signal_count: preflight.signals.length },
        });
      }
      return;
    }
    setText("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071422] text-white">
      <div className="flex items-center gap-2 bg-[#06101c] px-4 py-2.5 text-white">
        <ShieldCheck className="size-4 text-aqua" />
        <p className="text-sm font-bold">{t("chat.title")}</p>
      </div>
      <p className="bg-white/[0.04] px-4 py-2 text-[11px] text-white/55">{t("chat.masked_notice")}</p>

      {alert && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl border-2 border-rose-400/50 bg-rose-500/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-300" />
          <div className="text-xs font-semibold text-rose-100">{t("chat.security_alert")}</div>
        </div>
      )}

      <div ref={scrollRef} className="h-72 space-y-2 overflow-y-auto bg-[#06101c] px-3 py-3">
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                  (mine
                    ? "rounded-br-sm bg-deep text-white"
                    : "rounded-bl-sm border border-white/10 bg-white/[0.06] text-white/90")
                }
              >
                {m.text}
                {m.masked && (
                  <span className="ml-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {t("chat.blocked")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 p-2">
        {preflight.risk !== "safe" && text.trim() && (
          <div className="mb-2">
            <SecurityWarningBanner
              risk={preflight.risk}
              title={preflightCopy.title}
              body={preflightCopy.body}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={t("chat.placeholder")}
            className="h-10 flex-1 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-400/50"
          />
          <button
            onClick={send}
            disabled={sending || blocked}
            title={blocked ? preflightCopy.body : undefined}
            className="grid size-10 place-items-center rounded-full marine-gradient text-white disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
