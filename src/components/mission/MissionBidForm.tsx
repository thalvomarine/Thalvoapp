import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { caretAfterGrouping, groupThousands, parseGrouped } from "@/lib/digit-format";
import { autoEtaMinutesBetween, calculateMarineEta } from "@/lib/geo-eta";
import { getFix, readLastFix } from "@/lib/geolocation";
import { asCoordinate } from "@/lib/emergency-service";
import { emitEvent } from "@/lib/events";
import { encodeRendezvous, escrowTotal, type RendezvousMode } from "@/lib/rendezvous";

interface Props {
  jobId: string;
  lat?: number | null;
  lng?: number | null;
  onSent?: () => void;
}

const MODES: RendezvousMode[] = ["own_boat", "pickup", "marina"];

/** The only bid path: price, live ETA, and how the master reaches the boat. */
export function MissionBidForm({ jobId, lat, lng, onSent }: Props) {
  const { t } = useTranslation();
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [etaHint, setEtaHint] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<RendezvousMode>("own_boat");
  const [fee, setFee] = useState("");
  const [point, setPoint] = useState("");
  const [busy, setBusy] = useState(false);
  const [primed, setPrimed] = useState(false);

  const primeEta = async () => {
    if (primed) return;
    setPrimed(true);
    const jobLat = asCoordinate(lat);
    const jobLng = asCoordinate(lng);
    if (jobLat == null || jobLng == null) return;
    let from = readLastFix();
    if (!from) {
      const res = await getFix();
      if (res.ok) from = res.fix;
    }
    const mins = autoEtaMinutesBetween(from, { lat: jobLat, lng: jobLng });
    if (mins == null || !from) return;
    setEta(String(mins));
    setEtaHint(calculateMarineEta(from, { lat: jobLat, lng: jobLng }).label);
    void supabase.rpc("refresh_own_provider_position", {
      _lat: from.lat,
      _lng: from.lng,
      _accuracy_m: Number.isFinite(from.accuracy) ? Math.round(from.accuracy) : undefined,
    });
  };

  const submit = async () => {
    const labor = parseGrouped(price);
    const boatFee = mode === "own_boat" ? parseGrouped(fee) : 0;
    const total = escrowTotal(labor, { mode, fee: boatFee });
    const minutes = parseGrouped(eta);
    if (!price || !eta || total <= 0 || minutes < 1) return;
    setBusy(true);
    const { data: offerId, error } = await supabase.rpc("submit_offer", {
      _job_id: jobId,
      _price: total,
      _eta_minutes: minutes,
      _note: encodeRendezvous({
        mode,
        fee: boatFee,
        point: mode === "marina" ? point : "",
        note,
      }),
    });
    setBusy(false);
    if (error) {
      const raw = error.message ?? "";
      toast.error(/not verified/i.test(raw) ? t("ops_alerts.not_verified") : raw);
      return;
    }
    emitEvent({
      type: "offer.submitted",
      subject_type: "offer",
      subject_id: typeof offerId === "string" ? offerId : jobId,
      metadata: { job_id: jobId, price: total, eta_minutes: minutes, rendezvous: mode },
    });
    toast.success(t("ops_alerts.offer_sent"));
    setPrice("");
    setNote("");
    setFee("");
    onSent?.();
  };

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
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
          onFocus={() => void primeEta()}
          inputMode="decimal"
          placeholder={t("provider.your_price")}
          className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/70"
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
          onFocus={() => void primeEta()}
          inputMode="numeric"
          placeholder={t("provider.your_eta")}
          className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/70"
        />
      </div>
      {etaHint && (
        <p className="text-[11px] text-amber-100/80">
          {t("ops.eta_live_short")} · {etaHint}
        </p>
      )}
      <fieldset className="space-y-1.5">
        <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
          {t("meet.label")}
        </legend>
        <div className="grid gap-1.5">
          {MODES.map((item) => (
            <label
              key={item}
              className={
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[12px] " +
                (mode === item
                  ? "border-amber-300/60 bg-amber-400/15 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/70")
              }
            >
              <input
                type="radio"
                name={`meet-${jobId}`}
                checked={mode === item}
                onChange={() => setMode(item)}
                className="accent-amber-300"
              />
              {t(`meet.${item}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {mode === "own_boat" && (
        <input
          value={fee}
          onChange={(e) => setFee(groupThousands(e.target.value))}
          inputMode="decimal"
          placeholder={t("meet.fee")}
          className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35"
        />
      )}
      {mode === "marina" && (
        <input
          value={point}
          onChange={(e) => setPoint(e.target.value)}
          placeholder={t("meet.point")}
          className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35"
        />
      )}
      <p className="text-[11px] leading-snug text-white/45">{t("meet.fee_note")}</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("provider.note")}
        className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35"
      />
      <button
        type="submit"
        disabled={busy || !price || !eta}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-[12px] font-black uppercase tracking-wider text-[#0A192F] disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {t("ops_alerts.send_offer")}
      </button>
    </form>
  );
}
