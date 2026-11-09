import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MockMap, type MapPin } from "@/components/MockMap";
import { CheckoutModal } from "@/components/CheckoutModal";
import { JobChat } from "@/components/JobChat";
import { useProfile, useSessionUser } from "@/lib/session";
import { formatTL, harborDistanceKm, kmToNm } from "@/lib/filter";
import { getFix, watchFix } from "@/lib/geolocation";
import { autoEtaMinutesBetween } from "@/lib/geo-eta";
import { noteSchemaMiss, skipMissing } from "@/lib/schema-gap";
import { VesselRange } from "@/components/mission/VesselRange";
import { caretAfterGrouping, groupThousands, parseGrouped } from "@/lib/digit-format";
import {
  AlertOctagon,
  Anchor,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin as PinIcon,
  Package,
  Send,
  Star,
  Wrench,
} from "lucide-react";
import { MissionStatusTrack, stageFromJob } from "@/components/mission/MissionStatusTrack";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { StatusChip } from "@/components/mission/StatusChip";
import { OfferCard } from "@/components/mission/OfferCard";
import { EscrowPanel, type EscrowUiState } from "@/components/mission/EscrowPanel";
import { PaymentTimeline, deriveEscrow } from "@/components/mission/PaymentTimeline";
import { TrustExplanationSheet } from "@/components/trust/TrustExplanationSheet";
import { computeTrust, type TrustReport } from "@/lib/trust";
import { loadTrustSignals } from "@/lib/trust-signals";
import { emitEvent } from "@/lib/events";
import {
  PaymentIntentPanel,
  type PaymentIntentRow,
} from "@/components/payments/PaymentIntentPanel";
import { EscrowLedgerPanel, type EscrowLedgerRow } from "@/components/payments/EscrowLedgerPanel";
import {
  ProviderPayoutPanel,
  type ProviderPayoutRow,
} from "@/components/payments/ProviderPayoutPanel";
import { CommissionBreakdown } from "@/components/payments/CommissionBreakdown";
import { computeCommission, readCompleteJobResult } from "@/lib/payments";
import { sanitizePlainText } from "@/lib/sanitize";

export const Route = createFileRoute("/_authenticated/app/job/$id")({
  ssr: false,
  component: JobPage,
});

interface Job {
  id: string;
  client_id: string;
  provider_id: string | null;
  service_type: "Marine Mechanic" | "Underwater Diver";
  problem_category: string;
  description: string;
  photo_url: string | null;
  marina: string;
  lat: number;
  lng: number;
  status: string;
  initial_labor_cost: number;
  extra_parts_cost: number;
  total_escrow_pool: number;
  eta_minutes: number | null;
  dispatched_at: string | null;
}
interface Offer {
  id: string;
  provider_id: string;
  price: number;
  eta_minutes: number;
  note: string | null;
  profiles: { full_name: string } | null;
  provider_details: {
    rating: number;
    lat: number | null;
    lng: number | null;
    service_type: string;
    jobs_completed: number | null;
    certification_url: string | null;
  } | null;
}
interface Part {
  id: string;
  part_name: string;
  part_price: number;
  part_image_url: string | null;
  source: string;
  payment_status: "Pending" | "Paid" | "Rejected";
}

function JobPage() {
  const { id } = Route.useParams();
  const { user } = useSessionUser();
  const { profile } = useProfile(user?.id);
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const load = () =>
      supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => setJob((data as Job) ?? null));
    load();
    const ch = supabase
      .channel(`job:${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `id=eq.${id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  if (!user || !profile || !job) {
    return (
      <div className="min-h-dvh grid place-items-center bg-deep text-white">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  const isClient = profile.role === "Client";
  return (
    <>{isClient ? <ClientJob job={job} meId={user.id} /> : <ProviderJob job={job} meId={user.id} />}
    </>
  );
}

/* ---------------- CLIENT ---------------- */
function JobBrief({
  description,
  photoPath,
  problem,
}: {
  description: string;
  photoPath: string | null;
  problem: string;
}) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const problemLabel = t(`problems.${problem}`, { defaultValue: problem });
  const text = description.trim();
  const showText = text.length > 0 && text !== problemLabel;

  useEffect(() => {
    if (!photoPath) {
      setUrl(null);
      return;
    }
    if (photoPath.startsWith("http")) {
      setUrl(photoPath);
      return;
    }
    let cancel = false;
    void supabase.storage
      .from("job-photos")
      .createSignedUrl(photoPath, 60 * 30)
      .then(({ data }) => {
        if (!cancel && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      cancel = true;
    };
  }, [photoPath]);

  if (!showText && !url) return null;
  return (
    <GlassPanel className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {t("sos_sheet.brief_title")}
      </p>
      {showText && <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">{text}</p>}
      {url && <img src={url} alt="" className="h-40 w-full rounded-xl object-cover" />}
    </GlassPanel>
  );
}

function ClientJob({ job, meId }: { job: Job; meId: string }) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [checkout, setCheckout] = useState<
    { kind: "offer"; offer: Offer } | { kind: "part"; part: Part } | null
  >(null);
  const [tick, setTick] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [trustFor, setTrustFor] = useState<Offer | null>(null);
  const [trustReport, setTrustReport] = useState<TrustReport | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const closed = job.status === "Completed" || job.status === "Cancelled";

  useEffect(() => {
    if (closed) return;
    let stop = false;
    const push = async () => {
      const res = await getFix();
      if (!res.ok || stop) return;
      const rpc = skipMissing("refresh_own_call_position")
        ? { error: { message: "missing" } }
        : await supabase.rpc("refresh_own_call_position", {
            _job_id: job.id,
            _lat: res.fix.lat,
            _lng: res.fix.lng,
            _accuracy_m: Number.isFinite(res.fix.accuracy) ? Math.round(res.fix.accuracy) : undefined,
          });
      if (rpc.error) {
        noteSchemaMiss("refresh_own_call_position", rpc.error);
        await supabase
          .from("jobs")
          .update({
            lat: res.fix.lat,
            lng: res.fix.lng,
            location_accuracy_m: Math.round(res.fix.accuracy),
            location_captured_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
    };
    void push();
    const id = window.setInterval(() => void push(), 20000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [job.id, closed]);

  const cancelCall = async () => {
    setCancelling(true);
    if (skipMissing("cancel_own_call")) {
      setCancelling(false);
      toast.error(t("ops.cancel_failed"));
      return;
    }
    const { error } = await supabase.rpc("cancel_own_call", { _job_id: job.id });
    if (error) noteSchemaMiss("cancel_own_call", error);
    setCancelling(false);
    if (error) toast.error(t("ops.cancel_failed"));
    else toast.success(t("ops.cancel_done"));
  };

  useEffect(() => {
    const providerId = trustFor?.provider_id;
    if (!providerId) {
      setTrustReport(null);
      return;
    }
    let live = true;
    loadTrustSignals(providerId).then((signals) => {
      if (!live) return;
      setTrustReport(computeTrust({
        ...signals,
        rating: signals.rating ?? trustFor?.provider_details?.rating ?? null,
        jobsCompleted: signals.jobsCompleted ?? trustFor?.provider_details?.jobs_completed ?? null,
        verified: signals.verified || Boolean(trustFor?.provider_details?.certification_url),
      }));
    });
    return () => { live = false; };
  }, [trustFor]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (job.status !== "Pending" && job.status !== "Offered") {
      setOffers([]);
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select(
          "id, provider_id, price, eta_minutes, note, profiles!job_offers_provider_id_fkey(full_name)",
        )
        .eq("job_id", job.id)
        .order("price");

      if (error) {
        console.warn("[offers] captain offer query failed", {
          jobId: job.id,
          table: "job_offers",
          message: error.message,
        });
        setOffers([]);
        return;
      }

      const rows = (data ?? []) as Array<Omit<Offer, "provider_details">>;
      const providerIds = Array.from(new Set(rows.map((offer) => offer.provider_id)));
      let detailsByProvider = new Map<string, Offer["provider_details"]>();

      if (providerIds.length > 0) {
        const { data: details, error: detailsError } = await supabase
          .from("provider_details")
          .select("id, rating, lat, lng, service_type, jobs_completed, certification_url")
          .in("id", providerIds);

        if (detailsError) {
          console.warn("[offers] provider metadata unavailable", {
            jobId: job.id,
            message: detailsError.message,
          });
        } else {
          detailsByProvider = new Map(
            (details ?? []).map((detail) => [
              detail.id,
              {
                rating: detail.rating,
                lat: detail.lat,
                lng: detail.lng,
                service_type: detail.service_type,
                jobs_completed: detail.jobs_completed,
                certification_url: detail.certification_url,
              },
            ]),
          );
        }
      }

      setOffers(
        rows.map((offer) => ({
          ...offer,
          provider_details: detailsByProvider.get(offer.provider_id) ?? null,
        })),
      );
    };
    load();
    const ch = supabase
      .channel(`offers:${job.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_offers", filter: `job_id=eq.${job.id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [job.id, job.status]);

  useEffect(() => {
    const load = () =>
      supabase
        .from("job_parts")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at")
        .then(({ data }) => setParts((data as never) ?? []));
    load();
    const ch = supabase
      .channel(`parts:${job.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_parts", filter: `job_id=eq.${job.id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [job.id]);

  // M9 payment/escrow rows for this job. Realtime-friendly.
  const [intent, setIntent] = useState<PaymentIntentRow | null>(null);
  const [ledger, setLedger] = useState<EscrowLedgerRow[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data: pi } = await supabase
        .from("payment_intents")
        .select(
          "id, status, amount_cents, currency, provider, external_ref, secured_at, released_at, created_at",
        )
        .eq("job_id", job.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setIntent((pi as PaymentIntentRow | null) ?? null);
      const { data: tx } = await supabase
        .from("escrow_transactions")
        .select("id, kind, amount_cents, currency, notes, created_at")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false });
      setLedger((tx as EscrowLedgerRow[] | null) ?? []);
    };
    load();
    const ch = supabase
      .channel(`pay:${job.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_intents", filter: `job_id=eq.${job.id}` },
        load,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "escrow_transactions",
          filter: `job_id=eq.${job.id}`,
        },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [job.id]);

  const [providerPos, setProviderPos] = useState<MapPin | null>(null);
  const [providerLiveAt, setProviderLiveAt] = useState<number | null>(null);

  useEffect(() => {
    if (!job.provider_id) return;
    const apply = (data: {
      id: string;
      service_type: string;
      lat: number | null;
      lng: number | null;
      updated_at?: string | null;
      profiles: { full_name: string } | null;
    } | null) => {
      if (!data || data.lat == null || data.lng == null) {
        setProviderPos(null);
        setProviderLiveAt(null);
        return;
      }
      setProviderPos({
        id: data.id,
        name: data.profiles?.full_name ?? t("mission.provider_fallback"),
        lat: Number(data.lat),
        lng: Number(data.lng),
        kind: data.service_type === "Underwater Diver" ? "diver" : "mechanic",
        highlighted: true,
      });
      setProviderLiveAt(data.updated_at ? new Date(data.updated_at).getTime() : Date.now());
    };

    void supabase
      .from("provider_details")
      .select("id, service_type, lat, lng, updated_at, profiles(full_name)")
      .eq("id", job.provider_id)
      .maybeSingle()
      .then(({ data }) => apply(data as never));

    const ch = supabase
      .channel(`provider-live:${job.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_details",
          filter: `id=eq.${job.provider_id}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            service_type: string;
            lat: number | null;
            lng: number | null;
            updated_at?: string | null;
          };
          setProviderPos((prev) => {
            if (row.lat == null || row.lng == null) return null;
            return {
              id: row.id,
              name: prev?.name ?? t("mission.provider_fallback"),
              lat: Number(row.lat),
              lng: Number(row.lng),
              kind: row.service_type === "Underwater Diver" ? "diver" : "mechanic",
              highlighted: true,
            };
          });
          setProviderLiveAt(row.updated_at ? new Date(row.updated_at).getTime() : Date.now());
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [job.provider_id, job.id, t]);

  const liveProviderFresh =
    providerLiveAt != null && Date.now() - providerLiveAt < 120_000;

  const enRouteEta = useMemo(() => {
    if (job.status !== "EnRoute") return null;
    // Prefer remaining time from live range when the responder fix is fresh.
    if (liveProviderFresh && providerPos && Number.isFinite(job.lat) && Number.isFinite(job.lng)) {
      return autoEtaMinutesBetween(providerPos, { lat: job.lat, lng: job.lng });
    }
    if (!job.dispatched_at || !job.eta_minutes) return null;
    return Math.max(
      0,
      job.eta_minutes - Math.floor((Date.now() - new Date(job.dispatched_at).getTime()) / 60000),
    );
  }, [
    job.status,
    job.dispatched_at,
    job.eta_minutes,
    job.lat,
    job.lng,
    providerPos,
    liveProviderFresh,
    tick,
  ]);

  // Live GPS pin wins; only interpolate when the last provider fix is stale.
  const overridePos = useMemo(() => {
    if (!providerPos) return undefined;
    if (liveProviderFresh) {
      return { [providerPos.id]: { lat: providerPos.lat, lng: providerPos.lng } };
    }
    if (!job.dispatched_at || !job.eta_minutes) return undefined;
    const providerLegacy = Math.abs(providerPos.lat) < 1 && Math.abs(providerPos.lng) < 1;
    const jobLegacy = Math.abs(job.lat) < 1 && Math.abs(job.lng) < 1;
    if (providerLegacy !== jobLegacy) {
      return { [providerPos.id]: { lat: job.lat, lng: job.lng } };
    }
    const elapsed = Math.min(
      1,
      (Date.now() - new Date(job.dispatched_at).getTime()) / (job.eta_minutes * 60000),
    );
    return {
      [providerPos.id]: {
        lat: providerPos.lat + (job.lat - providerPos.lat) * elapsed,
        lng: providerPos.lng + (job.lng - providerPos.lng) * elapsed,
      },
    };
  }, [providerPos, liveProviderFresh, job.dispatched_at, job.eta_minutes, job.lat, job.lng, tick]);

  const pendingPart = parts.find((p) => p.payment_status === "Pending");

  const navigate = useNavigate();
  const complete = async () => {
    setCompleting(true);
    const { data, error } = await supabase.rpc("complete_job", { _job_id: job.id });
    if (error) {
      console.error("[job] complete_job failed", error);
      toast.error(t("owner.complete_failed"));
      setCompleting(false);
      return;
    }
    // Idempotent RPC. Escrow / commission / payout events are written
    // server-side by complete_job — the client must not forge them.
    const outcome = readCompleteJobResult(data);
    if (outcome === "unknown") {
      console.error("[job] complete_job returned an unexpected shape", data);
      toast.error(t("owner.complete_failed"));
      setCompleting(false);
      return;
    }
    setCompleting(false);
    navigate({ to: "/app" });
  };

  // Escrow UI state derived from job status.
  // TODO(payments): replace with real Stripe/escrow ledger events.
  const escrowUi: EscrowUiState = (() => {
    if (job.status === "Pending" || job.status === "Offered") return "awaiting";
    if (job.status === "PartsPending") return "extras_pending";
    if (job.status === "Completed") return "released";
    return "secured";
  })();
  const timeline = deriveEscrow(
    {
      status: job.status,
      total_escrow_pool: Number(job.total_escrow_pool),
      extra_parts_cost: Number(job.extra_parts_cost),
    },
    parts.map((p) => ({ payment_status: p.payment_status })),
  );
  const commission = Math.round(Number(job.total_escrow_pool) * 0.1);

  return (
    <div className="thalvo-dark space-y-4 -m-4 p-4 min-h-[calc(100dvh-4rem)] thalvo-cockpit">
      <GlassPanel className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusChip
              tone={
                job.status === "Completed"
                  ? "success"
                  : job.status === "Pending" || job.status === "Offered"
                    ? "warning"
                    : "info"
              }
            >
              {t(`status.${job.status}`)}
            </StatusChip>
            <h1 className="mt-2 text-lg font-semibold text-white leading-tight">
              {t(`problems.${job.problem_category}`, { defaultValue: job.problem_category })}
            </h1>
            <p className="text-[11px] text-white/50 mt-0.5 inline-flex items-center gap-1">
              <PinIcon className="size-3" /> {job.marina}
            </p>
          </div>
          {enRouteEta !== null && job.status === "EnRoute" && (
            <StatusChip tone="info" icon={<Clock className="size-3" />}>
              {t("owner.arriving_in", { min: enRouteEta })}
            </StatusChip>
          )}
        </div>
        <div className="pt-3 border-t border-white/10">
          <MissionStatusTrack stage={stageFromJob(job.status, offers.length)} />
        </div>
        {!closed && Number.isFinite(job.lat) && Number.isFinite(job.lng) && (
          <p className="text-[11px] text-white/50">{t("ops.live_position")}</p>
        )}
        {!closed && (
          <button
            type="button"
            onClick={() => void cancelCall()}
            disabled={cancelling}
            className="h-11 w-full rounded-xl border border-red-400/40 text-[12px] font-semibold uppercase tracking-[0.12em] text-red-200 disabled:opacity-50"
          >
            {cancelling ? t("ops.cancelling") : t("ops.cancel_call")}
          </button>
        )}
      </GlassPanel>
      <JobBrief description={job.description} photoPath={job.photo_url} problem={job.problem_category} />

      {!closed && Number.isFinite(job.lat) && Number.isFinite(job.lng) && (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <MockMap
            providers={providerPos ? [providerPos] : []}
            jobs={[{ id: job.id, lat: job.lat, lng: job.lng, marina: job.marina }]}
            overridePositions={overridePos}
          />
          {job.status === "EnRoute" && enRouteEta !== null && (
            <div className="border-t border-white/10 bg-black/40 px-3 py-2 text-[11px] text-cyan-100/90">
              {t("owner.arriving_in", { min: enRouteEta })}
              {liveProviderFresh ? ` · ${t("ops.live_position")}` : ""}
            </div>
          )}
        </div>
      )}

      {(job.status === "Pending" || job.status === "Offered") && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-2 px-1">
            {t("owner.offers_title")} · {offers.length}
          </p>
          {offers.length === 0 ? (
            <GlassPanel className="text-center">
              <Loader2 className="mx-auto size-5 animate-spin text-amber-300 mb-2" />
              <p className="text-sm text-white/60">{t("owner.no_offers")}</p>
              <p className="text-[11px] text-white/40 mt-1">{t("mission.broadcasting_hint")}</p>
            </GlassPanel>
          ) : (
            <ul className="space-y-2">
              {offers.map((o) => {
                // No fabricated positions: providers without a real fix show no distance.
                const dist =
                  o.provider_details &&
                  o.provider_details.lat != null &&
                  o.provider_details.lng != null
                    ? harborDistanceKm(
                        o.provider_details.lat,
                        o.provider_details.lng,
                        job.lat,
                        job.lng,
                      )
                    : null;
                return (
                  <li key={o.id}>
                    <OfferCard
                      offer={{
                        id: o.id,
                        providerName:
                          o.profiles?.full_name ?? t("mission.verified_provider_pending"),
                        role:
                          o.provider_details?.service_type === "Underwater Diver"
                            ? "diver"
                            : "mechanic",
                        price: Number(o.price),
                        etaMinutes: o.eta_minutes,
                        distanceKm: dist,
                        rating: o.provider_details?.rating,
                        verified: Boolean(o.provider_details?.certification_url),
                        jobsCompleted: o.provider_details?.jobs_completed ?? null,
                        note: o.note,
                      }}
                      currencyFormat={(n) => formatTL(n)}
                      onAccept={() => setCheckout({ kind: "offer", offer: o })}
                      onExplainTrust={() => setTrustFor(o)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {job.status !== "Pending" && job.status !== "Offered" && (
        <EscrowPanel
          state={escrowUi}
          amountLabel={formatTL(Number(job.total_escrow_pool))}
          providerName={providerPos?.name ?? null}
          commissionLabel={escrowUi === "released" ? formatTL(commission) : null}
          onApproveExtras={
            pendingPart ? () => setCheckout({ kind: "part", part: pendingPart }) : undefined
          }
          extrasLabel={pendingPart ? formatTL(Number(pendingPart.part_price)) : undefined}
        >
          {(job.initial_labor_cost > 0 ||
            parts.filter((p) => p.payment_status === "Paid").length > 0) && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1 text-[12px]">
              <div className="flex justify-between text-white/70">
                <span>{t("owner.labor_cost")}</span>
                <span className="tabular-nums">{formatTL(Number(job.initial_labor_cost))}</span>
              </div>
              {parts
                .filter((p) => p.payment_status === "Paid")
                .map((p) => (
                  <div key={p.id} className="flex justify-between text-white/50">
                    <span className="truncate">· {p.part_name}</span>
                    <span className="tabular-nums">{formatTL(Number(p.part_price))}</span>
                  </div>
                ))}
            </div>
          )}
          <PaymentTimeline
            currentIndex={timeline.currentIndex}
            reachedFlags={timeline.reachedFlags}
          />
        </EscrowPanel>
      )}

      {job.status !== "Pending" && job.status !== "Offered" && (
        <details className="group rounded-2xl border border-white/10 bg-white/[0.02]">
          <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-white/80">
            <span>{t("mission.details")}</span>
            <span className="text-white/40 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="p-3 pt-1 space-y-3">
            <PaymentIntentPanel intent={intent} />
            <EscrowLedgerPanel rows={ledger} />
          </div>
        </details>
      )}

      {["OnSite", "InProgress"].includes(job.status) && !pendingPart && (
        <button
          onClick={complete}
          disabled={completing}
          className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {completing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-5" />
          )}
          {t("owner.confirm_complete")} · {t("mission.release_escrow")}
        </button>
      )}
      {job.status === "PartsPending" && pendingPart && (
        <GlassPanel className="text-sm text-amber-100/90">
          {t("owner.approve_extras_before_complete")}
        </GlassPanel>
      )}

      {job.provider_id && <JobChat jobId={job.id} meId={meId} />}

      {pendingPart && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 amber-gradient text-warning-foreground flex items-center gap-2">
              <AlertOctagon className="size-5" />
              <p className="font-bold">{t("owner.part_alert")}</p>
            </div>
            {pendingPart.part_image_url && (
              <img src={pendingPart.part_image_url} alt="" className="w-full h-40 object-cover" />
            )}
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{pendingPart.part_name}</span>
                <span className="tabular-nums font-bold">
                  {formatTL(Number(pendingPart.part_price))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Package className="size-3" /> {pendingPart.source}
              </p>
              <div className="rounded-xl bg-muted/40 p-3 text-xs">
                <div className="flex justify-between">
                  <span>{t("owner.labor_cost")}</span>
                  <span className="tabular-nums">{formatTL(Number(job.initial_labor_cost))}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("owner.parts_cost")}</span>
                  <span className="tabular-nums">+ {formatTL(Number(pendingPart.part_price))}</span>
                </div>
              </div>
              <button
                onClick={() => setCheckout({ kind: "part", part: pendingPart })}
                className="w-full h-12 rounded-xl amber-gradient text-warning-foreground font-bold"
              >
                {t("checkout.parts_pay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkout?.kind === "offer" && (
        <CheckoutModal
          open
          amount={Number(checkout.offer.price)}
          title={checkout.offer.profiles?.full_name ?? t("mission.provider_fallback")}
          subtitle={t("owner.accept_offer")}
          tone="marine"
          onClose={() => setCheckout(null)}
          onPaid={async () => {
            const offerId = checkout.offer.id;
            const price = Number(checkout.offer.price);
            const { error: acceptErr } = await supabase.rpc("accept_offer", {
              _job_id: job.id,
              _offer_id: offerId,
            });
            if (acceptErr) throw new Error(acceptErr.message);
            // Simulated payment intent — real PSP webhook will replace this
            // once Stripe / iyzico / PayTR is wired.
            const { data: intentId, error: intentErr } = await supabase.rpc(
              "record_payment_intent",
              {
                _job_id: job.id,
                _offer_id: offerId,
                // Conscious demo ack from CheckoutModal — silent RPC cannot secure funds.
                _demo_ack: true,
              },
            );
            if (intentErr) throw new Error(intentErr.message);
            emitEvent({
              type: "offer.accepted",
              subject_type: "offer",
              subject_id: offerId,
              metadata: { job_id: job.id, price, simulated: true },
              severity: "success",
            });
            // payment.secured / escrow.secured are written server-side by
            // record_payment_intent (or the PSP webhook in live mode).
            emitEvent({
              type: "payment.intent_created",
              subject_type: "job",
              subject_id: job.id,
              metadata: { intent_id: intentId, amount: price, provider: "simulated" },
            });
          }}
        />
      )}
      {checkout?.kind === "part" && (
        <CheckoutModal
          open
          amount={Number(checkout.part.part_price)}
          title={checkout.part.part_name}
          subtitle={checkout.part.source}
          tone="amber"
          cta={t("checkout.parts_pay")}
          onClose={() => setCheckout(null)}
          onPaid={async () => {
            const partId = checkout.part.id;
            const { error } = await supabase.rpc("approve_part", {
              _part_id: partId,
              _demo_ack: true,
            });
            if (error) throw new Error(error.message);
            // Eagerly refetch parts so the outer "pending part" overlay
            // disappears immediately instead of waiting on realtime; without
            // this, the part-pay screen looked stuck after the modal closed.
            const { data: freshParts } = await supabase
              .from("job_parts")
              .select("*")
              .eq("job_id", job.id)
              .order("created_at");
            if (freshParts) setParts(freshParts as never);
            // Extra-part approve stays simulated until PSP; do not forge payment.secured
            // from the client (server allowlist rejects it for non-admins).
            emitEvent({
              type: "payment.intent_created",
              subject_type: "job",
              subject_id: job.id,
              metadata: {
                amount: Number(checkout.part.part_price),
                kind: "extra_part",
                simulated: true,
              },
            });
          }}
        />
      )}
      <TrustExplanationSheet
        open={!!trustFor}
        onClose={() => setTrustFor(null)}
        subject={trustFor?.profiles?.full_name ?? t("mission.provider_fallback")}
        report={trustReport ?? computeTrust({
          rating: trustFor?.provider_details?.rating ?? null,
          jobsCompleted: trustFor?.provider_details?.jobs_completed ?? null,
          verified: Boolean(trustFor?.provider_details?.certification_url),
        })}
      />
    </div>
  );
}

/* ---------------- PROVIDER ---------------- */
function ProviderJob({ job, meId }: { job: Job; meId: string }) {
  const { t } = useTranslation();
  const [parts, setParts] = useState<Part[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [partName, setPartName] = useState("");
  const [partPrice, setPartPrice] = useState("");
  const [partPhoto, setPartPhoto] = useState("");
  const [source, setSource] = useState("Tedarikçi Firma (Local Supplier)");
  const [busy, setBusy] = useState(false);
  const [bidPrice, setBidPrice] = useState("");
  const [bidEta, setBidEta] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [bidding, setBidding] = useState(false);
  const openForBid =
    !job.provider_id && (job.status === "Pending" || job.status === "Offered");
  const tracking =
    job.provider_id === meId &&
    ["Accepted", "EnRoute", "OnSite", "InProgress", "PartsPending"].includes(job.status);

  useEffect(() => {
    const load = () =>
      supabase
        .from("job_parts")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at")
        .then(({ data }) => setParts((data as never) ?? []));
    load();
    const ch = supabase
      .channel(`p-parts:${job.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_parts", filter: `job_id=eq.${job.id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [job.id]);

  // Broadcast a live device fix while the mission is active so the captain
  // chart shows the real responder, not a straight-line interpolation.
  useEffect(() => {
    if (!tracking) return;
    let lastSent = 0;
    const publish = (lat: number, lng: number, accuracy: number) => {
      const now = Date.now();
      if (now - lastSent < 8_000) return;
      lastSent = now;
      void supabase.rpc("refresh_own_provider_position", {
        _lat: lat,
        _lng: lng,
        _accuracy_m: Number.isFinite(accuracy) ? Math.round(accuracy) : undefined,
      });
    };
    void getFix().then((res) => {
      if (res.ok) publish(res.fix.lat, res.fix.lng, res.fix.accuracy);
    });
    return watchFix((fix) => publish(fix.lat, fix.lng, fix.accuracy));
  }, [tracking, job.id]);

  // M9 provider payout view.
  const [payout, setPayout] = useState<ProviderPayoutRow | null>(null);
  useEffect(() => {
    const load = () =>
      supabase
        .from("provider_payouts")
        .select("id, status, amount_cents, currency, requested_at, completed_at, external_ref")
        .eq("job_id", job.id)
        .eq("provider_id", meId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setPayout((data as ProviderPayoutRow | null) ?? null));
    load();
    const ch = supabase
      .channel(`ppay:${job.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "provider_payouts", filter: `job_id=eq.${job.id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [job.id, meId]);
  const providerCommission = computeCommission(Number(job.total_escrow_pool));

  const submitBid = async () => {
    if (!bidPrice || !bidEta) return;
    setBidding(true);
    const res = await getFix();
    if (res.ok) {
      await supabase.rpc("refresh_own_provider_position", {
        _lat: res.fix.lat,
        _lng: res.fix.lng,
        _accuracy_m: Number.isFinite(res.fix.accuracy) ? Math.round(res.fix.accuracy) : undefined,
      });
    }
    const { error } = await supabase.rpc("submit_offer", {
      _job_id: job.id,
      _price: parseGrouped(bidPrice),
      _eta_minutes: parseGrouped(bidEta),
      _note: bidNote.trim() || null,
    });
    setBidding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("ops_alerts.offer_sent"));
    setBidPrice("");
    setBidEta("");
    setBidNote("");
  };

  const setSail = async () => {
    // Seed provider_details with a fresh fix so set_sail can auto-fill ETA.
    const res = await getFix();
    if (res.ok) {
      await supabase.rpc("refresh_own_provider_position", {
        _lat: res.fix.lat,
        _lng: res.fix.lng,
        _accuracy_m: Number.isFinite(res.fix.accuracy) ? Math.round(res.fix.accuracy) : undefined,
      });
    }
    const { error } = await supabase.rpc("set_sail", { _job_id: job.id });
    if (error) toast.error(error.message);
  };
  const arrived = async () => {
    const { error } = await supabase.rpc("mark_arrived", { _job_id: job.id });
    if (error) toast.error(error.message);
  };
  const addPart = async () => {
    if (!partName || !partPrice) return;
    setBusy(true);
    await supabase.rpc("add_extra_part", {
      _job_id: job.id,
      _name: sanitizePlainText(partName, 200),
      _price: parseGrouped(partPrice),
      _photo: partPhoto || "https://images.unsplash.com/photo-1581092160607-ee22b1a3f4a1?w=400",
      _source: sanitizePlainText(source, 120),
    });
    setBusy(false);
    setShowAdd(false);
    setPartName("");
    setPartPrice("");
    setPartPhoto("");
  };

  return (
    <div className="space-y-4">
      <GlassPanel className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusChip tone="info">{t(`status.${job.status}`)}</StatusChip>
            <h1 className="mt-2 text-lg font-semibold text-white leading-tight">
              {t(`problems.${job.problem_category}`, { defaultValue: job.problem_category })}
            </h1>
            <p className="text-[11px] text-white/50 mt-0.5 inline-flex items-center gap-1">
              <PinIcon className="size-3" /> {job.marina}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              {t("escrow.pool_label")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {formatTL(Number(job.total_escrow_pool))}
            </p>
          </div>
        </div>
      </GlassPanel>
      <JobBrief description={job.description} photoPath={job.photo_url} problem={job.problem_category} />
      {Number.isFinite(job.lat) && Number.isFinite(job.lng) && Math.abs(job.lat) > 1 && (
        <VesselRange lat={job.lat} lng={job.lng} />
      )}

      {openForBid && (
        <GlassPanel className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            {t("ops_alerts.bid")}
          </p>
          <p className="text-sm text-white/70">{t("ops_alerts.pool_bid_hint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={bidPrice}
              onChange={(e) => {
                const next = groupThousands(e.target.value);
                setBidPrice(next);
                requestAnimationFrame(() => {
                  const el = e.target;
                  const caret = caretAfterGrouping(e.target.value, next, el.selectionStart);
                  el.setSelectionRange(caret, caret);
                });
              }}
              inputMode="decimal"
              placeholder={t("ops_alerts.bid_price", { defaultValue: "Price (TRY)" })}
              className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white"
            />
            <input
              value={bidEta}
              onChange={(e) => setBidEta(groupThousands(e.target.value))}
              inputMode="numeric"
              placeholder={t("ops_alerts.bid_eta", { defaultValue: "ETA (min)" })}
              className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white"
            />
          </div>
          <input
            value={bidNote}
            onChange={(e) => setBidNote(e.target.value)}
            placeholder={t("ops_alerts.bid_note", { defaultValue: "Note (optional)" })}
            className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white"
          />
          <button
            type="button"
            disabled={bidding || !bidPrice || !bidEta}
            onClick={() => void submitBid()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-[12px] font-black uppercase tracking-wider text-[#0A192F] disabled:opacity-50"
          >
            {bidding ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t("ops_alerts.send_offer")}
          </button>
        </GlassPanel>
      )}

      {!openForBid && (
        <details className="group rounded-2xl border border-white/10 bg-white/[0.02]">
          <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-white/80">
            <span>{t("mission.details")}</span>
            <span className="text-white/40 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="p-3 pt-1 space-y-3">
            <ProviderPayoutPanel
              payout={payout}
              expectedNet={providerCommission.net}
              feeAmount={providerCommission.fee}
            />
            <CommissionBreakdown gross={providerCommission.gross} />
          </div>
        </details>
      )}

      {job.status === "Accepted" && job.provider_id === meId && (
        <button
          onClick={setSail}
          className="w-full h-14 rounded-2xl amber-gradient text-warning-foreground font-bold inline-flex items-center justify-center gap-2"
        >
          <Send className="size-5" /> {t("provider.set_sail")}
        </button>
      )}
      {job.status === "EnRoute" && (
        <button
          onClick={arrived}
          className="w-full h-14 rounded-2xl marine-gradient text-white font-bold inline-flex items-center justify-center gap-2"
        >
          <PinIcon className="size-5" /> {t("provider.arrived")}
        </button>
      )}

      {["OnSite", "InProgress", "PartsPending"].includes(job.status) && (
        <GlassPanel>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              {t("mission.parts")}
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-[10px] font-black rounded-full amber-gradient text-warning-foreground px-3 py-1.5 uppercase tracking-[0.14em]"
            >
              + {t("provider.add_part")}
            </button>
          </div>
          {parts.length === 0 ? (
            <p className="text-xs text-white/40">—</p>
          ) : (
            <ul className="space-y-2">
              {parts.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  {p.part_image_url && (
                    <img
                      src={p.part_image_url}
                      alt=""
                      className="size-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.part_name}</p>
                    <p className="text-xs text-white/50">{p.source}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold tabular-nums text-white">
                      {formatTL(Number(p.part_price))}
                    </p>
                    <StatusChip
                      tone={
                        p.payment_status === "Paid"
                          ? "success"
                          : p.payment_status === "Rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {t(`owner.part_status_${p.payment_status}`, {
                        defaultValue: p.payment_status,
                      })}
                    </StatusChip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-card rounded-3xl p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold">{t("provider.add_part")}</h3>
            <CatalogPicker
              onPick={(p) => {
                setPartName(p.name);
                setPartPrice(groupThousands(String(p.price)));
                setPartPhoto(p.image_url ?? "");
                setSource(`THALVO Catalog · ${p.brand}`);
              }}
            />
            <input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder={t("provider.part_name")}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
            />
            <input
              value={partPrice}
              onChange={(e) => {
                const el = e.target;
                const next = groupThousands(el.value);
                setPartPrice(next);
                const caret = caretAfterGrouping(el.value, next, el.selectionStart);
                requestAnimationFrame(() => el.setSelectionRange(caret, caret));
              }}
              inputMode="numeric"
              placeholder={t("provider.part_price")}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
            />
            <input
              value={partPhoto}
              onChange={(e) => setPartPhoto(e.target.value)}
              placeholder={`${t("common.photo")} URL (${t("common.optional")})`}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
            />
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option>Tedarikçi Firma (Local Supplier)</option>
              <option>OEM Distributor</option>
              <option>Marina Chandlery</option>
              <option>THALVO Catalog</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 h-11 rounded-xl border border-border"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={addPart}
                disabled={busy}
                className="flex-1 h-11 rounded-xl amber-gradient text-warning-foreground font-bold inline-flex items-center justify-center gap-1.5"
              >
                {busy && <Loader2 className="size-4 animate-spin" />} {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <JobChat jobId={job.id} meId={meId} />
    </div>
  );
}

interface CatalogItem {
  id: string;
  name: string;
  price: number;
  brand: string;
  image_url: string | null;
  sku: string | null;
}
function CatalogPicker({ onPick }: { onPick: (p: CatalogItem) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  useEffect(() => {
    if (!open) return;
    supabase
      .from("parts_catalog")
      .select("id, name, price, brand, image_url, sku")
      .eq("active", true)
      .limit(50)
      .then(({ data }) => setItems((data as never) ?? []));
  }, [open]);
  const filtered = items.filter(
    (i) =>
      !q ||
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      i.brand.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="rounded-xl border border-deep/30 bg-deep/5 p-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 rounded-lg marine-gradient text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
      >
        <Package className="size-3.5" /> {t("shop.browse_catalog")}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("shop.search")}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
          />
          <ul className="max-h-56 overflow-y-auto space-y-1">
            {filtered.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => {
                    onPick(i);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-left"
                >
                  {i.image_url && (
                    <img src={i.image_url} alt="" className="size-9 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{i.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {i.brand} · {i.sku ?? ""}
                    </p>
                  </div>
                  <p className="text-xs font-black tabular-nums">{formatTL(Number(i.price))}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
