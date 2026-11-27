import { getFix, fixToJobFields } from "@/lib/geolocation";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/session";

import { Wrench, Anchor, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { emitEvent } from "@/lib/events";
import { sanitizePlainText } from "@/lib/sanitize";
import { CockpitHeader } from "@/components/core/CockpitHeader";
import { LiveOpsPanel } from "@/components/mission/LiveOpsPanel";
import { EmptyState } from "@/components/core/EmptyState";
import { SHEET_PANEL, SHEET_SCRIM, SheetHandle, useSheetChrome } from "@/lib/sheet-chrome";
import { packageTitleLang } from "@/lib/ai-lang";

export const Route = createFileRoute("/_authenticated/app/services")({
  ssr: false,
  component: ServicesPage,
});

interface Pkg {
  id: string;
  key: string;
  title_tr: string;
  title_en: string;
  category: "mechanic" | "diver";
  base_duration_min: number;
}

function ServicesPage() {
  const routeUser = Route.useRouteContext().user;
  const { user: sessionUser } = useSessionUser();
  const user = sessionUser ?? routeUser;
  if (!user) return null;
  return <Services />;
}

function Services() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<"mechanic" | "diver">("mechanic");
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadPackages = () => {
    setLoadError(false);
    supabase
      .from("service_packages")
      .select("*")
      .order("key")
      .then(({ data, error }) => {
        if (error) {
          console.warn("[services] service_packages unavailable", error.message);
          setLoadError(true);
          setPackages([]);
          return;
        }
        setPackages((data as never) ?? []);
      });
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const visible = useMemo(
    () => packages.filter((p) => p.category === filter),
    [packages, filter],
  );
  const label = (p: Pkg) =>
    packageTitleLang(i18n.language) === "en" ? p.title_en : p.title_tr;

  return (
    <div className="space-y-6">
      <LiveOpsPanel />

      <CockpitHeader
        eyebrow={t("services.eyebrow")}
        title={t("services.title")}
        subtitle={t("services.subtitle")}
      />

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("mechanic")}
          className={
            "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold uppercase tracking-[0.14em] transition-colors " +
            (filter === "mechanic"
              ? "border-[#C9B896]/50 bg-[#C9B896]/15 text-[#E8DFC8]"
              : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10")
          }
        >
          <Wrench className="size-4" /> {t("services.filter_mech")}
        </button>
        <button
          onClick={() => setFilter("diver")}
          className={
            "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold uppercase tracking-[0.14em] transition-colors " +
            (filter === "diver"
              ? "border-[#C9B896]/50 bg-[#C9B896]/15 text-[#E8DFC8]"
              : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10")
          }
        >
          <Anchor className="size-4" /> {t("services.filter_diver")}
        </button>
      </div>

      {loadError ? (
        <EmptyState
          icon={<Wrench className="size-4" />}
          title={t("services.load_error_title")}
          body={t("services.load_error_body")}
          action={
            <button
              type="button"
              onClick={loadPackages}
              className="inline-flex h-10 items-center rounded-md bg-[#C9B896] px-4 text-[12px] font-bold text-[#1A1406] hover:bg-[#d4c4a8]"
            >
              {t("common.retry", { defaultValue: "Retry" })}
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Wrench className="size-4" />}
          title={t("services.empty_title")}
          body={t("services.empty_body")}
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelected(p)}
                className="glass-panel flex w-full items-center justify-between rounded-2xl p-4 text-left transition-colors hover:border-[#C9B896]/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{label(p)}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9B896]/85">
                    {t("services.request_quote")}
                  </p>
                </div>
                <span className="text-lg text-white/40">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <PackageQuoteSheet
          pkg={selected}
          label={label(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/**
 * Broadcast a package quote to verified providers (mechanic or diver).
 * Providers bid with submit_offer on the open Pending job — no pre-listed
 * provider_service_packages required.
 */
function PackageQuoteSheet({
  pkg,
  label,
  onClose,
}: {
  pkg: Pkg;
  label: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useSessionUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const isDiver = pkg.category === "diver";

  useSheetChrome(onClose);

  const sendQuote = async () => {
    if (!user || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const res = await getFix();
      if (!res.ok) {
        throw new Error(t(res.failure.messageKey, { defaultValue: res.failure.defaultMessage }));
      }
      const fields = fixToJobFields(res.fix);
      const { data, error } = await supabase.rpc("request_service_quote", {
        _package_id: pkg.id,
        _lat: fields.lat,
        _lng: fields.lng,
        _marina: "Göcek",
        _description: sanitizePlainText(`Teklif talebi · ${label}`, 400),
        _location_accuracy_m: fields.location_accuracy_m ?? undefined,
        _location_captured_at: fields.location_captured_at ?? undefined,
      });
      if (error) throw new Error(error.message);
      const jobId = data as string;
      emitEvent({
        type: "mission.created",
        subject_type: "mission",
        subject_id: jobId,
        metadata: { source: "service_package_quote", package: pkg.key, category: pkg.category },
      });
      toast.success(t("services.quote_sent"));
      onClose();
      navigate({ to: "/app/job/$id", params: { id: jobId } });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("services.quote_failed");
      toast.error(message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className={SHEET_SCRIM} onClick={onClose}>
      <div className={SHEET_PANEL + " sm:max-w-xl"} onClick={(e) => e.stopPropagation()}>
        <SheetHandle />
        <div className="flex items-center justify-between border-b border-white/10 px-5 pb-3 pt-2 sm:pt-5">
          <p className="font-semibold uppercase tracking-tight text-white">{label}</p>
          <button onClick={onClose} className="text-xs text-white/50 hover:text-white/80">
            {t("common.close")}
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="rounded-2xl border border-[#C9B896]/25 bg-[#C9B896]/08 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-[#C9B896]/35 bg-[#0C2226]/60 text-[#C9B896]">
                {isDiver ? <Anchor className="size-5" /> : <Wrench className="size-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9B896]/85">
                  {isDiver ? t("services.filter_diver") : t("services.filter_mech")}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/75">
                  {t("services.quote_broadcast_body")}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void sendQuote()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C9B896] text-[13px] font-bold uppercase tracking-[0.12em] text-[#0C2226] transition hover:bg-[#d4c4a8] disabled:opacity-55"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
            {t("services.request_quote")}
          </button>
        </div>
      </div>
    </div>
  );
}
