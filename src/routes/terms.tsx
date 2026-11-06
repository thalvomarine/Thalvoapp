import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PublicDocument } from "@/components/public/PublicDocument";
import { LegalSections } from "@/components/public/LegalSections";

export const Route = createFileRoute("/terms")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kullanım Koşulları | THALVO" },
      {
        name: "description",
        content: "THALVO kullanım koşulları — gezinti açık; sipariş, çağrı ve ödeme için hesap gerekir.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();
  return (
    <PublicDocument title={t("public.terms_title")} lede={t("public.terms_intro")}>
      <LegalSections nsKey="public.terms_sections" />
      <p className="text-xs text-white/45">{t("public.legal_updated")}</p>
    </PublicDocument>
  );
}
