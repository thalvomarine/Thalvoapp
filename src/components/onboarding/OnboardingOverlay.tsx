import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import {
  Anchor, Bell, Camera, Check, ChevronLeft, ChevronRight, Compass,
  Globe2, MapPin, Ship, Sparkles, Store, Wrench, X,
} from "lucide-react";
import i18n, { ensureLanguage, normalizeAppLng, type AppLng } from "@/i18n";
import type { Profile } from "@/lib/session";
import {
  RescueMark, PassportMark, MarketplaceMark, ControlTowerMark,
} from "@/components/brand/ProductMarks";
import { requestOpsNotificationPermission } from "@/lib/ops-alerts";

interface Props {
  profile: Profile;
  isAdmin: boolean;
  onComplete: () => void;
}

type RoleKey = "captain" | "mechanic" | "diver" | "dealer" | "admin";

/**
 * OnboardingOverlay — full-screen MarineOS first-run experience.
 * Six steps: Welcome → Role → Language → Permissions → Captain path → Mission Control tour.
 */
export function OnboardingOverlay({ profile, isAdmin, onComplete }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const defaultRole: RoleKey = useMemo(() => {
    if (profile.role === "Supplier") return "dealer";
    if (profile.role === "Provider") return "mechanic";
    return "captain";
  }, [profile.role]);
  const [role, setRole] = useState<RoleKey>(defaultRole);
  const [lang, setLang] = useState<AppLng>(normalizeAppLng(i18n.language));
  const [permHint, setPermHint] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const finish = () => {
    try {
      window.localStorage.setItem("thalvo_onboarding_role", role);
    } catch { /* noop */ }
    onComplete();
  };

  const steps = ["welcome", "role", "language", "permissions", "captain", "tour"] as const;
  const activeSteps = steps.filter((s) => s !== "captain" || role === "captain");
  const currentKey = activeSteps[step];
  const total = activeSteps.length;

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const changeLang = (l: AppLng) => {
    setLang(l);
    void ensureLanguage(l).then(() => i18n.changeLanguage(l));
    try { window.localStorage.setItem("thalvo-lang", l); } catch { /* noop */ }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thalvo-onboarding-title"
      className="fixed inset-0 z-[100] thalvo-dark thalvo-cockpit text-white overflow-y-auto"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 0px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(60% 40% at 50% 20%, rgba(0,180,216,0.18), transparent 70%)" }}
      />

      <div className="relative flex items-center justify-between px-5 pt-5">
        <button
          onClick={back}
          disabled={step === 0}
          aria-label={t("onboarding.back")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="size-4" /> {t("onboarding.back")}
        </button>
        <div
          className="flex items-center gap-1.5"
          aria-label={t("onboarding.step_of", { current: step + 1, total })}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={
                "h-1 rounded-full transition-all " +
                (i === step ? "w-8 bg-amber-400" : i < step ? "w-4 bg-white/60" : "w-4 bg-white/15")
              }
            />
          ))}
        </div>
        <button
          onClick={finish}
          aria-label={t("onboarding.skip")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white"
        >
          {t("onboarding.skip")} <X className="size-4" />
        </button>
      </div>

      <div className="relative mx-auto max-w-2xl px-5 pb-24 pt-6 sm:pt-10">
        {currentKey === "welcome" && (
          <StepShell
            eyebrow="THALVO"
            title={t("onboarding.welcome_title")}
            id="thalvo-onboarding-title"
            subtitle={t("onboarding.welcome_subtitle")}
          >
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              <Bullet icon={<RescueMark size={18} />}>{t("onboarding.welcome_b1")}</Bullet>
              <Bullet icon={<Compass className="size-4 text-amber-300" />}>{t("onboarding.welcome_b2")}</Bullet>
              <Bullet icon={<PassportMark size={18} />}>{t("onboarding.welcome_b3")}</Bullet>
              <Bullet icon={<Sparkles className="size-4 text-amber-300" />}>{t("onboarding.welcome_b4")}</Bullet>
            </ul>
            <PrimaryCta onClick={next}>{t("onboarding.get_started")}</PrimaryCta>
            <SecondaryCta onClick={finish}>{t("onboarding.skip_for_now")}</SecondaryCta>
          </StepShell>
        )}

        {currentKey === "role" && (
          <StepShell
            eyebrow={t("onboarding.role_eyebrow")}
            title={t("onboarding.role_title")}
            subtitle={t("onboarding.role_subtitle")}
          >
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RoleCard active={role === "captain"} onClick={() => setRole("captain")}
                icon={<Ship className="size-5" />} label={t("onboarding.role_captain")} hint={t("onboarding.role_captain_hint")} />
              <RoleCard active={role === "mechanic"} onClick={() => setRole("mechanic")}
                icon={<Wrench className="size-5" />} label={t("onboarding.role_mechanic")} hint={t("onboarding.role_mechanic_hint")} />
              <RoleCard active={role === "diver"} onClick={() => setRole("diver")}
                icon={<Anchor className="size-5" />} label={t("onboarding.role_diver")} hint={t("onboarding.role_diver_hint")} />
              <RoleCard active={role === "dealer"} onClick={() => setRole("dealer")}
                icon={<Store className="size-5" />} label={t("onboarding.role_dealer")} hint={t("onboarding.role_dealer_hint")} />
              {isAdmin && (
                <RoleCard active={role === "admin"} onClick={() => setRole("admin")}
                  icon={<ControlTowerMark size={20} />} label={t("onboarding.role_admin")} hint={t("onboarding.role_admin_hint")} />
              )}
            </div>
            <PrimaryCta onClick={next}>{t("onboarding.continue")}</PrimaryCta>
          </StepShell>
        )}

        {currentKey === "language" && (
          <StepShell
            eyebrow={t("onboarding.lang_eyebrow")}
            title={t("onboarding.lang_title")}
            subtitle={t("onboarding.lang_subtitle")}
          >
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <LangCard active={lang === "tr"} onClick={() => changeLang("tr")} label="Türkçe" hint={t("onboarding.lang_hint_tr")} selectedLabel={t("onboarding.selected")} />
              <LangCard active={lang === "en"} onClick={() => changeLang("en")} label="English" hint={t("onboarding.lang_hint_en")} selectedLabel={t("onboarding.selected")} />
              <LangCard active={lang === "el"} onClick={() => changeLang("el")} label="Ελληνικά" hint={t("onboarding.lang_hint_el")} selectedLabel={t("onboarding.selected")} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-white/50">
              <Globe2 className="size-3.5" /> {t("onboarding.lang_saved")}
            </p>
            <PrimaryCta onClick={next}>{t("onboarding.continue")}</PrimaryCta>
          </StepShell>
        )}

        {currentKey === "permissions" && (
          <StepShell
            eyebrow={t("onboarding.perm_eyebrow")}
            title={t("onboarding.perm_title")}
            subtitle={t("onboarding.perm_subtitle")}
          >
            <div className="mt-6 space-y-3">
              <PermCard
                icon={<MapPin className="size-4" />}
                label={t("onboarding.perm_location")}
                body={t("onboarding.perm_location_body")}
                enableLabel={t("onboarding.enable")}
                onEnable={async () => {
                  if (!("geolocation" in navigator)) return setPermHint(t("onboarding.hint_loc_unavailable"));
                  navigator.geolocation.getCurrentPosition(
                    () => setPermHint(t("onboarding.hint_loc_ok")),
                    () => setPermHint(t("onboarding.hint_loc_denied")),
                    { timeout: 8000 },
                  );
                }}
              />
              <PermCard
                icon={<Bell className="size-4" />}
                label={t("onboarding.perm_notifications")}
                body={t("onboarding.perm_notifications_body")}
                enableLabel={t("onboarding.enable")}
                onEnable={async () => {
                  if (typeof Notification === "undefined") return setPermHint(t("onboarding.hint_notif_unsupported"));
                  try {
                    await requestOpsNotificationPermission();
                    const res = Notification.permission;
                    setPermHint(res === "granted"
                      ? t("onboarding.hint_notif_ok")
                      : t("onboarding.hint_notif_denied"));
                  } catch {
                    setPermHint(t("onboarding.hint_notif_fail"));
                  }
                }}
              />
              <PermCard
                icon={<Camera className="size-4" />}
                label={t("onboarding.perm_camera")}
                body={t("onboarding.perm_camera_body")}
                enableLabel={t("onboarding.enable")}
                onEnable={async () => {
                  try {
                    const stream = await navigator.mediaDevices?.getUserMedia({ video: true });
                    stream?.getTracks().forEach((tr) => tr.stop());
                    setPermHint(t("onboarding.hint_cam_ok"));
                  } catch {
                    setPermHint(t("onboarding.hint_cam_denied"));
                  }
                }}
              />
              {permHint && (
                <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70">{permHint}</p>
              )}
            </div>
            <PrimaryCta onClick={next}>{t("onboarding.continue")}</PrimaryCta>
            <SecondaryCta onClick={next}>{t("onboarding.not_now")}</SecondaryCta>
          </StepShell>
        )}

        {currentKey === "captain" && (
          <StepShell
            eyebrow={t("onboarding.captain_eyebrow")}
            title={t("onboarding.captain_title")}
            subtitle={t("onboarding.captain_subtitle")}
          >
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => { finish(); navigate({ to: "/app/profile" }); }}
                className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-left hover:bg-amber-500/15 transition-colors"
              >
                <Ship className="size-5 text-amber-300" />
                <p className="mt-3 text-sm font-semibold">{t("onboarding.captain_yes")}</p>
                <p className="mt-1 text-xs text-white/60">{t("onboarding.captain_yes_hint")}</p>
              </button>
              <button
                onClick={next}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left hover:bg-white/[0.08] transition-colors"
              >
                <PassportMark size={20} />
                <p className="mt-3 text-sm font-semibold">{t("onboarding.captain_skip")}</p>
                <p className="mt-1 text-xs text-white/60">{t("onboarding.captain_skip_hint")}</p>
              </button>
            </div>
          </StepShell>
        )}

        {currentKey === "tour" && (
          <StepShell
            eyebrow={t("onboarding.tour_eyebrow")}
            title={t("onboarding.tour_title")}
            subtitle={t("onboarding.tour_subtitle")}
          >
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TourItem icon={<MapPin className="size-4 text-amber-300" />} title={t("onboarding.tour_map")} body={t("onboarding.tour_map_body")} />
              <TourItem icon={<RescueMark size={18} />} title={t("onboarding.tour_sos")} body={t("onboarding.tour_sos_body")} />
              <TourItem icon={<Compass className="size-4 text-amber-300" />} title={t("onboarding.tour_compass")} body={t("onboarding.tour_compass_body")} />
              <TourItem icon={<MarketplaceMark size={18} />} title={t("onboarding.tour_market")} body={t("onboarding.tour_market_body")} />
              <TourItem icon={<PassportMark size={18} />} title={t("onboarding.tour_passport")} body={t("onboarding.tour_passport_body")} />
            </ul>
            <PrimaryCta onClick={finish}>
              <Check className="size-4" /> {t("onboarding.tour_enter")}
            </PrimaryCta>
            <p className="mt-3 text-center text-[11px] text-white/40">
              {t("onboarding.tour_replay")}
            </p>
          </StepShell>
        )}
      </div>
    </div>
  );
}

function StepShell({
  eyebrow, title, subtitle, id, children,
}: { eyebrow: string; title: string; subtitle?: string; id?: string; children: ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">{title}</h2>
      {subtitle && <p className="mt-3 text-sm sm:text-base text-white/70 max-w-lg">{subtitle}</p>}
      {children}
    </div>
  );
}

function Bullet({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <span className="mt-0.5 grid place-items-center size-7 rounded-lg bg-white/5">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function RoleCard({ active, onClick, icon, label, hint }: {
  active: boolean; onClick: () => void; icon: ReactNode; label: string; hint: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={
        "text-left rounded-2xl border p-4 min-h-[96px] transition-all " +
        (active
          ? "border-amber-400/60 bg-amber-500/15 shadow-[0_10px_40px_-10px_rgba(56,189,248,0.45)]"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]")
      }
    >
      <div className="flex items-center gap-2">
        <span className={"grid place-items-center size-9 rounded-xl " + (active ? "bg-amber-500/30 text-amber-100" : "bg-white/5 text-white/80")}>
          {icon}
        </span>
        <span className="text-sm font-bold">{label}</span>
        {active && <Check className="ml-auto size-4 text-amber-300" />}
      </div>
      <p className="mt-2 text-[12px] text-white/60">{hint}</p>
    </button>
  );
}

function LangCard({ active, onClick, label, hint, selectedLabel }: {
  active: boolean; onClick: () => void; label: string; hint: string; selectedLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={
        "text-left rounded-2xl border p-5 min-h-[96px] transition-all " +
        (active
          ? "border-amber-400/60 bg-amber-500/15"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]")
      }
    >
      <p className="text-lg font-bold">{label}</p>
      <p className="mt-1 text-xs text-white/60">{hint}</p>
      {active && (
        <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
          <Check className="size-3" /> {selectedLabel}
        </span>
      )}
    </button>
  );
}

function PermCard({ icon, label, body, enableLabel, onEnable }: {
  icon: ReactNode; label: string; body: string; enableLabel: string; onEnable: () => void | Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <span className="grid place-items-center size-10 rounded-xl bg-white/5 text-amber-300 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[12px] text-white/60">{body}</p>
      </div>
      <button
        onClick={() => void onEnable()}
        className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 hover:bg-white/10"
      >
        {enableLabel}
      </button>
    </div>
  );
}

function TourItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <span className="grid place-items-center size-9 rounded-xl bg-white/5">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/60">{body}</p>
      </div>
    </li>
  );
}

function PrimaryCta({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#F5B942] text-[#1A1406] font-bold tracking-wide px-8 h-12 min-w-[220px]"
    >
      {children}
      <ChevronRight className="size-4" />
    </button>
  );
}

function SecondaryCta({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <div className="mt-3">
      <button
        onClick={onClick}
        className="text-xs font-semibold text-white/55 hover:text-white/85 underline underline-offset-4 decoration-white/20"
      >
        {children}
      </button>
    </div>
  );
}
