import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** CockpitHeader — MarineOS section masthead for signed-in desks. */
export function CockpitHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-3 border-b border-white/[0.08] pb-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F5B942]/75">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="thalvo-display mt-1 truncate text-[clamp(1.35rem,2.4vw,1.75rem)] tracking-wide text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/55">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
