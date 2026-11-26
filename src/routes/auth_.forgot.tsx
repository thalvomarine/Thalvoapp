import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthPassageShell } from "@/components/auth/AuthPassageShell";
import { AuthTextField } from "@/components/auth/AuthPasswordField";
import { recoveryRedirect } from "@/lib/signup-welcome";

export const Route = createFileRoute("/auth_/forgot")({
  ssr: false,
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: recoveryRedirect(),
      });
      if (error) throw error;
      setSent(true);
      toast.success(t("auth.forgot_sent_toast"));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("auth.error_generic_title"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPassageShell kicker={t("auth.forgot_kicker")}>
      {sent ? (
        <div className="space-y-5">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[color:var(--pm-gold)]/35 bg-[color:var(--pm-gold)]/10 text-[color:var(--pm-gold)]">
            <MailCheck className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="thalvo-display text-[1.75rem] leading-none tracking-wide text-white">
              {t("auth.forgot_sent_title")}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              {t("auth.forgot_sent_body", { email })}
            </p>
          </div>
          <Link
            to="/auth"
            search={{}}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--pm-gold)] underline underline-offset-2"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t("auth.back_to_sign_in")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h2 className="thalvo-display text-[1.75rem] leading-none tracking-wide text-white">
              {t("auth.forgot_title")}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              {t("auth.forgot_body")}
            </p>
          </div>

          <AuthTextField
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />

          {err && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-destructive">{t("auth.error_generic_title")}</p>
                  <p className="text-foreground/80">{err}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="pm-gold-cta mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold tracking-wide disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("auth.forgot_submit")}
          </button>

          <Link
            to="/auth"
            search={{}}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/50 hover:text-[color:var(--pm-gold)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t("auth.back_to_sign_in")}
          </Link>
        </form>
      )}
    </AuthPassageShell>
  );
}
