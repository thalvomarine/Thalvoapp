import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthPassageShell } from "@/components/auth/AuthPassageShell";
import { AuthTextField } from "@/components/auth/AuthPasswordField";

export const Route = createFileRoute("/auth_/reset")({
  ssr: false,
  component: ResetPasswordPage,
});

type Gate = "loading" | "ready" | "missing";

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [gate, setGate] = useState<Gate>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const arm = () => {
      if (alive) setGate("ready");
    };

    const hashLooksRecovery =
      typeof window !== "undefined" &&
      (/type=recovery/i.test(window.location.hash) ||
        /type=recovery/i.test(window.location.search));

    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) {
        setGate("ready");
        return;
      }
      if (!hashLooksRecovery) setGate("missing");
      // else wait briefly for detectSessionInUrl / PASSWORD_RECOVERY
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY") {
        arm();
        return;
      }
      if (
        session &&
        (hashLooksRecovery ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED")
      ) {
        arm();
      }
    });

    const timer = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!alive) return;
        if (data.session) setGate("ready");
        else setGate((g) => (g === "loading" ? "missing" : g));
      });
    }, 2500);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 10) {
      setErr(t("auth.password_hint"));
      return;
    }
    if (password !== confirm) {
      setErr(t("auth.reset_mismatch"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("auth.reset_success_toast"));
      navigate({ to: "/app" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("auth.error_generic_title"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPassageShell kicker={t("auth.reset_kicker")}>
      {gate === "loading" ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-white/60">
          <Loader2 className="size-6 animate-spin text-[color:var(--pm-gold)]" />
          <p className="text-[13px]">{t("auth.reset_checking")}</p>
        </div>
      ) : gate === "missing" ? (
        <div className="space-y-5">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="thalvo-display text-[1.75rem] leading-none tracking-wide text-white">
              {t("auth.reset_invalid_title")}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              {t("auth.reset_invalid_body")}
            </p>
          </div>
          <Link
            to="/auth/forgot"
            className="pm-gold-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-[14px] font-bold tracking-wide"
          >
            {t("auth.forgot_submit")}
          </Link>
          <Link
            to="/auth"
            search={{}}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/50 hover:text-[color:var(--pm-gold)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t("auth.back_to_sign_in")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[color:var(--pm-gold)]/35 bg-[color:var(--pm-gold)]/10 text-[color:var(--pm-gold)]">
            <KeyRound className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="thalvo-display text-[1.75rem] leading-none tracking-wide text-white">
              {t("auth.reset_title")}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              {t("auth.reset_body")}
            </p>
          </div>

          <AuthTextField
            label={t("auth.reset_new_password")}
            type="password"
            value={password}
            onChange={setPassword}
            required
            minLength={10}
            autoComplete="new-password"
          />
          <AuthTextField
            label={t("auth.reset_confirm_password")}
            type="password"
            value={confirm}
            onChange={setConfirm}
            required
            minLength={10}
            autoComplete="new-password"
          />
          <p className="-mt-1 text-[11px] text-white/40">{t("auth.password_hint")}</p>

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
            {t("auth.reset_submit")}
          </button>
        </form>
      )}
    </AuthPassageShell>
  );
}
