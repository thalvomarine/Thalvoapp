import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { SectionHeader } from "@/components/core/SectionHeader";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useThalvoTheme, type ThalvoTheme } from "@/lib/theme";
import { useSessionUser } from "@/lib/session";
import { emailMatchesAccount } from "@/lib/account-deletion";
import { OPS_CONTACT_EMAIL } from "@/lib/superadmin";

const THEMES: ThalvoTheme[] = ["system", "day", "night"];

/** Shared account desk: language, appearance, signed-in email, sign out, deletion. */
export function AccountSettings() {
  const { t } = useTranslation();
  const { theme, choose } = useThalvoTheme();
  const { user } = useSessionUser();
  const navigate = useNavigate();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const email = user?.email ?? "";
  const canDelete = emailMatchesAccount(typedEmail, email);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const deleteAccount = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setDeleting(false);
      toast.error(t("profile.delete_account_fail"));
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    toast.success(t("profile.delete_account_done"));
    navigate({ to: "/" });
  };

  return (
    <GlassPanel className="space-y-4">
      <SectionHeader label={t("profile.settings")} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-white/70">{t("profile.language")}</p>
        <LanguageSwitcher tone="dark" />
      </div>
      <div>
        <p className="text-[12px] font-medium text-white/70">{t("profile.appearance")}</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {THEMES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => choose(item)}
              className={
                "h-10 rounded-xl border text-[12px] font-semibold " +
                (theme === item
                  ? "border-amber-300 bg-amber-400/15 text-amber-50"
                  : "border-white/10 bg-white/5 text-white/65")
              }
            >
              {t(`profile.theme_${item}`)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-white/45">{t(`profile.theme_${theme}_hint`)}</p>
      </div>
      {email && (
        <p className="truncate text-[12px] text-white/55">
          <span className="text-white/35">{t("auth.email")} · </span>
          {email}
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <Link to="/privacy" className="text-white/60 underline underline-offset-2">
          {t("public.footer_privacy")}
        </Link>
        <Link to="/terms" className="text-white/60 underline underline-offset-2">
          {t("public.terms_title")}
        </Link>
        <a href={`mailto:${OPS_CONTACT_EMAIL}`} className="text-white/60 underline underline-offset-2">
          {OPS_CONTACT_EMAIL}
        </a>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="h-11 w-full rounded-xl border border-white/15 text-[13px] font-semibold text-white/80"
      >
        {t("profile.sign_out", { defaultValue: t("common.sign_out") })}
      </button>

      {!confirmingDelete ? (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="h-11 w-full rounded-xl border border-rose-400/40 text-[13px] font-semibold text-rose-100"
        >
          {t("profile.delete_account")}
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3">
          <p className="text-[13px] font-semibold text-rose-50">{t("profile.delete_account_title")}</p>
          <p className="text-[12px] leading-snug text-rose-50/80">{t("profile.delete_account_body")}</p>
          <label className="block text-[11px] font-medium text-rose-50/70">
            {t("profile.delete_account_email_label")}
            <input
              value={typedEmail}
              onChange={(event) => setTypedEmail(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              disabled={deleting}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-[13px] text-white outline-none placeholder:text-white/30"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirmingDelete(false);
                setTypedEmail("");
              }}
              className="h-11 rounded-xl border border-white/15 text-[13px] font-semibold text-white/75"
            >
              {t("profile.delete_account_cancel")}
            </button>
            <button
              type="button"
              disabled={!canDelete || deleting}
              onClick={() => void deleteAccount()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-500 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t("profile.delete_account_go")}
            </button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
