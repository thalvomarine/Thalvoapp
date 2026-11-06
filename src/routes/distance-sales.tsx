import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PublicDocument } from "@/components/public/PublicDocument";
import { LegalSections } from "@/components/public/LegalSections";
import { OPS_CONTACT_EMAIL } from "@/lib/superadmin";

export const Route = createFileRoute("/distance-sales")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mesafeli Satış Sözleşmesi | THALVO" },
      {
        name: "description",
        content: "THALVO mesafeli satış sözleşmesi taslağı — hukuki inceleme sonrası kesinleşir.",
      },
    ],
  }),
  component: DistanceSalesPage,
});

function DistanceSalesPage() {
  const { t } = useTranslation();
  return (
    <PublicDocument
      title={t("public.distance_title")}
      lede={t("public.distance_intro")}
    >
      <LegalSections nsKey="public.distance_sections" />
      <section>
        <h2 className="text-base font-bold">{t("public.distance_seller_title")}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-white/70">
          <li>{t("public.about_placeholder_legal_name")}</li>
          <li>{t("public.about_placeholder_address")}</li>
          <li>{t("public.about_placeholder_tax")}</li>
          <li>{t("public.about_contact_body", { email: OPS_CONTACT_EMAIL })}</li>
        </ul>
      </section>
      <p className="text-xs text-white/45">{t("public.legal_updated")}</p>
    </PublicDocument>
  );
}
