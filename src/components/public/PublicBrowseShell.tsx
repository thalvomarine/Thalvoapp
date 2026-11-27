import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { PublicFooter } from "@/components/public/PublicFooter";
import { useSessionUser } from "@/lib/session";

/**
 * Shell for public browsing surfaces (catalogue, service packages).
 * Session-aware header; signed-in users are not shown Giriş yap.
 */
export function PublicBrowseShell({
  title,
  subtitle,
  active,
  next,
  children,
}: {
  title: string;
  subtitle?: string;
  active: "parts" | "services" | "coverage";
  /** Protected destination to return to after sign-in. Relative path only. */
  next?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { user } = useSessionUser();
  const signedIn = Boolean(user);

  const tab = (key: "parts" | "services" | "coverage", to: string, label: string) => (
    <Link
      to={to}
      className={
        "rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors " +
        (active === key
          ? "border-[#C9B896]/50 bg-[#C9B896]/15 text-[#E8DFC8]"
          : "border-white/10 bg-black/20 text-white/65 hover:border-white/20")
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="thalvo-dark relative flex min-h-dvh flex-col overflow-x-clip bg-[#0C2226] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_-10%,rgba(139,168,163,0.14),transparent_55%),radial-gradient(55%_40%_at_10%_100%,rgba(201,184,150,0.08),transparent_50%)]"
      />
      <PublicChrome authNext={next} />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 space-y-5 px-5 py-6">
        <div>
          <h1 className="thalvo-display text-[2rem] leading-none tracking-wide text-white">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/60">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tab("parts", "/marketplace", t("public.tab_parts", { defaultValue: "Spare parts" }))}
          {tab("services", "/services", t("public.tab_services", { defaultValue: "Services" }))}
          {tab("coverage", "/chart", t("nav.map", { defaultValue: "Map" }))}
        </div>

        {children}

        {!signedIn ? (
          <div className="rounded-2xl border border-[#C9B896]/22 bg-[#C9B896]/08 p-4 text-sm text-white/70">
            <p className="font-semibold text-[#E8DFC8]">
              {t("public.cta_title", { defaultValue: "Sign in to order or request help" })}
            </p>
            <p className="mt-1">
              {t("public.cta_body", {
                defaultValue:
                  "Browsing is open to everyone. Ordering parts or booking a service requires an account.",
              })}
            </p>
            <Link
              to="/auth"
              search={next ? { next } : undefined}
              className="mt-3 inline-flex h-11 items-center rounded-xl bg-[#C9B896] px-5 text-[13px] font-bold uppercase tracking-[0.1em] text-[#0C2226] transition hover:bg-[#d4c4a8]"
            >
              {t("auth.sign_up")}
            </Link>
          </div>
        ) : null}
      </main>

      <PublicFooter />
    </div>
  );
}
