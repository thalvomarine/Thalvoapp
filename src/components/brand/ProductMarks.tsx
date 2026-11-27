/**
 * THALVO product icon family — Marina Concierge dock marks.
 *
 * Grammar:
 *   • 32×32 viewBox, stroke ≈ 1.5, round caps/joins
 *   • Champagne #C9B896 (accent fill) · Steel #B7C0C8 (structure)
 *   • Clear silhouettes at 20–22px — one meaning per mark
 *   • No neon cyan, no dual-tone glow stacks
 *
 * Dock map:
 *   Atlas = konum · Rescue = fener · Sos = SOS
 *   Marketplace = tekne+parça · Passport = dümen · Charter = yelken
 */

const AMBER = "#C9B896";
const STEEL = "#B7C0C8";
const INK = "#0C2226";
const RING = "rgba(244,239,230,0.45)";
const DANGER = "#C45C5C";
const DANGER_SOFT = "#E08A8A";

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

/** Görevler — coastal lighthouse (fener). */
export function RescueMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <line x1="5" y1="27.2" x2="27" y2="27.2" stroke={STEEL} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <path
        d="M12.2 27.2 L13.4 14.2 H18.6 L19.8 27.2 Z"
        stroke={STEEL}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="12.6" y="10.2" width="6.8" height="4.2" rx="0.8" stroke={STEEL} strokeWidth="1.4" />
      <path d="M13.8 10.2 A2.6 2.6 0 0 1 18.2 10.2" fill={AMBER} />
      <line x1="16" y1="8.4" x2="16" y2="6.4" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5.6" r="1.15" fill={AMBER} />
      {/* Light beams — readable at dock size */}
      <path d="M16.8 7.2 L26 4.2" stroke={AMBER} strokeWidth="1.35" strokeLinecap="round" opacity="0.75" />
      <path d="M15.2 7.2 L6 4.2" stroke={AMBER} strokeWidth="1.35" strokeLinecap="round" opacity="0.75" />
      <path d="M17.2 8.6 L26.5 9.8" stroke={AMBER} strokeWidth="1.15" strokeLinecap="round" opacity="0.4" />
      <path d="M14.8 8.6 L5.5 9.8" stroke={AMBER} strokeWidth="1.15" strokeLinecap="round" opacity="0.4" />
      <line x1="14.2" y1="18.5" x2="17.8" y2="18.5" stroke={STEEL} strokeWidth="1.2" opacity="0.45" />
      <line x1="14" y1="22.2" x2="18" y2="22.2" stroke={STEEL} strokeWidth="1.2" opacity="0.35" />
    </Frame>
  );
}

/** Teknem — ship's helm (dümen). */
export function PassportMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="10.4" stroke={STEEL} strokeWidth="1.55" />
      <circle cx="16" cy="16" r="4.1" stroke={STEEL} strokeWidth="1.45" />
      <circle cx="16" cy="16" r="1.7" fill={AMBER} />
      {/* Eight handles */}
      <g stroke={STEEL} strokeWidth="1.55" strokeLinecap="round">
        <line x1="16" y1="3.8" x2="16" y2="7.4" />
        <line x1="16" y1="24.6" x2="16" y2="28.2" />
        <line x1="3.8" y1="16" x2="7.4" y2="16" />
        <line x1="24.6" y1="16" x2="28.2" y2="16" />
        <line x1="7.2" y1="7.2" x2="9.7" y2="9.7" />
        <line x1="22.3" y1="22.3" x2="24.8" y2="24.8" />
        <line x1="24.8" y1="7.2" x2="22.3" y2="9.7" />
        <line x1="9.7" y1="22.3" x2="7.2" y2="24.8" />
      </g>
    </Frame>
  );
}

/** Guiding star / trust. */
export function TrustMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12.4" stroke={RING} strokeWidth="1.3" />
      <path
        d="M16 6.2 L17.95 14 L25.6 14.8 L17.95 15.6 L16 23.4 L14.05 15.6 L6.4 14.8 L14.05 14 Z"
        fill={AMBER}
      />
      <circle cx="16" cy="14.8" r="1.2" fill={INK} />
    </Frame>
  );
}

/** Pazar — hull + spare-part gear. */
export function MarketplaceMark(props: MarkProps) {
  return (
    <Frame {...props}>
      {/* Boat hull */}
      <path
        d="M4.8 18.2 H16.6 L15.2 22.6 H6.2 Z"
        stroke={STEEL}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 18.2 L11.2 12.4 L14.2 18.2"
        stroke={AMBER}
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <line x1="11.2" y1="12.4" x2="11.2" y2="18.2" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
      {/* Gear / part */}
      <circle cx="22.4" cy="16.6" r="5.1" stroke={STEEL} strokeWidth="1.45" />
      <circle cx="22.4" cy="16.6" r="1.85" fill={AMBER} />
      <g stroke={STEEL} strokeWidth="1.45" strokeLinecap="round">
        <line x1="22.4" y1="10.2" x2="22.4" y2="12" />
        <line x1="22.4" y1="21.2" x2="22.4" y2="23" />
        <line x1="16" y1="16.6" x2="17.8" y2="16.6" />
        <line x1="27" y1="16.6" x2="28.8" y2="16.6" />
        <line x1="17.9" y1="12.1" x2="19.2" y2="13.4" />
        <line x1="25.6" y1="19.8" x2="26.9" y2="21.1" />
        <line x1="26.9" y1="12.1" x2="25.6" y2="13.4" />
        <line x1="19.2" y1="19.8" x2="17.9" y2="21.1" />
      </g>
    </Frame>
  );
}

/** Harbor ops tower. */
export function ControlTowerMark(props: MarkProps) {
  const { glint } = props;
  return (
    <Frame {...props}>
      <line x1="4" y1="27" x2="28" y2="27" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" opacity="0.55" />
      <path d="M11.5 27 L13.2 15 H18.8 L20.5 27 Z" stroke={STEEL} strokeWidth="1.45" strokeLinejoin="round" />
      <rect x="12" y="11" width="8" height="4.2" rx="1" stroke={STEEL} strokeWidth="1.35" />
      <path d="M13.4 11 A2.8 2.8 0 0 1 18.6 11" fill={AMBER} />
      <line x1="16" y1="8.4" x2="16" y2="6.2" stroke={AMBER} strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="16" cy="5.4" r="1" fill={AMBER}>
        {glint && <animate attributeName="opacity" values="0.45;1;0.45" dur="2.4s" repeatCount="indefinite" />}
      </circle>
    </Frame>
  );
}

/** Harita — location pin. */
export function AtlasMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M16 4.8 C11.2 4.8 7.6 8.5 7.6 13.2 C7.6 18.8 16 27.2 16 27.2 C16 27.2 24.4 18.8 24.4 13.2 C24.4 8.5 20.8 4.8 16 4.8 Z"
        stroke={STEEL}
        strokeWidth="1.55"
        strokeLinejoin="round"
        fill="rgba(201,184,150,0.16)"
      />
      <circle cx="16" cy="12.8" r="3.15" stroke={STEEL} strokeWidth="1.4" />
      <circle cx="16" cy="12.8" r="1.35" fill={AMBER} />
    </Frame>
  );
}

/** Charter — sail (yelken). */
export function CharterMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <line x1="11.2" y1="5.2" x2="11.2" y2="24.6" stroke={STEEL} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M11.6 6.2 L24.8 20.4 H11.6 Z"
        fill={AMBER}
        opacity="0.88"
        stroke={AMBER}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M10.8 9.4 L5.6 20.4 H10.8 Z"
        fill={STEEL}
        opacity="0.28"
        stroke={STEEL}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M5 25.4 H27"
        stroke={STEEL}
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M6.5 27 Q16 24.8 25.5 27"
        stroke={STEEL}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.4"
      />
    </Frame>
  );
}

/** Orders / logistics clipboard. */
export function OrdersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <rect x="7.5" y="6" width="17" height="20" rx="2.2" stroke={STEEL} strokeWidth="1.45" />
      <rect x="11.5" y="4.4" width="9" height="3.4" rx="1.1" stroke={STEEL} strokeWidth="1.2" fill={INK} />
      <line x1="11" y1="14" x2="21" y2="14" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="11" y1="18" x2="21" y2="18" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="11" y1="22" x2="17.5" y2="22" stroke={STEEL} strokeWidth="1.25" strokeLinecap="round" opacity="0.35" />
      <circle cx="12.4" cy="14" r="1.05" fill={AMBER} />
      <circle cx="12.4" cy="18" r="1.05" fill={STEEL} opacity="0.75" />
    </Frame>
  );
}

/** Dealer / store counter. */
export function DealerMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M5.5 13.2 L16 6.5 L26.5 13.2 V25.5 H5.5 Z" stroke={STEEL} strokeWidth="1.45" strokeLinejoin="round" />
      <line x1="5.5" y1="13.2" x2="26.5" y2="13.2" stroke={STEEL} strokeWidth="1.3" opacity="0.7" />
      <rect x="13" y="17" width="6" height="8.5" stroke={AMBER} strokeWidth="1.35" />
    </Frame>
  );
}

/** Profile / identity. */
export function ProfileMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12.4" stroke={RING} strokeWidth="1.3" />
      <circle cx="16" cy="12.2" r="3.9" stroke={STEEL} strokeWidth="1.4" />
      <path d="M9.1 24.2 A7.8 7.8 0 0 1 22.9 24.2" stroke={STEEL} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="12.2" r="1.2" fill={AMBER} />
    </Frame>
  );
}

/** THALVO AI — quiet compass rose. */
export function AiMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="12" stroke={STEEL} strokeWidth="1.4" opacity="0.85" />
      <circle cx="16" cy="16" r="7.6" stroke={STEEL} strokeWidth="1.15" opacity="0.35" />
      <path d="M16 7 L17.7 14.4 L16 13.2 L14.3 14.4 Z" fill={AMBER} />
      <path d="M16 25 L14.3 17.6 L16 18.8 L17.7 17.6 Z" fill={STEEL} opacity="0.7" />
      <path d="M7 16 L14.4 14.3 L13.2 16 L14.4 17.7 Z" fill={STEEL} opacity="0.5" />
      <path d="M25 16 L17.6 17.7 L18.8 16 L17.6 14.3 Z" fill={STEEL} opacity="0.5" />
      <circle cx="16" cy="16" r="1.4" fill={INK} stroke={AMBER} strokeWidth="0.95" />
    </Frame>
  );
}

/** Layers latch. */
export function LayersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M16 6 L26.5 11.5 L16 17 L5.5 11.5 Z" stroke={STEEL} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.5 15.5 L16 21 L26.5 15.5" stroke={STEEL} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <path d="M5.5 19.8 L16 25.3 L26.5 19.8" stroke={AMBER} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </Frame>
  );
}

/** Locate / own-ship crosshair. */
export function LocateMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <circle cx="16" cy="16" r="7.2" stroke={STEEL} strokeWidth="1.4" />
      <circle cx="16" cy="16" r="2.05" fill={AMBER} />
      <line x1="16" y1="5" x2="16" y2="9.2" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
      <line x1="16" y1="22.8" x2="16" y2="27" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
      <line x1="5" y1="16" x2="9.2" y2="16" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
      <line x1="22.8" y1="16" x2="27" y2="16" stroke={STEEL} strokeWidth="1.35" strokeLinecap="round" />
    </Frame>
  );
}

/** SOS — bold octagon beacon. */
export function SosMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path
        d="M11.2 4.6 H20.8 L27.4 11.2 V20.8 L20.8 27.4 H11.2 L4.6 20.8 V11.2 Z"
        stroke={DANGER}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="rgba(196,92,92,0.22)"
      />
      <text
        x="16"
        y="19.4"
        textAnchor="middle"
        fill={DANGER_SOFT}
        fontSize="8.2"
        fontWeight="800"
        letterSpacing="0.4"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        SOS
      </text>
    </Frame>
  );
}
