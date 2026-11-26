import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CharterDesk } from "@/components/charter/CharterDesk";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/charter-preview")({
  ssr: false,
  component: CharterPreviewPage,
});

function CharterPreviewPage() {
  const { t } = useTranslation();
  return (
    <div className="thalvo-dark thalvo-cockpit min-h-dvh bg-[#06101c] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-5">
        <Link to="/">
          <Wordmark size="sm" className="text-white" />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/charter" className="text-[12px] font-semibold text-[#F5B942]">
            {t("charter.guest_link")}
          </Link>
          <LanguageSwitcher tone="dark" />
          <Link
            to="/auth"
            search={{ next: "/app/charter" }}
            className="inline-flex h-9 items-center rounded-full bg-amber-400 px-4 text-xs font-semibold text-[#1a1203]"
          >
            {t("auth.sign_in")}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-16">
        <CharterDesk />
      </main>
    </div>
  );
}
