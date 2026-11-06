import type { ReactNode } from "react";

/**
 * Card / PSP marks required for İyzico merchant review.
 * Inline SVGs — no remote brand CDN. Payments stay simulated until live wiring.
 */
export function PaymentMarks({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`}
      role="group"
      aria-label="Payment marks"
    >
      <VisaMark />
      <MastercardMark />
      <IyzicoMark />
    </div>
  );
}

function Badge({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span
      className="inline-flex h-8 items-center rounded-md border border-white/12 bg-white px-2.5 shadow-sm"
      title={label}
      aria-label={label}
    >
      {children}
    </span>
  );
}

function VisaMark() {
  return (
    <Badge label="Visa">
      <svg width="40" height="14" viewBox="0 0 40 14" aria-hidden="true">
        <text
          x="0"
          y="11"
          fill="#1A1F71"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="12"
          fontWeight="800"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>
    </Badge>
  );
}

function MastercardMark() {
  return (
    <Badge label="Mastercard">
      <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true">
        <circle cx="12" cy="10" r="8" fill="#EB001B" />
        <circle cx="22" cy="10" r="8" fill="#F79E1B" />
        <path
          d="M17 4.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z"
          fill="#FF5F00"
        />
      </svg>
    </Badge>
  );
}

function IyzicoMark() {
  return (
    <Badge label="iyzico ile Öde">
      <svg width="52" height="14" viewBox="0 0 52 14" aria-hidden="true">
        <text
          x="0"
          y="11"
          fill="#1E64FF"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="11"
          fontWeight="700"
        >
          iyzico
        </text>
      </svg>
    </Badge>
  );
}
