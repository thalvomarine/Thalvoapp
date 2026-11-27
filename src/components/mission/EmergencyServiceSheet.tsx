import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Anchor, Battery, Loader2, MapPin, Radio, Ship, Wrench, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCockpitContext } from "@/lib/ai-captain-context-bus";
import {
  EMERGENCY_CATEGORY_LABEL_KEYS,
  EMERGENCY_SERVICE_CATEGORIES,
  type EmergencyServiceCategory,
} from "@/lib/emergency-service";
import { fixToJobFields, getFix, isValidCoordinate, type GeoFix } from "@/lib/geolocation";
import { sanitizeMultiline, sanitizePlainText } from "@/lib/sanitize";
import { n, useSessionUser } from "@/lib/session";

interface Props {
  open: boolean;
  onClose: () => void;
  initialBayName?: string;
  initialCategory?: EmergencyServiceCategory;
}

const CAT_ICON: Record<EmergencyServiceCategory, typeof Anchor> = {
  diver: Anchor,
  mechanic: Wrench,
  electrician: Battery,
  towing: Ship,
};

/**
 * Captain intake for the technical / underwater service network
 * (diver wrap, engine, battery boost, tow) — separate from the red SOS job.
 */
export function EmergencyServiceSheet({
  open,
  onClose,
  initialBayName,
  initialCategory = "diver",
}: Props) {
  const { t } = useTranslation();
  const { user } = useSessionUser();
  const { profile } = n(user?.id);
  const [category, setCategory] = useState<EmergencyServiceCategory>(initialCategory);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"urgent" | "standard">("urgent");
  const [coords, setCoords] = useState<GeoFix | null>(null);
  const [bayName, setBayName] = useState(initialBayName ?? "");
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);

  const locate = useCallback(async () => {
    setLocating(true);
    const res = await getFix();
    if (res.ok) setCoords(res.fix);
    else {
      toast.error(t(res.failure.messageKey, { defaultValue: res.failure.defaultMessage }));
      setCoords(null);
    }
    setLocating(false);
  }, [t]);

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
    const ctx = getCockpitContext();
    setBayName(initialBayName?.trim() || ctx.selectedBay?.name || "");
    setDescription("");
    setUrgency("urgent");
    void locate();
  }, [open, initialBayName, initialCategory, locate]);

  if (!open || typeof document === "undefined") return null;

  const submit = async () => {
    if (sending) return;
    if (!user) {
      toast.error(t("esvc.need_session"));
      return;
    }
    if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
      toast.error(t("geo.required_sos", { defaultValue: "Location unavailable." }));
      return;
    }
    setSending(true);
    const ctx = getCockpitContext();
    const vessel = sanitizePlainText(profile?.boat_name || ctx.vessel?.name || "", 80);
    const note = sanitizeMultiline(description, 2000);
    const bay = sanitizePlainText(bayName, 120) || null;
    // Battery boost and towing stay on the usta desk. There is no electrician trade.
    const serviceType = category === "diver" ? "Underwater Diver" : "Marine Mechanic";
    const problem =
      category === "diver"
        ? "rope_propeller"
        : category === "electrician"
          ? "electrical"
          : category === "towing"
            ? "other_mech"
            : "engine_breakdown";
    const brief = [vessel ? `${t("ops.vessel")}: ${vessel}` : "", note]
      .filter(Boolean)
      .join("\n")
      .slice(0, 4000);
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        client_id: user.id,
        service_type: serviceType,
        problem_category: problem,
        description: brief || t(EMERGENCY_CATEGORY_LABEL_KEYS[category]),
        marina: bay || t("esvc.open_water"),
        ...fixToJobFields(coords),
      })
      .select("id")
      .single();
    if (jobError || !job) {
      setSending(false);
      toast.error(jobError?.message ?? t("ops.cancel_failed"));
      return;
    }
    const { error } = await supabase.from("emergency_service_requests").insert({
      user_id: user.id,
      job_id: job.id,
      vessel_name: vessel,
      category,
      lat: coords.lat,
      lng: coords.lng,
      bay_name: bay,
      description: note,
      urgency_level: urgency,
      status: "pending",
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("esvc.sent"));
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="presentation">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={() => {
          if (!sending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#C9B896]/30 bg-[#0C2226] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)]"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9B896]/80">
              {t("esvc.eyebrow")}
            </p>
            <h2 className="text-base font-semibold text-white">{t("esvc.title")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full text-white/70 hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_SERVICE_CATEGORIES.map((key) => {
              const Icon = CAT_ICON[key];
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={
                    "flex h-16 items-center gap-2.5 rounded-2xl border px-3 text-left transition-colors " +
                    (active
                      ? "border-[#C9B896]/45 bg-[#C9B896]/12 text-[#E8DFC8]"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]")
                  }
                >
                  <span
                    className={
                      "grid size-9 shrink-0 place-items-center rounded-xl " +
                      (active ? "bg-[#C9B896]/20" : "bg-white/10")
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[12px] font-semibold leading-tight">
                    {t(EMERGENCY_CATEGORY_LABEL_KEYS[key])}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {t("esvc.position")}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-mono text-[12px] text-[#E8DFC8]">
                {coords
                  ? `${coords.lat.toFixed(5)} N  ${coords.lng.toFixed(5)} E`
                  : locating
                    ? t("common.loading")
                    : t("esvc.no_fix")}
              </p>
              <button
                type="button"
                onClick={() => void locate()}
                disabled={locating}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#C9B896]/35 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9B896]"
              >
                {locating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MapPin className="size-3.5" />
                )}
                GPS
              </button>
            </div>
            {bayName ? (
              <p className="mt-1 truncate text-[12px] text-white/60">{bayName}</p>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {t("esvc.note")}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t("esvc.note_ph")}
              className="w-full rounded-xl border border-[#C9B896]/30 bg-[#0c2226]/70 px-3 py-2 text-[13px] text-white outline-none focus:border-[#C9B896]/55"
            />
          </label>

          <div className="flex gap-2">
            {(["urgent", "standard"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setUrgency(level)}
                className={
                  "h-10 flex-1 rounded-xl border text-[11px] font-semibold uppercase tracking-[0.14em] " +
                  (urgency === level
                    ? level === "urgent"
                      ? "border-red-400/50 bg-red-500/20 text-red-100"
                      : "border-[#C9B896]/40 bg-[#C9B896]/12 text-[#E8DFC8]"
                    : "border-white/10 bg-white/[0.03] text-white/55")
                }
              >
                {t(`esvc.urgency_${level}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-1">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={sending || locating || !coords}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C9B896] text-[13px] font-black uppercase tracking-wider text-[#0C2226] disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : <Radio className="size-5" />}
            {t("esvc.send")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
