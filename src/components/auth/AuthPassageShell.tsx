import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthPassageBackdrop } from "@/components/brand/AuthPassageBackdrop";

/**
 * Shared chrome for password recovery desks (/auth/forgot, /auth/reset) —
 * night passage backdrop, brand mark, language switcher.
 */
export function AuthPassageShell({
  children,
  kicker,
  title = "THALVO",
  deskWide = false,
}: {
  children: ReactNode;
  kicker?: string;
  title?: string;
  deskWide?: boolean;
}) {
  const { t } = useTranslation();
  const brandKicker = kicker ?? t("auth.brand_kicker");

  return (
    <div className="thalvo-premium thalvo-dark relative flex min-h-dvh flex-col overflow-hidden bg-black">
      <AuthPassageBackdrop />

      <header className="relative z-50 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <a href="/" className="thalvo-brand-mark" aria-label="THALVO">
          <Wordmark size="sm" decorative />
        </a>
        <LanguageSwitcher tone="dark" />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-5 py-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-12">
        <section className="auth-rise text-center lg:text-left">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[color:var(--pm-gold)]">
            {brandKicker}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4 lg:justify-start">
            <Wordmark
              size="nav"
              decorative
              className="shrink-0 drop-shadow-[0_0_28px_rgba(245,185,66,0.22)]"
            />
            <h1 className="thalvo-display text-[2.75rem] leading-none tracking-[0.16em] text-white sm:text-5xl lg:text-[4.25rem]">
              {title}
            </h1>
          </div>
          <p className="mt-7 text-[11px] font-semibold tracking-[0.22em] text-[color:var(--pm-gold)] max-lg:hidden">
            {t("auth.coverage_ports")}
          </p>
        </section>

        <section
          className={
            "auth-rise auth-desk w-full justify-self-center overflow-hidden rounded-[28px] text-white lg:justify-self-end " +
            (deskWide ? "max-w-lg" : "max-w-md")
          }
          style={{ animationDelay: "80ms" }}
        >
          <div className="space-y-5 p-5 sm:p-6">{children}</div>
        </section>

        <p
          className="auth-rise mx-auto inline-flex items-center justify-center rounded-xl border border-[color:var(--pm-gold)]/35 bg-black/25 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.22em] text-[color:var(--pm-gold)] lg:hidden"
          style={{ animationDelay: "120ms" }}
        >
          {t("auth.coverage_ports", { defaultValue: "Ege · Akdeniz" })}
        </p>
      </main>
    </div>
  );
}
