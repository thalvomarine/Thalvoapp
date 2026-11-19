/**
 * Local / PR review only — sample charter ops desk without auth.
 * Production surface is `/app/charter`.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { CharterDesk } from "@/components/charter/CharterDesk";

export const Route = createFileRoute("/charter-preview")({
  ssr: false,
  component: CharterPreviewPage,
});

function CharterPreviewPage() {
  return (
    <div className="thalvo-dark thalvo-cockpit min-h-dvh bg-[#0A192F] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Preview · /charter-preview
        </p>
        <Link
          to="/app/charter"
          className="text-[12px] font-semibold text-amber-200/90 underline-offset-2 hover:underline"
        >
          /app/charter
        </Link>
      </div>
      <div className="mx-auto max-w-6xl">
        <CharterDesk />
      </div>
    </div>
  );
}
