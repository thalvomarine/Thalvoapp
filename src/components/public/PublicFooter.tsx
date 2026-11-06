import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PaymentMarks } from "@/components/payments/PaymentMarks";

/** Shared signed-out footer: coverage, legal, and payment marks for PSP review. */
export function PublicFooter() {
  const { t } = useTranslation();
  const linkCls = "text-[11px] font-semibold text-white/55 hover:text-white";
  return (
    <footer className="relative z-10 px-5 py-6 text-center">
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
      <p className="mt-3 text-[11px] text-white/40">© THALVO · {t("brand.tagline")}</p>
    </footer>
  );
}
