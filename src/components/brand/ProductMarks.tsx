/**
 * THALVO product icon family — MarineOS ECDIS marks.
 *
 * Grammar:
 *   • 32×32 viewBox, stroke ≈ 1.2, round caps/joins
 *   • Champagne #C9B896 (command) · Sea glass #8BA8A3 (chart ops) · Steel #A8B4C0
 *   • No lucide/emoji here — brand asset only
 *   Marina Concierge lock: muted metals, no neon cyan / loud amber.
 */

const AMBER = "#C9B896";
const CYAN = "#8BA8A3";
const STEEL = "#A8B4C0";
const NAVY = "#0C2226";
const RING = "rgba(255,255,255,0.5)";

interface MarkProps {
  size?: number;
  className?: string;
  glint?: boolean;
}

function Frame({
  size = 24,
  className,
  children,
}: MarkProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Emergency beacon — signal arcs + amber pulse. */
export function RescueMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="13.25" stroke={RING} strokeWidth="1.15" opacity="0.85" />
      <path
        d="M6.5 12.5 A10.5 10.5 0 0 1 25.5 12.5"
        stroke={STEEL}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M9 14 A7.5 7.5 0 0 1 23 14"
        stroke={STEEL}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.9"
      />
      <line x1="16" y1="16" x2="16" y2="24.5" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" />
      <line x1="11.5" y1="24.5" x2="20.5" y2="24.5" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.6" fill={AMBER} />
      <circle cx="16" cy="16" r="4.4" stroke={AMBER} strokeWidth="1.15" opacity="0.55" />
    </Frame>
  );
}

/** Vessel ID plate. */
export function PassportMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="5.75" y="4.5" width="20.5" height="23" rx="3" stroke={STEEL} strokeWidth="1.15" />
      <path
        d="M9.5 13 L16 8.5 L22.5 13 Z"
        fill={NAVY}
        stroke={STEEL}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path
        d="M10 15.5 H22 L20.5 18.5 H11.5 Z"
        fill={AMBER}
        stroke={AMBER}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <line x1="9" y1="21.25" x2="23" y2="21.25" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.55" />
      <line x1="9" y1="23.75" x2="19" y2="23.75" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.4" />
    </Frame>
  );
}

/** Guiding star / trust. */
export function TrustMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="13.25" stroke={RING} strokeWidth="1.15" opacity="0.85" />
      <path d="M6.5 20 A10 10 0 0 0 25.5 20" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.55" />
      <path d="M16 5.5 L18.6 15 L28 16 L18.6 17 L16 26.5 L13.4 17 L4 16 L13.4 15 Z" fill={AMBER} />
      <circle cx="16" cy="16" r="1.2" fill={NAVY} stroke={AMBER} strokeWidth="0.9" />
    </Frame>
  );
}

/** Cargo / marketplace. */
export function MarketplaceMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="4.5" y="9" width="23" height="15" rx="2" stroke={STEEL} strokeWidth="1.15" />
      <g stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.55">
        <line x1="9" y1="12" x2="9" y2="21" />
        <line x1="12.5" y1="12" x2="12.5" y2="21" />
        <line x1="19.5" y1="12" x2="19.5" y2="21" />
        <line x1="23" y1="12" x2="23" y2="21" />
      </g>
      <line x1="4.5" y1="15.5" x2="27.5" y2="15.5" stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 9 V6.5 H14" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 9 V6.5 H18" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="26.25" x2="28" y2="26.25" stroke={RING} strokeWidth="1.15" strokeLinecap="round" opacity="0.4" />
    </Frame>
  );
}

/** Harbor ops tower. */
export function ControlTowerMark(props: MarkProps) {
  const { glint } = props;
  return (
    <Frame {...props}>
      <line x1="3.5" y1="27.5" x2="28.5" y2="27.5" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.6" />
      <path d="M11 27.5 L13 15 H19 L21 27.5 Z" stroke={STEEL} strokeWidth="1.15" strokeLinejoin="round" />
      <rect x="11" y="10.5" width="10" height="5" rx="1" stroke={STEEL} strokeWidth="1.15" />
      <path d="M13 10.5 A3 3 0 0 1 19 10.5" fill={AMBER} />
      <line x1="16" y1="7.5" x2="16" y2="5" stroke={AMBER} strokeWidth="1.15" strokeLinecap="round" />
      <circle cx="16" cy="4.5" r="0.9" fill={AMBER}>
        {glint && <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite" />}
      </circle>
      <path d="M7 6 A10 10 0 0 1 16 2" stroke={AMBER} strokeWidth="1.15" strokeLinecap="round" opacity="0.55" />
      <path d="M25 6 A10 10 0 0 0 16 2" stroke={AMBER} strokeWidth="1.15" strokeLinecap="round" opacity="0.55" />
    </Frame>
  );
}

/** Chart plate / atlas. */
export function AtlasMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M5 7 L12 5.5 L20 8 L27 6 V25 L20 27 L12 24.5 L5 26 Z"
        stroke={STEEL}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <line x1="12" y1="5.5" x2="12" y2="24.5" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="8" x2="20" y2="27" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.5" />
      <path d="M7 20 Q11 17 15 19 T25 18" stroke={CYAN} strokeWidth="1.15" strokeLinecap="round" opacity="0.75" />
      <path d="M7 23 Q11 20 15 22 T25 21" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.35" />
      <path d="M16.5 10 L19 15.5 L16.5 14.25 L14 15.5 Z" fill={AMBER} />
    </Frame>
  );
}

/** Charter yacht mark for dock. */
export function CharterMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M5 22.5 H27 L24.5 19 H7.5 Z"
        fill={NAVY}
        stroke={STEEL}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path d="M10 19 L16 8 L22 19" stroke={STEEL} strokeWidth="1.15" strokeLinejoin="round" />
      <line x1="16" y1="8" x2="16" y2="19" stroke={AMBER} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 10 L22 14" stroke={STEEL} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <line x1="4" y1="25.5" x2="28" y2="25.5" stroke={CYAN} strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
    </Frame>
  );
}

/** Orders / logistics clipboard. */
export function OrdersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="7" y="5.5" width="18" height="21" rx="2.5" stroke={STEEL} strokeWidth="1.15" />
      <rect x="11" y="4" width="10" height="4" rx="1.2" stroke={STEEL} strokeWidth="1.1" fill={NAVY} />
      <line x1="10.5" y1="14" x2="21.5" y2="14" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.55" />
      <line x1="10.5" y1="18" x2="21.5" y2="18" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.55" />
      <line x1="10.5" y1="22" x2="17.5" y2="22" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" opacity="0.4" />
      <circle cx="12" cy="14" r="1.1" fill={AMBER} />
      <circle cx="12" cy="18" r="1.1" fill={CYAN} opacity="0.9" />
    </Frame>
  );
}

/** Dealer / store counter. */
export function DealerMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M5 13 L16 6 L27 13 V25.5 H5 Z" stroke={STEEL} strokeWidth="1.15" strokeLinejoin="round" />
      <rect x="12.5" y="17" width="7" height="8.5" stroke={AMBER} strokeWidth="1.15" />
      <line x1="5" y1="13" x2="27" y2="13" stroke={STEEL} strokeWidth="1.15" opacity="0.7" />
      <line x1="9" y1="16.5" x2="9" y2="21" stroke={CYAN} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <line x1="23" y1="16.5" x2="23" y2="21" stroke={CYAN} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </Frame>
  );
}

/** Profile / identity. */
export function ProfileMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="13.25" stroke={RING} strokeWidth="1.15" opacity="0.75" />
      <circle cx="16" cy="12" r="4.2" stroke={STEEL} strokeWidth="1.15" />
      <path d="M8.5 24.5 A8.2 8.2 0 0 1 23.5 24.5" stroke={STEEL} strokeWidth="1.15" strokeLinecap="round" />
      <circle cx="16" cy="12" r="1.4" fill={AMBER} />
    </Frame>
  );
}

/** THALVO AI — compass rose without north-lock confusion. */
export function AiMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12.5" stroke={STEEL} strokeWidth="1.15" opacity="0.85" />
      <circle cx="16" cy="16" r="8.2" stroke={CYAN} strokeWidth="1.1" opacity="0.45" />
      <path d="M16 6.5 L18.2 15.2 L16 13.8 L13.8 15.2 Z" fill={AMBER} />
      <path d="M16 25.5 L13.8 16.8 L16 18.2 L18.2 16.8 Z" fill={STEEL} opacity="0.7" />
      <path d="M6.5 16 L15.2 13.8 L13.8 16 L15.2 18.2 Z" fill={STEEL} opacity="0.55" />
      <path d="M25.5 16 L16.8 18.2 L18.2 16 L16.8 13.8 Z" fill={STEEL} opacity="0.55" />
      <circle cx="16" cy="16" r="1.5" fill={NAVY} stroke={CYAN} strokeWidth="1" />
    </Frame>
  );
}

/** Layers latch. */
export function LayersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M16 5.5 L27 11.5 L16 17.5 L5 11.5 Z" stroke={STEEL} strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M5 16 L16 22 L27 16" stroke={CYAN} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M5 20.5 L16 26.5 L27 20.5" stroke={AMBER} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </Frame>
  );
}

/** Locate / own-ship crosshair. */
export function LocateMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="7.5" stroke={CYAN} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="2.2" fill={AMBER} />
      <line x1="16" y1="4.5" x2="16" y2="9.5" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="22.5" x2="16" y2="27.5" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="16" x2="9.5" y2="16" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22.5" y1="16" x2="27.5" y2="16" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" />
    </Frame>
  );
}

/** Flat SOS octagon — danger only. */
export function SosMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M11 5.5 H21 L26.5 11 V21 L21 26.5 H11 L5.5 21 V11 Z"
        stroke="#EF4444"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="rgba(239,68,68,0.15)"
      />
      <text
        x="16"
        y="19.2"
        textAnchor="middle"
        fill="#EF4444"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        SOS
      </text>
    </Frame>
  );
}
