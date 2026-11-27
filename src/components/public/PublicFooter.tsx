import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PaymentMarks } from "@/components/payments/PaymentMarks";

/** Shared public footer: coverage, legal, payment marks. */
export function PublicFooter() {
  const { t } = useTranslation();
  const linkCls =
    "text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8BA8A3] transition hover:text-[#C9B896]";
  return (
    <footer className="thalvo-safe-bottom-pad relative z-10 border-t border-[#C9B896]/12 px-5 py-6 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link to="/chart" className={linkCls}>
          {t("public.footer_coverage")}
        </Link>
        <Link to="/about" className={linkCls}>
          {t("public.footer_about")}
        </Link>
        <Link to="/privacy" className={linkCls}>
          {t("public.footer_privacy")}
        </Link>
        <Link to="/terms" className={linkCls}>
          {t("public.footer_terms")}
        </Link>
        <Link to="/distance-sales" className={linkCls}>
          {t("public.footer_distance")}
        </Link>
        <Link to="/delivery-returns" className={linkCls}>
          {t("public.footer_delivery")}
        </Link>
      </nav>
      <PaymentMarks className="mt-4" />
      <p className="mt-2 text-[10px] text-white/35">{t("public.payment_marks_note")}</p>
      <p className="mt-3 text-[11px] tracking-wide text-white/40">© THALVO · {t("brand.tagline")}</p>
    </footer>
  );
}
