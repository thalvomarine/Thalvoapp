import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

/** EmptyState — radar-style calm placeholder for feeds / queues / desks. */
export function EmptyState({ icon, title, body, action, className = "" }: Props) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-2 border border-dashed border-white/12 bg-white/[0.02] px-4 py-9 text-center " +
        className
      }
    >
      {icon ? (
        <div className="grid size-11 place-items-center rounded-full border border-[#C9B896]/25 bg-[#C9B896]/08 text-[#C9B896]/90">
          {icon}
        </div>
      ) : null}
      <p className="text-[13px] font-semibold tracking-wide text-white">{title}</p>
      {body ? <p className="max-w-xs text-[11px] leading-relaxed text-white/50">{body}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
