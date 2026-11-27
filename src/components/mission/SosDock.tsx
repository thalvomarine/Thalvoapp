import { AlertOctagon } from "lucide-react";

interface Props {
  onClick: () => void;
  label?: string;
  compact?: boolean;
}

/**
 * SOS dock — always-accessible emergency affordance.
 * Hard danger fill, no bloom / ping (those read as toy, not ECDIS).
 */
export function SosDock({ onClick, label = "SOS", compact = false }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Emergency SOS"
      className={
        "fixed left-4 z-40 inline-flex items-center gap-2 rounded-full font-bold uppercase tracking-[0.18em] text-white " +
        (compact ? "h-12 px-4 text-xs" : "h-14 px-5 text-sm") +
        " transition-transform active:scale-[0.97]"
      }
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        background: "#EF4444",
        boxShadow: "0 14px 36px -14px rgba(0,0,0,0.65)",
      }}
    >
      <span className="grid size-6 place-items-center rounded-full bg-black/15">
        <AlertOctagon className="size-3.5" />
      </span>
      {label}
    </button>
  );
}
