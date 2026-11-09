import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PublicDocument } from "@/components/public/PublicDocument";
import { LegalSections } from "@/components/public/LegalSections";

export const Route = createFileRoute("/delivery-returns")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Teslimat ve İade | THALVO" },
      {
        name: "description",
        content: "THALVO yedek parça teslimatı, servis ifası ve iade koşulları.",
      },
    ],
  }),
  component: DeliveryReturnsPage,
});

function DeliveryReturnsPage() {
  const { t } = useTranslation();
  return (
    <PublicDocument
      title={t("public.delivery_title")}
      lede={t("public.delivery_intro")}
    >
      <LegalSections nsKey="public.delivery_sections" />
      <p className="text-xs text-white/45">{t("public.legal_updated")}</p>
    </PublicDocument>
  );
}
