import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Anchor, Wrench } from "lucide-react";
import type { PackageRow } from "@/lib/public-catalog";

/**
 * ServicePackageCard — shared presentation for a service package row.
 * Quote-first: no estimated duration, no fixed price on the card.
 */
export function ServicePackageCard({
  pkg,
  actionSlot,
}: {
  pkg: PackageRow;
  actionSlot?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language.toLowerCase().startsWith("tr");
  const isDiver = pkg.category === "diver";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#C9B896]/30 bg-[#C9B896]/10 text-[#C9B896]">
        {isDiver ? <Anchor className="size-5" /> : <Wrench className="size-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">
          {isTr ? pkg.title_tr : pkg.title_en}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9B896]/85">
          {t("services.request_quote")}
        </p>
      </div>
      {actionSlot ? <div className="ml-auto shrink-0 self-center">{actionSlot}</div> : null}
    </div>
  );
}
