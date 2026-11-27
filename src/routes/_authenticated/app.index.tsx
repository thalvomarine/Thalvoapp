import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { LiveMap, type LiveAlert, type LivePin } from "@/components/LiveMapLazy";
import { asCoordinate } from "@/lib/emergency-service";
import { pickValidCoordinates } from "@/lib/geolocation";
import { Wordmark } from "@/components/Wordmark";
import { n, useSessionUser, type Profile, cockpitFallbackProfile, recalledCockpitRole } from "@/lib/session";
import { ensureAdminAccess } from "@/lib/superadmin";
import { AccountMenuButton } from "@/components/mission/AccountMenuButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ProviderOpsDeck } from "@/components/mission/ProviderOpsDeck";
import { ProviderOfferCard } from "@/components/mission/ProviderOfferCard";
import { openThalvoSos } from "@/lib/sos-bus";
import { createRealtimeBuffer, runWhenIdle } from "@/lib/schedule";
import { noteSchemaMiss, skipMissing } from "@/lib/schema-gap";

const EMPTY_PINS: LivePin[] = [];

const MapHeaderActions = ({ profile }: { profile: Profile }) => {
  const { user } = useSessionUser();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    return runWhenIdle(() => {
      void ensureAdminAccess(user).then(setIsAdmin);
    }, 1400);
  }, [user]);
  return (
    <>
      <LanguageSwitcher tone="dark" />
      <AccountMenuButton profile={profile} isAdmin={isAdmin} compact />
    </>
  );
};

export const Route = createFileRoute("/_authenticated/app/")({
  ssr: false,
  component: MissionControl,
});

function MissionControl() {
  const routeUser = Route.useRouteContext().user;
  const { user: sessionUser } = useSessionUser();
  const user = sessionUser ?? routeUser;
  const { profile } = n(user?.id);
  // Shell chrome lives in /_authenticated layout — only swap cockpit content here.
  if (!user) return null;
  const cockpitProfile =
    profile ?? cockpitFallbackProfile(user.id, recalledCockpitRole(user.id) ?? "Client");
  return cockpitProfile.role === "Provider" ? (
    <OperatorCockpit profile={cockpitProfile} />
  ) : (
    <CaptainCockpit profile={cockpitProfile} />
  );
}

/* ============================================================ */
/* CAPTAIN COCKPIT — fullscreen Navily-style map chartplotter    */
/* ============================================================ */
function CaptainCockpit({ profile }: { profile: Profile }) {
  const { user } = useSessionUser();
  const [providers, setProviders] = useState<LivePin[]>([]);
  const [activeJobs, setActiveJobs] = useState<
    {
      id: string;
      problem_category: string;
      status: string;
      service_type: string;
      marina: string;
      dispatched_at: string | null;
      eta_minutes: number | null;
    }[]
  >([]);
  const { t } = useTranslation();

  useEffect(() => {
    return runWhenIdle(() => {
      if (skipMissing("provider_live_pins")) return;
      supabase
        .from("provider_live_pins")
        .select("id, service_type, lat, lng, full_name")
        .then(({ data, error }) => {
          if (error) {
            noteSchemaMiss("provider_live_pins", error);
            return;
          }
          if (!data) return;
          setProviders(
            pickValidCoordinates(data)
              .map((r) => ({
                id: r.id,
                name: r.full_name?.trim() || "Provider",
                lat: r.lat,
                lng: r.lng,
                kind: r.service_type === "Underwater Diver" ? "diver" : "mechanic",
              })),
          );
        });
    }, 900);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      supabase
        .from("jobs")
        .select("id, problem_category, status, service_type, marina, dispatched_at, eta_minutes")
        .eq("client_id", user.id)
        .not("status", "in", "(Completed,Cancelled)")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.warn("[cockpit] jobs unavailable", error.message);
            setActiveJobs([]);
            return;
          }
          setActiveJobs((data as never) ?? []);
        });
    const stopIdle = runWhenIdle(() => {
      void load();
    }, 800);
    const buffer = createRealtimeBuffer(load, 180);
    const ch = supabase
      .channel(`client-jobs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `client_id=eq.${user.id}` },
        () => buffer.ping(),
      )
      .subscribe();
    return () => {
      stopIdle();
      buffer.dispose();
      supabase.removeChannel(ch);
    };
  }, [user]);

  const primaryMission = activeJobs[0] ?? null;

  const headerRight = useMemo(
    () => <MapHeaderActions profile={profile} />,
    [profile],
  );

  const brand: ReactNode = useMemo(
    () =>
      primaryMission ? (
        <Link
          to="/app/job/$id"
          params={{ id: primaryMission.id }}
          className="flex items-center gap-2 rounded-md border border-[#F5B942]/40 bg-[#0A192F]/92 px-3 py-1.5 text-[10px] font-semibold text-[#F5B942] shadow-lg backdrop-blur-md"
        >
          <span className="size-1.5 shrink-0 rounded-[1px] bg-[#F5B942]" />
          <span className="truncate">
            {t(`status.${primaryMission.status}`, { defaultValue: primaryMission.status })}
          </span>
        </Link>
      ) : null,
    [primaryMission, t],
  );

  return (
    <div className="relative h-full min-h-[500px] w-full">
    <LiveMap
      providers={providers}
      variant="dark"
      fullscreen
      hud
      enableDetailSheet
      scrollZoom
      headerLeft={<Wordmark size="sm" className="text-white" decorative />}
      headerRight={headerRight}
      brand={brand}
      onRequestEmergency={() => openThalvoSos("mechanic")}
    />
    </div>
  );
}

/* ============================================================ */
/* OPERATOR COCKPIT (Provider)                                  */
/* ============================================================ */
function OperatorCockpit({ profile }: { profile: Profile }) {
  const { user } = useSessionUser();
  const [requests, setRequests] = useState<
    Array<{
      id: string;
      problem_category: string;
      description: string;
      marina: string;
      service_type: string;
      lat: number | null;
      lng: number | null;
      profiles: { full_name: string; boat_name: string | null } | null;
    }>
  >([]);
  const [activeJobs, setActiveJobs] = useState<
    Array<{ id: string; problem_category: string; status: string }>
  >([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const pending = await supabase
          .from("jobs")
          .select(
            "id, problem_category, description, marina, service_type, lat, lng, profiles!jobs_client_id_fkey(full_name, boat_name)",
          )
          .in("status", ["Pending", "Offered"])
          .is("provider_id", null)
          .order("created_at", { ascending: false });
        if (pending.error) console.warn("[cockpit] jobs pending unavailable", pending.error.message);
        setRequests((pending.data as never) ?? []);
        const mine = await supabase
          .from("jobs")
          .select("id, problem_category, status, lat, lng, marina")
          .eq("provider_id", user.id)
          .not("status", "in", "(Completed,Cancelled)")
          .order("created_at", { ascending: false });
        if (mine.error) console.warn("[cockpit] jobs mine unavailable", mine.error.message);
        setActiveJobs((mine.data as never) ?? []);
        const mineAlerts = ((mine.data ?? []) as Array<{
          id: string;
          lat: unknown;
          lng: unknown;
          problem_category: string;
          marina: string | null;
        }>).flatMap((row) => {
          const lat = asCoordinate(row.lat);
          const lng = asCoordinate(row.lng);
          if (lat == null || lng == null) return [];
          return [{
            id: `job-${row.id}`,
            lat,
            lng,
            title: row.marina?.trim() || row.problem_category,
            kind: "fault" as const,
            detail: row.marina?.trim() || undefined,
          }];
        });
        const located = await supabase
          .from("emergency_service_requests")
          .select("id, lat, lng, vessel_name, category, urgency_level, bay_name, description, status")
          .in("status", ["pending", "en_route", "on_scene"])
          .order("created_at", { ascending: false })
          .limit(40);
        if (located.error) console.warn("[cockpit] located calls unavailable", located.error.message);
        const pendingRows = (pending.data ?? []) as Array<{
          id: string;
          lat: unknown;
          lng: unknown;
          problem_category: string;
          marina: string | null;
          profiles: { boat_name: string | null; full_name: string } | null;
        }>;
        const jobAlerts = pendingRows.flatMap((row) => {
          const lat = asCoordinate(row.lat);
          const lng = asCoordinate(row.lng);
          if (lat == null || lng == null) return [];
          return [{
            id: `job-${row.id}`,
            lat,
            lng,
            title: row.profiles?.boat_name?.trim() || row.marina?.trim() || row.problem_category,
            kind: "sos" as const,
            detail: row.marina?.trim() || undefined,
          }];
        });
        const rows = (located.data ?? []) as Array<{
          id: string;
          lat: unknown;
          lng: unknown;
          vessel_name: string;
          category: string;
          urgency_level: string;
          bay_name: string | null;
          description: string;
        }>;
        const esrAlerts = rows.flatMap((row) => {
            const lat = asCoordinate(row.lat);
            const lng = asCoordinate(row.lng);
            if (lat == null || lng == null) return [];
            const title = row.vessel_name?.trim() || row.bay_name?.trim() || row.category;
            return [{
              id: row.id,
              lat,
              lng,
              title,
              kind: row.urgency_level === "urgent" ? "sos" as const : "fault" as const,
              detail: row.bay_name?.trim() || undefined,
            }];
        });
        const vesselPins = [...mineAlerts, ...jobAlerts.filter((pin) => !mineAlerts.some((mine) => mine.id === pin.id))];
        setAlerts([
          ...vesselPins,
          ...esrAlerts.filter(
            (pin) => !vesselPins.some((job) => Math.abs(job.lat - pin.lat) < 0.02 && Math.abs(job.lng - pin.lng) < 0.02),
          ),
        ]);
      } catch (e) {
        console.warn("[cockpit] jobs load failed", e);
        setRequests([]);
        setActiveJobs([]);
      }
    };
    const stopIdle = runWhenIdle(() => {
      void load();
    }, 800);
    const buffer = createRealtimeBuffer(() => {
      void load();
    }, 180);
    const ch = supabase
      .channel(`prov-jobs:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => buffer.ping())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_service_requests" },
        () => buffer.ping(),
      )
      .subscribe();
    return () => {
      stopIdle();
      buffer.dispose();
      supabase.removeChannel(ch);
    };
  }, [user]);

  const headerRight = useMemo(
    () => <MapHeaderActions profile={profile} />,
    [profile],
  );

  const sosCount = alerts.filter((a) => a.kind === "sos").length;
  const poolCount = requests.length;

  return (
    <div className="relative h-full min-h-[500px] w-full">
      <LiveMap
        providers={EMPTY_PINS}
        alerts={alerts}
        variant="dark"
        fullscreen
        hud
        scrollZoom
        headerLeft={<Wordmark size="sm" className="text-white" decorative />}
        headerRight={headerRight}
      />
      {user ? (
        <ProviderOpsDeck
          userId={user.id}
          alerts={alerts}
          activeJobs={activeJobs}
          sosCount={sosCount}
          poolCount={poolCount}
          offerFeed={
            requests.length > 0 ? (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <ProviderOfferCard key={r.id} request={r} />
                ))}
              </ul>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}
