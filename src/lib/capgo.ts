/**
 * Capgo CapacitorUpdater — safe diagnostics + notify handshake only.
 *
 * `autoUpdate` stays false in capacitor.config until a verified production
 * bundle is uploaded. Never call download/set/next from the client without
 * an explicit product decision.
 */

let notified = false;

export async function notifyCapgoAppReady(): Promise<void> {
  if (typeof window === "undefined" || notified) return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    await CapacitorUpdater.notifyAppReady();
    notified = true;
  } catch (err) {
    console.warn("[capgo] notifyAppReady failed", err);
  }
}

/** Support / diagnostics — current native bundle id when Capgo is present. */
export async function readCapgoBundleId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const current = await CapacitorUpdater.current();
    return current?.bundle?.id ?? null;
  } catch {
    return null;
  }
}

export function assertCapgoAutoUpdateOff(config: { plugins?: { CapacitorUpdater?: { autoUpdate?: boolean } } }): boolean {
  return config.plugins?.CapacitorUpdater?.autoUpdate === false;
}
