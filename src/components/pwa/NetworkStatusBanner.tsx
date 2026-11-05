import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/lib/pwa";

/**
 * Slim top-of-screen banner that surfaces offline / reconnected state.
 * Sits above every route. Auto-hides ~2.5s after reconnect. SSR-safe.
 */
export function NetworkStatusBanner() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const [everOffline, setEverOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!online) {
      setEverOffline(true);
      setShowReconnected(false);
      return;
    }
    if (everOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [online, everOffline]);

  if (online && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[90] flex justify-center"
      style={{ top: "max(env(safe-area-inset-top), 0px)" }}
    >
      <div
        className={
          "pointer-events-auto mx-3 mt-2 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-lg backdrop-blur-md " +
          (online
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
            : "border-amber-400/40 bg-amber-500/15 text-amber-100")
        }
      >
        {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
        {online ? t("pwa.banner_online") : t("pwa.banner_offline")}
      </div>
    </div>
  );
}
