import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Anchor, Loader2, Send, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { asCoordinate } from "@/lib/emergency-service";
import { emitEvent } from "@/lib/events";
import { caretAfterGrouping, groupThousands, parseGrouped } from "@/lib/digit-format";
import { getFix, readLastFix } from "@/lib/geolocation";
import { autoEtaMinutesBetween, calculateMarineEta } from "@/lib/geo-eta";
import { useSessionUser } from "@/lib/session";

export interface ProviderOfferRequest {
  id: string;
  problem_category: string;
  description: string;
  marina: string;
  service_type: string;
  lat: number | null;
  lng: number | null;
  profiles: { full_name: string; boat_name: string | null } | null;
}

/** Inline bid form for usta/servis map pool — escrow-funded open jobs. */
export function ProviderOfferCard({ request }: { request: ProviderOfferRequest }) {
  const { t } = useTranslation();
  const { user } = useSessionUser();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [etaHint, setEtaHint] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [available, setAvailable] = useState<"available" | "standby">("available");
  const [busy, setBusy] = useState(false);
  const isDiver = request.service_type === "Underwater Diver";

  const openOffer = async () => {
    setOpen(true);
    setEtaHint(null);
    const jobLat = asCoordinate(request.lat);
    const jobLng = asCoordinate(request.lng);
    if (jobLat == null || jobLng == null) return;

    let from = readLastFix();
    if (!from) {
      const res = await getFix();
      if (res.ok) from = res.fix;
    }
    if (!from && user) {
      const { data } = await supabase
        .from("provider_details")
        .select("lat, lng")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.lat != null && data?.lng != null) {
        from = {
          lat: Number(data.lat),
          lng: Number(data.lng),
          accuracy: Number.NaN,
          capturedAt: Date.now(),
        };
      }
    }
    const mins = autoEtaMinutesBetween(from, { lat: jobLat, lng: jobLng });
    if (mins == null || !from) return;
    setEta(String(mins));
    const marine = calculateMarineEta(from, { lat: jobLat, lng: jobLng });
    setEtaHint(marine.label);
    if (user && Number.isFinite(from.lat)) {
      void supabase.rpc("refresh_own_provider_position", {
        _lat: from.lat,
        _lng: from.lng,
        _accuracy_m: Number.isFinite(from.accuracy) ? Math.round(from.accuracy) : undefined,
      });
    }
  };

  const submit = async () => {
    if (!user || !price || !eta) return;
    setBusy(true);
    const notePayload = [available === "standby" ? "[On standby]" : "[Available now]", note.trim()]
      .filter(Boolean)
      .join(" ");
    const offerPrice = parseGrouped(price);
    const offerEta = parseGrouped(eta);
    const { data: offerId, error } = await supabase.rpc("submit_offer", {
      _job_id: request.id,
      _price: offerPrice,
      _eta_minutes: offerEta,
      _note: notePayload || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    emitEvent({
      type: "offer.submitted",
      subject_type: "offer",
      subject_id: typeof offerId === "string" ? offerId : request.id,
      metadata: { job_id: request.id, price: offerPrice, eta_minutes: offerEta },
    });
    toast.success(t("ops_alerts.offer_sent"));
    setOpen(false);
    setPrice("");
    setEta("");
    setEtaHint(null);
    setNote("");
  };

  return (
    <li
      className="rounded-xl border p-3.5"
      style={{ borderColor: "var(--sheet-border)", background: "var(--sheet-chip)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid size-10 place-items-center rounded-[10px] border"
          style={{
            borderColor: "var(--sheet-active-border)",
            background: "var(--sheet-active-bg)",
            color: "var(--sheet-active-ink)",
          }}
        >
          {isDiver ? <Anchor className="size-5" /> : <Wrench className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/90">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-70" />
              <span className="relative size-1.5 rounded-full bg-rose-400" />
            </span>
            {t("ops_alerts.funded")}
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--sheet-ink)" }}>
            {t(`problems.${request.problem_category}`, { defaultValue: request.problem_category })}
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--sheet-muted)" }}>
            {request.marina} · {request.profiles?.boat_name ?? "—"}
          </p>
          {request.description ? (
            <p className="mt-2 whitespace-pre-wrap text-[12px]" style={{ color: "var(--sheet-muted)" }}>
              {request.description}
            </p>
          ) : null}
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--sheet-faint)" }}>
            {t("ops_alerts.escrow_note")}
          </p>
        </div>
      </div>
      {!open ? (
        <button
          type="button"
          onClick={() => void openOffer()}
          className="mt-3 h-10 w-full rounded-[10px] border text-sm font-semibold"
          style={{
            borderColor: "var(--sheet-border)",
            background: "var(--sheet-chip-hover)",
            color: "var(--sheet-ink)",
          }}
        >
          {t("provider.submit_offer")}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={price}
              onChange={(e) => {
                const el = e.target;
                const next = groupThousands(el.value);
                setPrice(next);
                const caret = caretAfterGrouping(el.value, next, el.selectionStart);
                requestAnimationFrame(() => el.setSelectionRange(caret, caret));
              }}
              inputMode="numeric"
              placeholder={t("provider.your_price")}
              className="h-10 rounded-[10px] border border-white/15 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-amber-400/60"
            />
            <input
              value={eta}
              onChange={(e) => {
                const el = e.target;
                const next = groupThousands(el.value);
                setEta(next);
                setEtaHint(null);
                const caret = caretAfterGrouping(el.value, next, el.selectionStart);
                requestAnimationFrame(() => el.setSelectionRange(caret, caret));
              }}
              inputMode="numeric"
              placeholder={t("provider.your_eta")}
              className="h-10 rounded-[10px] border border-white/15 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-amber-400/60"
            />
          </div>
          {etaHint ? (
            <p className="text-[10px] tracking-wide text-amber-200/80">
              {t("provider.eta_auto_hint", { defaultValue: "Otomatik ETA" })} · {etaHint}
            </p>
          ) : null}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("provider.note")}
            className="h-10 w-full rounded-[10px] border border-white/15 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-amber-400/60"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAvailable("available")}
              className={
                "h-9 flex-1 rounded-[10px] border text-[11px] font-semibold uppercase tracking-[0.14em] " +
                (available === "available"
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/50")
              }
            >
              {t("ops_alerts.available_now")}
            </button>
            <button
              type="button"
              onClick={() => setAvailable("standby")}
              className={
                "h-9 flex-1 rounded-[10px] border text-[11px] font-semibold uppercase tracking-[0.14em] " +
                (available === "standby"
                  ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                  : "border-white/10 bg-white/5 text-white/50")
              }
            >
              {t("ops_alerts.on_standby")}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 flex-1 rounded-[10px] border border-white/15 text-sm text-white/70"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#F5B942] text-sm font-semibold text-[#1A1406] hover:bg-[#ffc857]"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t("provider.submit_offer")}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
