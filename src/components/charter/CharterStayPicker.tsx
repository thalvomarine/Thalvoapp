import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { addIsoDays, stayNights, toIsoDate } from "@/lib/charter-fleet";

type Props = {
  checkIn: string;
  checkOut: string;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
  openDays?: string[];
  embark?: string;
  disembark?: string;
};

type DayTone = "out" | "edge-in" | "edge-out" | "mid" | "preview" | "closed" | "idle";

function monthStart(iso: string): Date {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, 1);
}

function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

function monthLabel(date: Date, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  return new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(date);
}

function dayLabel(iso: string, locale: string): string {
  if (!iso) return "—";
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(y!, m! - 1, d!));
}

function weekdayLabels(locale: string): string[] {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const monday = new Date(2026, 0, 5);
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(tag, { weekday: "narrow" }).format(new Date(monday.getTime() + i * 86_400_000)),
  );
}

function cellsForMonth(anchor: Date): Array<{ iso: string; inMonth: boolean }> {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7;
  const start = new Date(first.getTime() - startPad * 86_400_000);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(start.getTime() + i * 86_400_000);
    return {
      iso: toIsoDate(day),
      inMonth: day.getMonth() === anchor.getMonth(),
    };
  });
}

function tone(iso: string, checkIn: string, checkOut: string, hover: string, open: Set<string> | null): DayTone {
  if (open && !open.has(iso)) return "closed";
  if (checkIn && iso === checkIn) return "edge-in";
  if (checkOut && iso === checkOut) return "edge-out";
  if (checkIn && checkOut && iso > checkIn && iso < checkOut) return "mid";
  if (checkIn && !checkOut && hover) {
    const lo = checkIn < hover ? checkIn : hover;
    const hi = checkIn < hover ? hover : checkIn;
    if (iso > lo && iso < hi) return "preview";
    if (iso === hover && hover !== checkIn) return "preview";
  }
  return "idle";
}

/** Dual-month stay picker with draft → save. Nights are [check-in, check-out). */
export function CharterStayPicker({
  checkIn,
  checkOut,
  onChange,
  openDays,
  embark = "17:00",
  disembark = "09:00",
}: Props) {
  const { t, i18n } = useTranslation();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<"in" | "out">("in");
  const [hover, setHover] = useState("");
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [left, setLeft] = useState(() => monthStart(checkIn || toIsoDate(new Date())));
  const [anchor, setAnchor] = useState({ top: 0, left: 0, width: 0 });
  const openSet = useMemo(() => (openDays ? new Set(openDays) : null), [openDays]);
  const committedNights = stayNights(checkIn, checkOut).length;
  const draftNights = stayNights(draftIn, draftOut).length;
  const weekdays = useMemo(() => weekdayLabels(i18n.language), [i18n.language]);
  const right = shiftMonth(left, 1);
  const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;
  const canSave = Boolean(draftIn && draftOut && draftOut > draftIn);

  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const place = () => {
      const rect = root.current!.getBoundingClientRect();
      const width = Math.min(680, Math.max(rect.width, Math.min(window.innerWidth - 24, 640)));
      const leftPos = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12));
      setAnchor({ top: rect.bottom + 10, left: leftPos, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (root.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setDraftIn(checkIn);
      setDraftOut(checkOut);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDraftIn(checkIn);
        setDraftOut(checkOut);
      }
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, checkIn, checkOut]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    if (window.matchMedia("(max-width: 639px)").matches) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const openPanel = () => {
    setDraftIn(checkIn);
    setDraftOut(checkOut);
    setPick(checkIn && !checkOut ? "out" : "in");
    setLeft(monthStart(checkIn || toIsoDate(new Date())));
    setOpen(true);
  };

  const choose = (iso: string) => {
    if (openSet && !openSet.has(iso)) return;
    if (pick === "in" || !draftIn || (draftOut && draftIn)) {
      setDraftIn(iso);
      setDraftOut("");
      setPick("out");
      return;
    }
    if (iso <= draftIn) {
      setDraftIn(iso);
      setDraftOut("");
      setPick("out");
      return;
    }
    setDraftOut(iso);
    setPick("in");
  };

  const clear = () => {
    setDraftIn("");
    setDraftOut("");
    setPick("in");
  };

  const save = () => {
    if (!canSave) return;
    onChange({ checkIn: draftIn, checkOut: draftOut });
    setOpen(false);
  };

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label={t("common.close")}
              className="fixed inset-0 z-[2200] bg-black/55 sm:bg-black/25"
              onClick={() => {
                setOpen(false);
                setDraftIn(checkIn);
                setDraftOut(checkOut);
              }}
            />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={t("charter.stay_label")}
              className="charter-stay-panel fixed z-[2210] overflow-hidden border border-white/12 bg-[#071422] shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:rounded-t-[1.75rem] max-sm:border-b-0 sm:rounded-3xl"
              style={desktop ? { top: anchor.top, left: anchor.left, width: anchor.width } : undefined}
            >
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1">
                  <button
                    type="button"
                    onClick={() => setPick("in")}
                    className={
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors duration-200 " +
                      (pick === "in" ? "bg-[#F5B942] text-[#1a1203]" : "text-white/55 hover:text-white/85")
                    }
                  >
                    {t("charter.search_in")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (draftIn) setPick("out");
                    }}
                    className={
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors duration-200 " +
                      (pick === "out" ? "bg-[#F5B942] text-[#1a1203]" : "text-white/55 hover:text-white/85")
                    }
                  >
                    {t("charter.search_out")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setLeft(shiftMonth(left, -1))} className="grid size-8 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/25 hover:text-white" aria-label={t("charter.stay_prev")}>
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" onClick={() => setLeft(shiftMonth(left, 1))} className="grid size-8 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/25 hover:text-white" aria-label={t("charter.stay_next")}>
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <p className="px-4 pt-3 text-[12px] text-white/50">
                {pick === "out" ? t("charter.stay_pick_out") : t("charter.stay_pick_in")}
                {draftNights > 0 && <span className="ml-2 text-[#00F0FF]/90">{t("charter.nights_count", { count: draftNights })}</span>}
              </p>

              <div className="grid max-h-[min(58dvh,30rem)] gap-5 overflow-y-auto p-4 sm:grid-cols-2 sm:max-h-none">
                <MonthGrid title={monthLabel(left, i18n.language)} weekdays={weekdays} cells={cellsForMonth(left)} checkIn={draftIn} checkOut={draftOut} hover={hover} openSet={openSet} onHover={setHover} onChoose={choose} />
                <MonthGrid title={monthLabel(right, i18n.language)} weekdays={weekdays} cells={cellsForMonth(right)} checkIn={draftIn} checkOut={draftOut} hover={hover} openSet={openSet} onHover={setHover} onChoose={choose} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                <p className="font-mono text-[11px] tracking-wide text-white/45">
                  {t("charter.embark")} {embark} · {t("charter.disembark")} {disembark}
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={clear} className="h-9 rounded-full px-3 text-[12px] font-semibold text-white/60 hover:text-white">
                    {t("charter.stay_clear")}
                  </button>
                  <button type="button" disabled={!canSave} onClick={save} className="h-9 rounded-full bg-[#F5B942] px-4 text-[12px] font-semibold text-[#1a1203] disabled:opacity-35">
                    {t("charter.stay_save")}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="group flex h-12 w-full items-center gap-3 rounded-2xl border border-white/15 bg-[#06101c]/85 px-3 text-left transition-[border-color,box-shadow,background-color] duration-250 hover:border-[#F5B942]/40 focus:border-[#F5B942]/65 focus:outline-none focus:shadow-[0_0_0_3px_rgba(245,185,66,0.12)]"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-[#F5B942]/12 text-[#F5B942] transition-colors duration-250 group-hover:bg-[#F5B942]/18">
          <CalendarRange className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.stay_label")}</span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-white">
            <span className={checkIn ? "text-white" : "text-white/35"}>{checkIn ? dayLabel(checkIn, i18n.language) : t("charter.search_in")}</span>
            <span aria-hidden className="text-white/20">→</span>
            <span className={checkOut ? "text-white" : "text-white/35"}>{checkOut ? dayLabel(checkOut, i18n.language) : t("charter.search_out")}</span>
            {committedNights > 0 && <span className="text-[12px] text-[#00F0FF]/90">{t("charter.nights_count", { count: committedNights })}</span>}
          </span>
        </span>
      </button>
      {panel}
    </div>
  );
}

function MonthGrid({
  title,
  weekdays,
  cells,
  checkIn,
  checkOut,
  hover,
  openSet,
  onHover,
  onChoose,
}: {
  title: string;
  weekdays: string[];
  cells: Array<{ iso: string; inMonth: boolean }>;
  checkIn: string;
  checkOut: string;
  hover: string;
  openSet: Set<string> | null;
  onHover: (iso: string) => void;
  onChoose: (iso: string) => void;
}) {
  const today = toIsoDate(new Date());
  return (
    <div>
      <p className="mb-3 text-center text-[13px] font-semibold capitalize tracking-wide text-white/85">{title}</p>
      <div className="mb-1.5 grid grid-cols-7">
        {weekdays.map((day, index) => (
          <span key={`${day}-${index}`} className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => onHover("")}>
        {cells.map((cell) => {
          const kind = tone(cell.iso, checkIn, checkOut, hover, openSet);
          const past = cell.iso < today;
          const disabled = past || kind === "closed" || !cell.inMonth;
          const inRange = kind === "mid" || kind === "preview" || kind === "edge-in" || kind === "edge-out";
          const rangeStart = kind === "edge-in" || (kind === "preview" && hover && hover < checkIn && cell.iso === hover);
          const rangeEnd = kind === "edge-out" || (kind === "preview" && hover && hover > checkIn && cell.iso === hover);
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onMouseEnter={() => {
                if (!disabled) onHover(cell.iso);
              }}
              onClick={() => onChoose(cell.iso)}
              className={
                "relative h-10 text-[13px] font-medium transition-[color,background-color] duration-150 ease-out " +
                (!cell.inMonth ? "text-white/12 " : "") +
                (disabled && cell.inMonth ? "cursor-not-allowed text-white/18 " : "") +
                (!disabled && kind === "idle" ? "text-white/85 hover:text-[#F5B942] " : "")
              }
            >
              {inRange && cell.inMonth && (
                <span
                  className={
                    "absolute inset-y-1 left-0 right-0 " +
                    (kind === "preview" ? "bg-[#00F0FF]/10 " : "bg-[#F5B942]/18 ") +
                    (rangeStart ? "left-1 rounded-l-full " : "") +
                    (rangeEnd ? "right-1 rounded-r-full " : "")
                  }
                />
              )}
              <span
                className={
                  "relative z-[1] mx-auto grid size-9 place-items-center rounded-full transition-colors duration-150 " +
                  (kind === "edge-in" || kind === "edge-out"
                    ? "bg-[#F5B942] text-[#1a1203]"
                    : kind === "mid"
                      ? "text-[#F5B942]"
                      : kind === "preview"
                        ? "text-[#00F0FF]"
                        : "")
                }
              >
                {Number(cell.iso.slice(8))}
              </span>
              {cell.iso === today && cell.inMonth && kind !== "edge-in" && kind !== "edge-out" && (
                <span className="absolute inset-x-[38%] bottom-1 z-[1] h-0.5 rounded-full bg-[#00F0FF]/75" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function defaultStaySuggestion(openDays: string[]): { checkIn: string; checkOut: string } {
  const first = openDays[0];
  if (!first) return { checkIn: "", checkOut: "" };
  return { checkIn: first, checkOut: addIsoDays(first, 4) };
}
