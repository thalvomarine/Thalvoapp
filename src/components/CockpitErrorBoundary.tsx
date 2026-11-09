import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  forceAppReload,
  isStaleChunkError,
  reloadForStaleChunk,
} from "@/lib/stale-chunk";

/**
 * Isolates chart / Leaflet failures from the mission dock so SOS stays
 * clickable even when the map tree throws after mount.
 */
export class CockpitErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; message: string; staleChunk: boolean }
> {
  state = { hasError: false, message: "", staleChunk: false };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error?.message ?? String(error),
      staleChunk: isStaleChunkError(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CRASH REASON]:", error, info);
    console.error("[CRASH REASON] componentStack:", info.componentStack);
    if (reloadForStaleChunk(error)) return;
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ChartCrashFallback
          detail={this.state.message}
          staleChunk={this.state.staleChunk}
          onRetry={() => {
            if (this.state.staleChunk) {
              forceAppReload();
              return;
            }
            this.setState({ hasError: false, message: "", staleChunk: false });
          }}
        />
      );
    }
    return this.props.children;
  }
}

function ChartCrashFallback({
  detail,
  staleChunk,
  onRetry,
}: {
  detail: string;
  staleChunk: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-3 bg-[#0A192F] px-4 text-center">
      <p className="max-w-md text-sm text-slate-300">{t("chart.crash_title")}</p>
      {detail ? (
        <p className="max-w-lg break-words font-mono text-[11px] text-rose-300/80" aria-hidden>
          {detail}
        </p>
      ) : null}
      <button
        type="button"
        className="rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100"
        onClick={onRetry}
      >
        {staleChunk ? t("chart.crash_reload") : t("chart.crash_retry")}
      </button>
    </div>
  );
}
