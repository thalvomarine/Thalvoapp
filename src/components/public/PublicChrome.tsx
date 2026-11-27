import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccountMenuButton } from "@/components/mission/AccountMenuButton";
import { useProfile, useSessionUser } from "@/lib/session";

/**
 * Shared public-page header — Marina Concierge chrome.
 * Signed-out: champagne Giriş yap. Signed-in: account menu + return to cockpit
 * (never show Giriş yap while a session exists).
 */
export function PublicChrome({
  authNext,
  brandTo = "/",
}: {
  /** Post-login return path for the sign-in CTA. */
  authNext?: string;
  brandTo?: "/";
}) {
  const { t } = useTranslation();
  const { user, loading: sessionLoading } = useSessionUser();
  const { profile } = useProfile(user?.id);
  const signedIn = Boolean(user);

  return (
    <header className="thalvo-safe-top sticky top-0 z-40 border-b border-[#C9B896]/15 bg-[#0C2226]/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3">
        <Link to={brandTo} className="flex min-w-0 items-center gap-2.5" aria-label="THALVO">
          <Wordmark size="sm" className="text-white" decorative />
          <span className="thalvo-display text-[15px] tracking-[0.18em] text-white">THALVO</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher tone="dark" />
          {sessionLoading ? (
            <span className="inline-block h-9 w-20 rounded-xl bg-white/[0.04]" aria-hidden />
          ) : signedIn ? (
            <>
              <Link
                to="/app"
                className="inline-flex h-9 items-center rounded-xl border border-[#C9B896]/35 bg-[#C9B896]/12 px-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#E8DFC8] transition hover:bg-[#C9B896]/2"
              >
                {t("public.open_app", { defaultValue: "Uygulamaya dön" })}
              </Link>
              {profile ? <AccountMenuButton profile={profile} isAdmin={false} compact /> : null}
            </>
          ) : (
            <Link
              to="/auth"
              search={authNext ? { next: authNext } : undefined}
              className="inline-flex h-9 items-center rounded-xl bg-[#C9B896] px-4 text-[12px] font-bold text-[#0C2226] transition hover:bg-[#d4c4a8]"
            >
              {t("auth.sign_in")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
