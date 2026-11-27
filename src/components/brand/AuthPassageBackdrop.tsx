/**
 * AuthPassageBackdrop — Marina Concierge harbour for /auth.
 *
 * Deep teal floor, champagne horizon, soft sea-glass mist, quiet guiding star.
 * CSS + SVG only. Decorative — no real chart, place, or live data.
 */

const CSS = `
.ap-root{position:absolute;inset:0;overflow:hidden;contain:strict;background:#0C2226}
.ap-layer{position:absolute;inset:0;pointer-events:none}
.ap-sky{
  background:
    radial-gradient(70% 55% at 72% 8%, rgba(139,168,163,0.18) 0%, transparent 58%),
    radial-gradient(55% 45% at 18% 88%, rgba(201,184,150,0.1) 0%, transparent 52%),
    linear-gradient(180deg, #09181c 0%, #0C2226 48%, #0a1c20 100%);
}
.ap-haze{
  background: linear-gradient(180deg, transparent 42%, rgba(12,34,38,0.55) 72%, rgba(12,34,38,0.92) 100%);
}
.ap-star{animation:ap-twinkle 4.8s ease-in-out infinite}
.ap-star2{animation-duration:5.8s;animation-delay:-1.2s}
.ap-star3{animation-duration:6.4s;animation-delay:-2.4s}
.ap-star4{animation-duration:5.2s;animation-delay:-3.1s}
.ap-guide{animation:ap-glow 5.2s ease-in-out infinite}
.ap-nav{animation:ap-nav 6s ease-in-out infinite}
.ap-nav2{animation-duration:7s;animation-delay:-2.2s}
.ap-ripple{animation:ap-ripple 9s ease-in-out infinite}
@keyframes ap-twinkle{0%,100%{opacity:.18}50%{opacity:.72}}
@keyframes ap-glow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes ap-nav{0%,100%{opacity:.3}50%{opacity:.9}}
@keyframes ap-ripple{0%,100%{opacity:.22;transform:translateY(0)}50%{opacity:.4;transform:translateY(-3px)}}
@media (prefers-reduced-motion: reduce){
  .ap-star,.ap-star2,.ap-star3,.ap-star4,.ap-guide,.ap-nav,.ap-nav2,.ap-ripple{animation:none!important}
  .ap-guide{opacity:.8}
}
`;

export function AuthPassageBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`ap-root pointer-events-none select-none ${className}`.trim()}
    >
      <style>{CSS}</style>
      <div className="ap-layer ap-sky" />

      <svg
        className="ap-layer h-full w-full"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {/* Soft star field — champagne, not neon */}
        <g fill="#E8DFC8">
          <circle className="ap-star" cx="60" cy="40" r="1" />
          <circle className="ap-star2" cx="110" cy="70" r="0.7" />
          <circle className="ap-star3" cx="160" cy="28" r="1.2" />
          <circle className="ap-star4" cx="220" cy="55" r="0.8" />
          <circle className="ap-star" cx="280" cy="22" r="1" />
          <circle className="ap-star2" cx="340" cy="48" r="0.9" />
          <circle className="ap-star3" cx="400" cy="30" r="1.3" />
          <circle className="ap-star4" cx="460" cy="62" r="0.7" />
          <circle className="ap-star" cx="520" cy="36" r="1.1" />
          <circle className="ap-star2" cx="580" cy="50" r="0.8" />
          <circle className="ap-star3" cx="640" cy="24" r="1" />
          <circle className="ap-star4" cx="700" cy="58" r="0.9" />
          <circle className="ap-star" cx="740" cy="38" r="1.1" />
          <circle className="ap-star2" cx="190" cy="90" r="0.6" />
          <circle className="ap-star3" cx="490" cy="88" r="0.6" />
        </g>

        {/* Guiding star */}
        <g className="ap-guide" transform="translate(400 118)" fill="#C9B896">
          <path d="M0-7 L1.6-1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6-1.6 Z" opacity="0.92" />
        </g>

        {/* Sea-glass water band */}
        <path
          className="ap-ripple"
          d="M0 355 C 160 330, 280 372, 400 348 S 620 330, 800 355 L800 500 L0 500 Z"
          fill="#8BA8A3"
          fillOpacity="0.07"
        />

        {/* Champagne horizon */}
        <path
          d="M60 340 C 200 318, 300 358, 400 336 S 600 318, 740 340"
          fill="none"
          stroke="#C9B896"
          strokeOpacity="0.32"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Quiet seyir lights — muted marina red / green, not neon */}
        <circle className="ap-nav" cx="470" cy="348" r="1.7" fill="#B88982" />
        <circle className="ap-nav2" cx="496" cy="342" r="1.7" fill="#7FA39C" />
      </svg>

      <div className="ap-layer ap-haze" />
    </div>
  );
}
