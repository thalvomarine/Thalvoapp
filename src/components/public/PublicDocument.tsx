import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { PublicFooter } from "@/components/public/PublicFooter";

/** Legal / prose pages — Marina Concierge frame with session-aware header. */
export function PublicDocument({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="thalvo-dark relative flex min-h-dvh flex-col overflow-x-clip bg-[#0C2226] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_-10%,rgba(139,168,163,0.14),transparent_55%),radial-gradient(55%_40%_at_10%_100%,rgba(201,184,150,0.08),transparent_50%)]"
      />
      <PublicChrome />
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 space-y-7 px-5 py-8 sm:py-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9B896]/85">
            {t("public.legal_eyebrow", { defaultValue: "THALVO · Yasal" })}
          </p>
          <h1 className="thalvo-display mt-2 text-[2rem] leading-none tracking-wide text-white sm:text-[2.35rem]">
            {title}
          </h1>
          {lede ? <p className="mt-3 text-[14px] leading-relaxed text-white/60">{lede}</p> : null}
        </div>
        <div className="space-y-6 rounded-[1.5rem] border border-[#C9B896]/18 bg-[#0a1c20]/55 p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-6">
          <div className="space-y-5 [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[0.14em] [&_h2]:text-[#8BA8A3] [&_li]:text-white/70 [&_p]:text-white/70">
            {children}
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-[#8BA8A3]/75">{t("public.legal_review")}</p>
      </main>
      <PublicFooter />
    </div>
  );
}
