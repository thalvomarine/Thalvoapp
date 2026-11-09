import { createFileRoute, redirect } from "@tanstack/react-router";
import { AegeanProtoApp } from "@/components/aegean-proto/AegeanProtoApp";

const TITLE = "THALVO · Aegean prototype (local)";
const DESCRIPTION =
  "Local-only B · AEGEAN daylight MarineOS prototype. Does not replace the live brand landing.";

/**
 * DEV-only Aegean design prototype.
 * Production builds redirect to `/` so thalvo.org stays untouched.
 */
export const Route = createFileRoute("/proto/aegean")({
  ssr: false,
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AegeanProtoPage,
});

function AegeanProtoPage() {
  return <AegeanProtoApp />;
}
