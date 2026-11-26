import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import {
  Anchor,
  ArrowRight,
  Calendar,
  Check,
  Compass,
  Map as MapIcon,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { AegeanChart } from "@/components/aegean-proto/AegeanChart";
import "@/styles/aegean-proto.css";

type Screen = "landing" | "chart" | "vessel" | "market";

const SCREENS: { id: Screen; label: string }[] = [
  { id: "landing", label: "Landing" },
  { id: "chart", label: "Public chart" },
  { id: "vessel", label: "Vessel" },
  { id: "market", label: "Market" },
];

const LISTINGS = [
  {
    id: "azimut",
    title: "Azimut Magellano 66",
    meta: "2020 · 20.1 m · Athens, GR",
    price: "€1,950,000",
    tag: "For sale",
  },
  {
    id: "jeanneau",
    title: "Jeanneau Sun Odyssey 490",
    meta: "2021 · 14.9 m · Kos, GR",
    price: "€695,000",
    tag: "Broker",
  },
  {
    id: "princess",
    title: "Princess Y72",
    meta: "2021 · 22.6 m · Göcek, TR",
    price: "€2,450,000",
    tag: "For sale",
  },
];

/**
 * Local-only B · AEGEAN daylight prototype.
 * Does not replace `/` or `/chart`. DEV-gated via route.
 */
export function AegeanProtoApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [partnerOpen, setPartnerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.aegeanProto = "1";
    return () => {
      delete document.documentElement.dataset.aegeanProto;
    };
  }, []);

  return (
    <div className="aegean-proto">
      <ProtoChrome screen={screen} onScreen={setScreen} />

      {screen === "landing" ? (
        <LandingScreen
          onOpenChart={() => setScreen("chart")}
          onOpenPartner={() => setPartnerOpen(true)}
        />
      ) : (
        <main className="mx-auto min-h-[calc(100dvh-3.25rem)] w-full max-w-[1180px] px-3 pb-8 pt-3 sm:px-5 lg:px-6">
          {screen === "chart" && <ChartScreen />}
          {screen === "vessel" && <VesselScreen />}
          {screen === "market" && <MarketScreen />}
        </main>
      )}

      {partnerOpen && <PartnerModal onClose={() => setPartnerOpen(false)} />}
    </div>
  );
}

function ProtoChrome({
  screen,
  onScreen,
}: {
  screen: Screen;
  onScreen: (s: Screen) => void;
}) {
  return (
    <div className="ae-chrome sticky top-0 z-[1200]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
        <div className="min-w-0">
          <p className="ae-eyebrow text-[color:var(--ae-teal)]">Local prototype</p>
          <p className="truncate text-sm font-semibold text-[color:var(--ae-deep)]">
            B · AEGEAN · MarineOS daylight
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5 sm:ml-auto sm:justify-end sm:gap-2">
          {SCREENS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ae-chip shrink-0 ${screen === s.id ? "ae-chip-active" : ""}`}
              onClick={() => onScreen(s.id)}
            >
              {s.label}
            </button>
          ))}
          <Link
            to="/"
            className="ae-chip shrink-0 border border-[color:var(--ae-line)] bg-white text-[color:var(--ae-muted)]"
          >
            Live site →
          </Link>
        </div>
      </div>
    </div>
  );
}

function LandingScreen({
  onOpenChart,
  onOpenPartner,
}: {
  onOpenChart: () => void;
  onOpenPartner: () => void;
}) {
  return (
    <section className="ae-hero-shell">
      <div className="ae-hero-media" aria-hidden>
        <img src="/aegean-proto/hf-hero.jpg" alt="" />
        <div className="ae-hero-veil" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3.25rem)] w-full max-w-[1180px] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex items-center gap-3 ae-fade-in">
          <Wordmark size="nav" className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]" decorative />
          <div className="min-w-0">
            <p className="ae-display text-[1.45rem] tracking-[0.08em] text-white sm:text-[1.7rem]">
              THALVO
            </p>
            <p className="text-[11px] font-medium tracking-[0.22em] text-[color:var(--ae-gold)]">
              MarineOS
            </p>
          </div>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-white/90 md:flex">
            <span>Solutions</span>
            <span>About</span>
            <Link to="/auth" className="underline-offset-4 hover:underline">
              Sign in
            </Link>
          </nav>
          <button
            type="button"
            className="ml-auto inline-flex size-10 items-center justify-center rounded-full border border-white/35 text-white md:hidden"
            aria-label="Menu"
          >
            <Menu className="size-4" />
          </button>
        </header>

        <div className="mt-auto max-w-xl pb-6 pt-20 sm:pb-10">
          <h1 className="ae-display ae-fade-in text-[clamp(3rem,10vw,5.8rem)] text-white">
            Your Ocean Compass
          </h1>
          <p className="ae-fade-in-delay mt-5 max-w-md text-[1.05rem] leading-relaxed text-white/90">
            Explore the Aegean with confidence — marina clarity, calm navigation, trusted partners.
          </p>

          <div className="ae-fade-in-delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" className="ae-btn ae-btn-primary" onClick={onOpenChart}>
              <Compass className="size-4" />
              Open chart
              <ArrowRight className="size-4" />
            </button>
            <button type="button" className="ae-btn ae-btn-ghost" onClick={onOpenPartner}>
              <Users className="size-4" />
              Partner ol
            </button>
          </div>
        </div>

        <footer className="mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-4 text-white/80">
          <p className="font-mono text-[12px] tracking-wide">36°53.58′ N · 27°16.86′ E</p>
          <span className="ae-scroll-hint text-[color:var(--ae-gold)]" aria-hidden>
            ⌄
          </span>
        </footer>
      </div>
    </section>
  );
}

function ChartScreen() {
  const [bay, setBay] = useState<"aegean" | "mediterranean">("aegean");
  const [tab, setTab] = useState<"map" | "parts" | "services">("map");

  return (
    <section className="ae-surface overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-[color:var(--ae-line)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Wordmark size="sm" decorative />
          <div>
            <p className="text-sm font-semibold text-[color:var(--ae-deep)]">Public day chart</p>
            <p className="text-[11px] text-[color:var(--ae-muted)]">Light basemap · OpenSeaMap</p>
          </div>
        </div>

        <div className="flex rounded-full bg-[color:var(--ae-mist)] p-1">
          {(["aegean", "mediterranean"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`ae-chip capitalize ${bay === id ? "ae-chip-active" : "bg-transparent"}`}
              onClick={() => setBay(id)}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden min-w-[220px] sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--ae-muted)]" />
            <input
              className="ae-input pl-9"
              placeholder="Search place, marina, service…"
              aria-label="Search chart"
            />
          </label>
          <Link to="/auth" className="ae-btn ae-btn-primary px-4 text-sm">
            Sign in
          </Link>
        </div>
      </header>

      <div className="relative h-[min(68svh,720px)]">
        <AegeanChart bay={bay} />

        <aside className="absolute right-3 top-3 hidden w-[148px] rounded-[14px] border border-[color:var(--ae-line)] bg-white/92 p-3 shadow-[var(--ae-shadow-soft)] backdrop-blur md:block">
          <p className="ae-eyebrow mb-2">Legend</p>
          <LegendRow color="#0B3A5B" label="Marina" />
          <LegendRow color="#C9A227" label="Anchorage" />
          <LegendRow color="#1A7A8C" label="Service" />
          <LegendRow color="#E85D4C" label="Hazard" />
        </aside>
      </div>

      <nav className="grid grid-cols-3 border-t border-[color:var(--ae-line)] bg-white">
        {(
          [
            { id: "map", label: "Map", icon: MapIcon },
            { id: "parts", label: "Parts", icon: ShoppingBag },
            { id: "services", label: "Services", icon: Wrench },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex flex-col items-center gap-1 py-3 text-[12px] font-semibold ${
                on ? "text-[color:var(--ae-deep)]" : "text-[color:var(--ae-muted)]"
              }`}
              onClick={() => setTab(item.id)}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab !== "map" && (
        <div className="border-t border-[color:var(--ae-line)] bg-[color:var(--ae-chalk)] px-5 py-4 text-sm text-[color:var(--ae-muted)]">
          {tab === "parts"
            ? "Parts shelf preview — authorised dealers near your bay (mock)."
            : "Service packages preview — technician dispatch stays behind sign-in (mock)."}
        </div>
      )}
    </section>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2 text-[12px] font-medium text-[color:var(--ae-ink)]">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function VesselScreen() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="ae-surface overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src="/aegean-proto/hf-vessel.jpg"
            alt="Motor yacht at Aegean marina"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B3A5B]/80 to-transparent p-5 pt-16 text-white">
            <span className="ae-chip ae-ok-chip">● ACTIVE</span>
            <h2 className="ae-display mt-2 text-[clamp(1.8rem,4vw,2.6rem)]">Sea Whisper</h2>
            <p className="mt-1 text-sm text-white/85">Princess Y72 · 22.6 m · 2021</p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <Spec label="Hull ID" value="GBR-Y72-2218" />
          <Spec label="Flag" value="GBR" />
          <Spec label="Home port" value="Kos" />
        </div>
      </article>

      <aside className="space-y-4">
        <div className="ae-surface p-5">
          <p className="ae-eyebrow">Vessel health</p>
          <h3 className="ae-display mt-1 text-[1.55rem] text-[color:var(--ae-deep)]">Passport</h3>
          <ul className="mt-4 space-y-3">
            <HealthRow done label="Engine service" detail="Completed" />
            <HealthRow done label="Safety equipment" detail="Completed" />
            <HealthRow done label="Hull inspection" detail="Completed" />
            <HealthRow
              done={false}
              label="Next service"
              detail="Apr 12, 2026"
              icon={<Calendar className="size-3.5 text-[color:var(--ae-teal)]" />}
            />
          </ul>
        </div>

        <div className="ae-surface p-5">
          <p className="ae-eyebrow mb-3">Document vault</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Vessel docs", icon: Ship },
              { label: "Insurance", icon: ShieldCheck },
              { label: "Certifications", icon: Check },
              { label: "Crew", icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} type="button" className="ae-btn ae-btn-outline justify-start px-3 text-sm">
                  <Icon className="size-4 text-[color:var(--ae-teal)]" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-[color:var(--ae-mist)] px-3 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-[color:var(--ae-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[color:var(--ae-deep)]">{value}</p>
    </div>
  );
}

function HealthRow({
  label,
  detail,
  done,
  icon,
}: {
  label: string;
  detail: string;
  done: boolean;
  icon?: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex size-6 items-center justify-center rounded-full ${
          done ? "ae-ok-soft" : "bg-[color:var(--ae-mist)] text-[color:var(--ae-teal)]"
        }`}
      >
        {icon ?? <Check className="size-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--ae-deep)]">{label}</p>
        <p className="text-[12px] text-[color:var(--ae-muted)]">{detail}</p>
      </div>
    </li>
  );
}

function MarketScreen() {
  const [tab, setTab] = useState<"boats" | "parts" | "services">("boats");

  return (
    <section className="ae-surface overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-[color:var(--ae-line)] px-4 py-4 sm:px-5">
        <div>
          <p className="ae-eyebrow">Marketplace</p>
          <h2 className="ae-display text-[1.7rem] text-[color:var(--ae-deep)]">Aegean listings</h2>
        </div>
        <div className="ml-auto flex rounded-full bg-[color:var(--ae-mist)] p-1">
          {(
            [
              { id: "boats", label: "Boats" },
              { id: "parts", label: "Spare parts" },
              { id: "services", label: "Services" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ae-chip ${tab === t.id ? "ae-chip-active" : "bg-transparent"}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3 p-4 sm:p-5">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--ae-muted)]" />
          <input className="ae-input pl-9" placeholder="Search boats, yards, brokers…" />
        </label>

        {tab === "boats" &&
          LISTINGS.map((row) => (
            <article
              key={row.id}
              className="flex flex-col gap-3 rounded-[16px] border border-[color:var(--ae-line)] bg-white p-3 sm:flex-row sm:items-center"
            >
              <div className="h-28 w-full overflow-hidden rounded-[12px] bg-[color:var(--ae-mist)] sm:h-24 sm:w-40">
                <img
                  src="/aegean-proto/hf-vessel.jpg"
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[color:var(--ae-deep)]">{row.title}</h3>
                  <span className="ae-chip">{row.tag}</span>
                </div>
                <p className="mt-1 text-sm text-[color:var(--ae-muted)]">{row.meta}</p>
              </div>
              <p className="text-lg font-semibold text-[color:var(--ae-deep)] sm:pr-2">{row.price}</p>
            </article>
          ))}

        {tab !== "boats" && (
          <div className="rounded-[16px] border border-dashed border-[color:var(--ae-line)] bg-[color:var(--ae-chalk)] px-5 py-10 text-center text-sm text-[color:var(--ae-muted)]">
            {tab === "parts"
              ? "Authorised spare-parts shelf — empty state until a dealer catalogue is linked."
              : "Service packages — technician booking stays behind authentication."}
          </div>
        )}
      </div>

      <div className="sticky bottom-3 flex justify-center px-4 pb-2">
        <button type="button" className="ae-btn ae-btn-primary shadow-[var(--ae-shadow)]">
          <Plus className="size-4" />
          Add listing
        </button>
      </div>
    </section>
  );
}

function PartnerModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-end justify-center bg-[#0B3A5B]/45 p-3 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ae-surface relative w-full max-w-md overflow-hidden p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-[color:var(--ae-muted)] hover:bg-[color:var(--ae-mist)]"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2">
          <Wordmark size="sm" decorative />
          <Anchor className="size-4 text-[color:var(--ae-gold)]" />
        </div>
        <h2 id={titleId} className="ae-display mt-3 text-[1.85rem] text-[color:var(--ae-deep)]">
          Become a Partner
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--ae-muted)]">
          Dealers, marinas, and technicians — leave a contact and we’ll open the partner desk.
        </p>

        {sent ? (
          <p className="ae-ok-panel mt-6 rounded-[12px] px-4 py-3 text-sm font-medium">
            Prototype note saved locally — live lead capture stays on the production landing.
          </p>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <input className="ae-input" name="name" placeholder="Full name" required />
            <input className="ae-input" name="phone" placeholder="Phone number" required />
            <button type="submit" className="ae-btn ae-btn-primary w-full">
              Submit
              <ArrowRight className="size-4" />
            </button>
          </form>
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-40"
          style={{
            background:
              "radial-gradient(80% 100% at 50% 100%, color-mix(in srgb, var(--ae-teal) 35%, transparent), transparent)",
          }}
        />
      </div>
    </div>
  );
}
