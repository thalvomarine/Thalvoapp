import { useEffect, useState } from "react";
import { isNativeWebView } from "@/lib/native-history";

/**
 * PWA install-prompt architecture.
 *
 * Captures the browser's `beforeinstallprompt` event (Chromium-family) and
 * exposes a `promptInstall()` handler. Also detects iOS Safari — where the
 * event is unavailable — so the UI can render manual instructions instead.
 *
 * Capacitor shells already are the installed app — treat them as installed
 * and never show Add-to-Home-Screen hints inside the native WebView.
 *
 * Push: foreground Web Notification + Capacitor-ready opt-in live in
 * `useNotificationPermission` / `subscribeWebPush`. Background FCM/APNs
 * stays out of the repo until a VAPID key is provisioned (no secrets here).
 */

import { requestOpsNotificationPermission } from "@/lib/ops-alerts";

// Minimal typing — the event is not in the standard lib.d.ts everywhere.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const isBrowser = typeof window !== "undefined";

export function isStandaloneDisplay(): boolean {
  if (!isBrowser) return false;
  const mm = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mm || iosStandalone);
}

export function isIos(): boolean {
  if (!isBrowser) return false;
  const ua = window.navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(
    () => isNativeWebView() || isStandaloneDisplay(),
  );
  const [iosHint, setIosHint] = useState<boolean>(false);

  useEffect(() => {
    if (!isBrowser) return;
    if (isNativeWebView()) {
      setInstalled(true);
      setIosHint(false);
      setDeferred(null);
      return;
    }
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    setInstalled(isStandaloneDisplay());
    setIosHint(isIos() && !isStandaloneDisplay());
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferred) return "unavailable";
    try {
      await deferred.prompt();
      const res = await deferred.userChoice;
      setDeferred(null);
      return res.outcome;
    } catch {
      return "unavailable";
    }
  };

  return {
    canPrompt: !!deferred,
    installed,
    iosHint,
    promptInstall,
  };
}

/**
 * Reactive online/offline status. SSR-safe: defaults to online during render.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (!isBrowser) return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(window.navigator.onLine);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

export type NotificationPermissionState = NotificationPermission | "unsupported";

/** Opt-in companion for SOS / job alerts (Web Notification API). */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (!isBrowser || typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  });

  useEffect(() => {
    if (!isBrowser || typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const request = async (): Promise<NotificationPermissionState> => {
    if (!isBrowser || typeof Notification === "undefined") {
      setPermission("unsupported");
      return "unsupported";
    }
    await requestOpsNotificationPermission();
    const next = Notification.permission;
    setPermission(next);
    return next;
  };

  return { permission, request, granted: permission === "granted" };
}

/**
 * Optional Web Push subscribe. No-ops unless `VITE_VAPID_PUBLIC_KEY` is set.
 * Never embeds private keys; returns null when unsupported or unconfigured.
 */
export async function subscribeWebPush(): Promise<PushSubscriptionJSON | null> {
  if (!isBrowser || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const vapid = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY?.trim();
  if (!vapid) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing.toJSON();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
    return sub.toJSON();
  } catch (err) {
    console.warn("[pwa] push subscribe failed", err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}
