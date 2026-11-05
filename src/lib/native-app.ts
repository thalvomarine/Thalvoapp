/**
 * Capacitor App plugin helpers — hardware back, settings deep-link.
 * No-ops in the browser/PWA build.
 */

import { isNativeWebView } from "@/lib/native-history";

export type NativeBackHandler = () => boolean | void;

const backStack: NativeBackHandler[] = [];

/** Register a LIFO back handler (e.g. close sheet). Returns unregister. */
export function pushNativeBackHandler(handler: NativeBackHandler): () => void {
  backStack.push(handler);
  return () => {
    const i = backStack.lastIndexOf(handler);
    if (i >= 0) backStack.splice(i, 1);
  };
}

let backWired = false;

/** Wire Android hardware back once. Safe to call from MissionShell mount. */
export async function wireNativeBackButton(): Promise<void> {
  if (typeof window === "undefined" || backWired || !isNativeWebView()) return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android") return;
    const { App } = await import("@capacitor/app");
    backWired = true;
    await App.addListener("backButton", ({ canGoBack }) => {
      for (let i = backStack.length - 1; i >= 0; i -= 1) {
        try {
          if (backStack[i]()) return;
        } catch (err) {
          console.warn("[native] back handler failed", err);
        }
      }
      if (canGoBack) {
        window.history.back();
        return;
      }
      void App.minimizeApp();
    });
  } catch (err) {
    console.warn("[native] back button wire failed", err);
  }
}

const ANDROID_APP_ID = "com.thalvo.marineos";

/** Open the OS app-settings page so the captain can re-enable location/camera. */
export async function openNativeAppSettings(): Promise<boolean> {
  if (typeof window === "undefined" || !isNativeWebView()) return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    const { App } = await import("@capacitor/app");
    if (Capacitor.getPlatform() === "ios") {
      await App.openUrl({ url: "app-settings:" });
      return true;
    }
    if (Capacitor.getPlatform() === "android") {
      await App.openUrl({
        url:
          "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;" +
          `data=package:${ANDROID_APP_ID};end`,
      });
      return true;
    }
  } catch (err) {
    console.warn("[native] open settings failed", err);
  }
  return false;
}
