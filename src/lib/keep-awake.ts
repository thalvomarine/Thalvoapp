/**
 * Screen wake lock for active passage / full-bleed chartplotter.
 * Native: @capacitor-community/keep-awake
 * Web: navigator.wakeLock (when available)
 *
 * Re-acquires after the document becomes visible again (screen unlock /
 * app resume) while passage mode is still armed.
 */

let webWakeLock: WakeLockSentinel | null = null;
let armed = false;
let visibilityWired = false;

async function requestWake(): Promise<void> {
  if (typeof window === "undefined") return;

  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    await KeepAwake.keepAwake();
    console.log("[KeepAwake] Active (native)");
    return;
  }

  if (navigator.wakeLock?.request) {
    try {
      webWakeLock = await navigator.wakeLock.request("screen");
      webWakeLock.addEventListener("release", () => {
        webWakeLock = null;
      });
      console.log("[KeepAwake] Active (wakeLock)");
    } catch (err) {
      console.warn("[KeepAwake] wakeLock unavailable:", err);
    }
  }
}

function wireVisibility(): void {
  if (typeof document === "undefined" || visibilityWired) return;
  visibilityWired = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !armed) return;
    void requestWake().catch((err) => console.warn("[KeepAwake] re-acquire failed:", err));
  });
}

export async function activateKeepAwake(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    armed = true;
    wireVisibility();
    await requestWake();
  } catch (err) {
    console.warn("[KeepAwake] activate failed:", err);
  }
}

export async function releaseKeepAwake(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    armed = false;

    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { KeepAwake } = await import("@capacitor-community/keep-awake");
      await KeepAwake.allowSleep();
      console.log("[KeepAwake] Released (native)");
      return;
    }

    if (webWakeLock) {
      await webWakeLock.release();
      webWakeLock = null;
      console.log("[KeepAwake] Released (wakeLock)");
    }
  } catch (err) {
    console.warn("[KeepAwake] release failed:", err);
  }
}
