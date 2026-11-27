import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock3, ShieldCheck, Store, Wrench } from "lucide-react";
import type { UserRole } from "@/lib/session";

type Props = {
  requestedRole: UserRole;
  /** Compact strip for MissionShell; fuller panel for desk gates. */
  variant?: "banner" | "panel";
  className?: string;
};

/**
 * Shown while profiles.role is still Client but requested_role is Provider/Supplier.
 * Keeps usta/bayi applicants out of a dead "access denied" wall.
 */
export function PartnerPendingPanel({
  requestedRole,
  variant = "panel",
  className = "",
}: Props) {
  const { t } = useTranslation();
  const isDealer = requestedRole === "Supplier";
  const Icon = isDealer ? Store : Wrench;
  const roleLabel = isDealer ? t("auth.role_supplier") : t("auth.role_provider");

  if (variant === "banner") {
    return (
      <div
        className={
          "flex items-start gap-2.5 border border-[#C9B896]/30 bg-[#0C2226]/95 px-3 py-2.5 text-[12px] leading-snug text-[#E8DFC8] shadow-lg backdrop-blur-md " +
          className
        }
        role="status"
      >
        <Clock3 className="mt-0.5 size-4 shrink-0 text-[#C9B896]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">
            {t("partner_pending.banner_title", { role: roleLabel })}
          </p>
          <p className="mt-0.5 text-white/60">{t("partner_pending.banner_body")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center " + className
      }
      role="status"
    >
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-[#C9B896]/35 bg-[#C9B896]/10">
        <Icon className="size-5 text-[#C9B896]" aria-hidden />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9B896]/80">
        {t("partner_pending.kicker")}
      </p>
      <h2 className="thalvo-display mt-2 text-2xl tracking-wide text-white">
        {t("partner_pending.title", { role: roleLabel })}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-white/55">
        {t("partner_pending.body")}
      </p>
      <ul className="mx-auto mt-6 grid max-w-sm gap-2 text-left text-[12px] text-white/65">
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#8BA8A3]" aria-hidden />
          <span>{t("partner_pending.point_review")}</span>
        </li>
        <li className="flex items-start gap-2">
          <Clock3 className="mt-0.5 size-3.5 shrink-0 text-[#C9B896]" aria-hidden />
          <span>{t("partner_pending.point_wait")}</span>
        </li>
      </ul>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/app"
          className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 px-5 text-sm font-semibold text-white/85 hover:bg-white/5"
        >
          {t("partner_pending.open_chart")}
        </Link>
        {isDealer ? (
          <span className="text-[11px] text-white/40">{t("partner_pending.desk_after")}</span>
        ) : null}
      </div>
    </div>
  );
}
