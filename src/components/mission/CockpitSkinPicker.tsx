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
    typeof document !== "undefined" ? readCockpitSkin() : "ecdis",
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
          defaultValue: "Beş kokpit dili. Anında harita ve dock’a uygulanır; seçiminizi kaydederiz.",
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
                  ? "border-amber-300 bg-amber-400/15"
                  : "border-white/10 bg-white/5 hover:border-white/20")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={
                    "text-[12px] font-semibold " + (active ? "text-amber-50" : "text-white/80")
                  }
                >
                  {tr ? item.nameTr : item.name}
                </span>
                <span
                  className={
                    "size-2.5 shrink-0 rounded-full " +
                    (item.id === "ecdis"
                      ? "bg-[#00F0FF]"
                      : item.id === "bridge"
                        ? "bg-[#F5B942]"
                        : item.id === "dayplot"
                          ? "bg-[#d97706]"
                          : item.id === "rail"
                            ? "bg-cyan-300"
                            : "bg-teal-300")
                  }
                />
              </div>
              <p className={"mt-0.5 text-[10px] leading-snug " + (active ? "text-amber-50/70" : "text-white/45")}>
                {tr ? item.blurbTr : item.blurb}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
