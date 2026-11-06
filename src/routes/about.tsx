import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PublicDocument } from "@/components/public/PublicDocument";
import { LegalSections } from "@/components/public/LegalSections";
import { OPS_CONTACT_EMAIL } from "@/lib/superadmin";

export const Route = createFileRoute("/about")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hakkımızda | THALVO" },
      {
        name: "description",
        content: "THALVO MarineOS — Ege ve Akdeniz için deniz navigasyon ve acil müdahale platformu.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  return (
    <PublicDocument title={t("public.about_title")} lede={t("public.about_intro")}>
      <LegalSections nsKey="public.about_sections" />
      <section>
        <h2 className="text-base font-bold">{t("public.about_contact_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {t("public.about_contact_body", { email: OPS_CONTACT_EMAIL })}
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-white/70">
          <li>{t("public.about_placeholder_legal_name")}</li>
          <li>{t("public.about_placeholder_address")}</li>
          <li>{t("public.about_placeholder_tax")}</li>
        </ul>
      </section>
      <p className="text-xs text-white/45">{t("public.legal_updated")}</p>
    </PublicDocument>
  );
}
