import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyCockpitSkin,
  COCKPIT_SKINS,
  readCockpitSkin,
  type CockpitSkinId,
} from "@/lib/cockpit-skins";

/** Design Lab — live skin switcher for signed-in cockpit chrome. */
export function CockpitSkinPicker() {
  const { i18n, t } = useTranslation();
  const tr = i18n.language?.startsWith("tr");
  const [skin, setSkin] = useState<CockpitSkinId>(() =>
    typeof document !== "undefined" ? readCockpitSkin() : "atlas",
  );

  useEffect(() => {
    const current = readCockpitSkin();
    setSkin(current);
    applyCockpitSkin(current);
  }, []);

  const choose = (id: CockpitSkinId) => {
    setSkin(id);
    applyCockpitSkin(id);
  };

  return (
    <div>
      <p className="text-[12px] font-medium text-white/70">
        {t("profile.design_lab", { defaultValue: "Tasarım laboratuvarı" })}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-white/45">
        {t("profile.design_lab_hint", {
          defaultValue:
            "Beş gerçekçi kokpit dili — güven ve okunabilirlik önce. Anında uygulanır.",
        })}
      </p>
      <div className="mt-2 grid gap-1.5">
        {COCKPIT_SKINS.map((item) => {
          const active = skin === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item.id)}
              className={
                "rounded-xl border px-3 py-2.5 text-left transition-colors " +
                (active
                  ? "border-white/25 bg-white/10"
                  : "border-white/10 bg-white/5 hover:border-white/20")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className={"text-[12px] font-semibold " + (active ? "text-white" : "text-white/80")}>
                  {tr ? item.nameTr : item.name}
                </span>
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: item.swatch }}
                  aria-hidden
                />
              </div>
              <p className={"mt-0.5 text-[10px] leading-snug " + (active ? "text-white/70" : "text-white/45")}>
                {tr ? item.blurbTr : item.blurb}
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
                {item.trust}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
