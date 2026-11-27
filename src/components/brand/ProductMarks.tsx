/**
 * THALVO product icon family — Marina Concierge dock marks.
 *
 * Grammar:
 *   • 32×32 viewBox, stroke ≈ 1.35, round caps/joins
 *   • Champagne #C9B896 (single accent) · Steel #A8B4C0 (structure)
 *   • No neon cyan fills, no loud dual-tone glows
 *   • No lucide/emoji here — brand asset only
 */

const AMBER = "#C9B896";
const STEEL = "#A8B4C0";
const INK = "#0C2226";
const RING = "rgba(244,239,230,0.42)";

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

/** Missions — soft radar sweep, champagne core. */
export function RescueMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="17" r="2.2" fill={AMBER} />
      <path
        d="M10.2 13.2 A7.2 7.2 0 0 1 21.8 13.2"
        stroke={STEEL}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M7.2 10.4 A11.2 11.2 0 0 1 24.8 10.4"
        stroke={STEEL}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M5.2 7.8 A14 14 0 0 1 26.8 7.8"
        stroke={STEEL}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.32"
      />
      <line x1="16" y1="19.2" x2="16" y2="25.2" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
      <line x1="12.2" y1="25.2" x2="19.8" y2="25.2" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
    </Frame>
  );
}

/** Vessel passport — plate with soft crest. */
export function PassportMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="6.5" y="5" width="19" height="22" rx="2.5" stroke={STEEL} strokeWidth="1.35" />
      <path
        d="M11 13.2 L16 9.2 L21 13.2"
        stroke={STEEL}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 13.2 H20.8 L19.4 16.6 H12.6 Z"
        fill={AMBER}
        opacity="0.92"
      />
      <line x1="10" y1="20" x2="22" y2="20" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="23" x2="18.5" y2="23" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" opacity="0.35" />
    </Frame>
  );
}

/** Guiding star / trust. */
export function TrustMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12.6" stroke={RING} strokeWidth="1.2" />
      <path
        d="M16 6.5 L17.9 14.2 L25.5 15 L17.9 15.8 L16 23.5 L14.1 15.8 L6.5 15 L14.1 14.2 Z"
        fill={AMBER}
        opacity="0.95"
      />
      <circle cx="16" cy="15" r="1.15" fill={INK} />
    </Frame>
  );
}

/** Marketplace — crate with champagne strap. */
export function MarketplaceMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="5.5" y="9.5" width="21" height="14" rx="2" stroke={STEEL} strokeWidth="1.35" />
      <path
        d="M10.5 9.5 V7.4 H14.2"
        stroke={STEEL}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 9.5 V7.4 H17.8"
        stroke={STEEL}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="5.5" y1="15.5" x2="26.5" y2="15.5" stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11" y1="12.2" x2="11" y2="21.2" stroke={STEEL} strokeWidth="1.15" opacity="0.4" />
      <line x1="21" y1="12.2" x2="21" y2="21.2" stroke={STEEL} strokeWidth="1.15" opacity="0.4" />
      <line x1="6" y1="26" x2="26" y2="26" stroke={RING} strokeWidth="1.15" strokeLinecap="round" />
    </Frame>
  );
}

/** Harbor ops tower. */
export function ControlTowerMark(props: MarkProps) {
  const { glint } = props;
  return (
    <Frame {...props}>
      <line x1="4" y1="27" x2="28" y2="27" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" opacity="0.55" />
      <path d="M11.5 27 L13.2 15.2 H18.8 L20.5 27 Z" stroke={STEEL} strokeWidth="1.35" strokeLinejoin="round" />
      <rect x="12" y="11" width="8" height="4.4" rx="1" stroke={STEEL} strokeWidth="1.25" />
      <path d="M13.4 11 A2.8 2.8 0 0 1 18.6 11" fill={AMBER} opacity="0.9" />
      <line x1="16" y1="8.4" x2="16" y2="6.2" stroke={AMBER} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="16" cy="5.4" r="0.95" fill={AMBER}>
        {glint && <animate attributeName="opacity" values="0.45;1;0.45" dur="2.4s" repeatCount="indefinite" />}
      </circle>
    </Frame>
  );
}

/** Chart / map — folded plate + soft pin. */
export function AtlasMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M5.5 7.5 L12.2 5.8 L19.8 8.4 L26.5 6.6 V24.8 L19.8 26.6 L12.2 24 L5.5 25.8 Z"
        stroke={STEEL}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <line x1="12.2" y1="5.8" x2="12.2" y2="24" stroke={STEEL} strokeWidth="1.15" opacity="0.4" />
      <line x1="19.8" y1="8.4" x2="19.8" y2="26.6" stroke={STEEL} strokeWidth="1.15" opacity="0.4" />
      <path
        d="M7.5 19.5 Q12 16.8 16.2 18.8 T25 18"
        stroke={STEEL}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="16.5" cy="12.2" r="2.1" fill={AMBER} />
      <circle cx="16.5" cy="12.2" r="0.7" fill={INK} />
    </Frame>
  );
}

/** Charter yacht — quiet sail on water. */
export function CharterMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M6 22.2 H26 L23.6 18.8 H8.4 Z"
        stroke={STEEL}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M16 8.2 L16 18.8"
        stroke={AMBER}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M16.4 9.2 L22.2 17.6 H16.4 Z"
        fill={STEEL}
        opacity="0.35"
        stroke={STEEL}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path
        d="M15.6 10.4 L11.2 17.6 H15.6 Z"
        fill={AMBER}
        opacity="0.55"
        stroke={AMBER}
        strokeWidth="1.05"
        strokeLinejoin="round"
      />
      <path
        d="M5 25.2 Q10.5 23.6 16 25.2 T27 25.2"
        stroke={STEEL}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.45"
      />
    </Frame>
  );
}

/** Orders / logistics clipboard. */
export function OrdersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="7.5" y="6" width="17" height="20" rx="2.2" stroke={STEEL} strokeWidth="1.35" />
      <rect x="11.5" y="4.4" width="9" height="3.4" rx="1.1" stroke={STEEL} strokeWidth="1.15" fill={INK} />
      <line x1="11" y1="14" x2="21" y2="14" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="11" y1="18" x2="21" y2="18" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="11" y1="22" x2="17.5" y2="22" stroke={STEEL} strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <circle cx="12.4" cy="14" r="1" fill={AMBER} />
      <circle cx="12.4" cy="18" r="1" fill={STEEL} opacity="0.75" />
    </Frame>
  );
}

/** Dealer / store counter. */
export function DealerMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M5.5 13.2 L16 6.5 L26.5 13.2 V25.5 H5.5 Z" stroke={STEEL} strokeWidth="1.35" strokeLinejoin="round" />
      <line x1="5.5" y1="13.2" x2="26.5" y2="13.2" stroke={STEEL} strokeWidth="1.25" opacity="0.7" />
      <rect x="13" y="17" width="6" height="8.5" stroke={AMBER} strokeWidth="1.25" />
    </Frame>
  );
}

/** Profile / identity. */
export function ProfileMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12.6" stroke={RING} strokeWidth="1.2" />
      <circle cx="16" cy="12.2" r="3.8" stroke={STEEL} strokeWidth="1.3" />
      <path d="M9.2 24 A7.6 7.6 0 0 1 22.8 24" stroke={STEEL} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="12.2" r="1.15" fill={AMBER} />
    </Frame>
  );
}

/** THALVO AI — quiet compass rose. */
export function AiMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12" stroke={STEEL} strokeWidth="1.3" opacity="0.85" />
      <circle cx="16" cy="16" r="7.6" stroke={STEEL} strokeWidth="1.1" opacity="0.35" />
      <path d="M16 7 L17.7 14.4 L16 13.2 L14.3 14.4 Z" fill={AMBER} />
      <path d="M16 25 L14.3 17.6 L16 18.8 L17.7 17.6 Z" fill={STEEL} opacity="0.7" />
      <path d="M7 16 L14.4 14.3 L13.2 16 L14.4 17.7 Z" fill={STEEL} opacity="0.5" />
      <path d="M25 16 L17.6 17.7 L18.8 16 L17.6 14.3 Z" fill={STEEL} opacity="0.5" />
      <circle cx="16" cy="16" r="1.35" fill={INK} stroke={AMBER} strokeWidth="0.9" />
    </Frame>
  );
}

/** Layers latch. */
export function LayersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M16 6 L26.5 11.5 L16 17 L5.5 11.5 Z" stroke={STEEL} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 15.5 L16 21 L26.5 15.5" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <path d="M5.5 19.8 L16 25.3 L26.5 19.8" stroke={AMBER} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </Frame>
  );
}

/** Locate / own-ship crosshair. */
export function LocateMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="7.2" stroke={STEEL} strokeWidth="1.3" />
      <circle cx="16" cy="16" r="2" fill={AMBER} />
      <line x1="16" y1="5" x2="16" y2="9.2" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" />
      <line x1="16" y1="22.8" x2="16" y2="27" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" />
      <line x1="5" y1="16" x2="9.2" y2="16" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" />
      <line x1="22.8" y1="16" x2="27" y2="16" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" />
    </Frame>
  );
}

/** Flat SOS octagon — danger only. */
export function SosMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M11 5.5 H21 L26.5 11 V21 L21 26.5 H11 L5.5 21 V11 Z"
        stroke="#C45C5C"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill="rgba(196,92,92,0.14)"
      />
      <text
        x="16"
        y="19.1"
        textAnchor="middle"
        fill="#E08A8A"
        fontSize="7.2"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        SOS
      </text>
    </Frame>
  );
}
