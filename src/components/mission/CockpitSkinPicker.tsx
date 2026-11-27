import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applyCockpitSkin, COCKPIT_SKINS } from "@/lib/cockpit-skins";

/** Design Lab — Marina Concierge locked; other skins retired. */
export function CockpitSkinPicker() {
  const { t } = useTranslation();
  const marina = COCKPIT_SKINS[0];

  useEffect(() => {
    applyCockpitSkin("marina");
  }, []);

  return (
    <div>
      <p className="text-[12px] font-medium text-white/70">
        {t("profile.design_lab", { defaultValue: "Tasarım laboratuvarı" })}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-white/45">
        {t("profile.design_lab_hint", {
          defaultValue: "Seçilen dil: Marina Concierge. Diğer denemeler kaldırıldı; iyileştirme bu dil üzerinde.",
        })}
      </p>
      <div
        className="mt-2 rounded-xl border border-[color:rgb(201_184_150_/0.35)] bg-[color:rgb(201_184_150_/0.1)] px-3 py-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-[#f4efe6]">{marina.nameTr}</span>
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: marina.swatch }} aria-hidden />
        </div>
        <p className="mt-0.5 text-[10px] leading-snug text-white/55">{marina.blurbTr}</p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
          {marina.trust}
        </p>
      </div>
    </div>
  );
}
