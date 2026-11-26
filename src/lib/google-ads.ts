/**
 * Optional Google Ads (gtag) measurement for thalvo.org and the Capacitor webview.
 *
 * Disabled unless `VITE_GOOGLE_ADS_ID` is set (e.g. AW-XXXXXXXXX or GT-XXXXXXX).
 * Conversion labels come from Google Ads → Goals → Conversions → Tag setup.
 * Never hardcode live account IDs in source — use deploy env only.
 */

export type GoogleAdsConversion =
  "sign_up" | "email_confirmed" | "boatshow_lead" | "begin_checkout";

type GtagCommand = "js" | "config" | "event" | "consent" | "set";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

const SCRIPT_ID = "thalvo-google-ads";

function stripEnv(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Static `import.meta.env.VITE_*` property reads only — never index the whole
 * env object. Dynamic `env[key]` forces Vite to embed every VITE_* build var
 * (incl. Vercel git meta). Optional chaining keeps Node unit tests happy.
 */
function viteAdsId(): string {
  try {
    return stripEnv(import.meta.env?.VITE_GOOGLE_ADS_ID);
  } catch {
    return "";
  }
}

function viteAdsLabel(
  key:
    | "VITE_GOOGLE_ADS_SIGNUP_LABEL"
    | "VITE_GOOGLE_ADS_CONFIRM_LABEL"
    | "VITE_GOOGLE_ADS_BOATSHOW_LABEL"
    | "VITE_GOOGLE_ADS_CHECKOUT_LABEL",
): string {
  try {
    switch (key) {
      case "VITE_GOOGLE_ADS_SIGNUP_LABEL":
        return stripEnv(import.meta.env?.VITE_GOOGLE_ADS_SIGNUP_LABEL);
      case "VITE_GOOGLE_ADS_CONFIRM_LABEL":
        return stripEnv(import.meta.env?.VITE_GOOGLE_ADS_CONFIRM_LABEL);
      case "VITE_GOOGLE_ADS_BOATSHOW_LABEL":
        return stripEnv(import.meta.env?.VITE_GOOGLE_ADS_BOATSHOW_LABEL);
      case "VITE_GOOGLE_ADS_CHECKOUT_LABEL":
        return stripEnv(import.meta.env?.VITE_GOOGLE_ADS_CHECKOUT_LABEL);
    }
  } catch {
    return "";
  }
}

/** Public Google tag id (AW-… / GT-… / G-…). Empty = measurement off. */
export function googleAdsId(): string {
  return viteAdsId();
}

/** Map product events → Google Ads conversion labels (not full send_to). */
export function googleAdsConversionLabels(): Partial<Record<GoogleAdsConversion, string>> {
  return {
    sign_up: viteAdsLabel("VITE_GOOGLE_ADS_SIGNUP_LABEL") || undefined,
    email_confirmed: viteAdsLabel("VITE_GOOGLE_ADS_CONFIRM_LABEL") || undefined,
    boatshow_lead: viteAdsLabel("VITE_GOOGLE_ADS_BOATSHOW_LABEL") || undefined,
    begin_checkout: viteAdsLabel("VITE_GOOGLE_ADS_CHECKOUT_LABEL") || undefined,
  };
}

export function isGoogleAdsEnabled(): boolean {
  return googleAdsId().length > 0;
}

function ensureGtagStub(): GtagFn {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
  return window.gtag;
}

function sendTo(label: string): string {
  return `${googleAdsId()}/${label}`;
}

/**
 * Load gtag.js once and `config` the Ads / Google tag.
 * Safe to call from root mount; no-ops when the env id is unset.
 */
export function initGoogleAds(): void {
  if (typeof document === "undefined" || !isGoogleAdsEnabled()) return;

  const id = googleAdsId();
  const gtag = ensureGtagStub();

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  gtag("js", new Date());
  gtag("config", id, {
    send_page_view: true,
    // App WebViews and the marketing site share one tag; native deep links
    // still land on https://thalvo.org for email confirm / store listings.
    linker: { domains: ["thalvo.org", "www.thalvo.org"] },
  });
}

/** SPA navigations — keeps remarketing audiences aligned with the route. */
export function trackGoogleAdsPageView(path: string): void {
  if (!isGoogleAdsEnabled() || typeof window === "undefined") return;
  const gtag = ensureGtagStub();
  const pagePath = path.startsWith("/") ? path : `/${path}`;
  gtag("event", "page_view", {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}${window.location.search}`,
    send_to: googleAdsId(),
  });
}

export type ConversionOptions = {
  /** Dedupes refreshes / double submits — prefer a stable user or lead id. */
  transactionId?: string;
  value?: number;
  currency?: string;
};

/**
 * Fire a Google Ads conversion when the matching label env is set.
 * Always returns whether a conversion event was queued (for tests / callers).
 */
export function trackGoogleAdsConversion(
  name: GoogleAdsConversion,
  options: ConversionOptions = {},
): boolean {
  if (!isGoogleAdsEnabled()) return false;
  const label = googleAdsConversionLabels()[name];
  if (!label) return false;

  const gtag = ensureGtagStub();
  const payload: Record<string, string | number> = {
    send_to: sendTo(label),
  };
  if (options.transactionId) payload.transaction_id = options.transactionId.slice(0, 64);
  if (typeof options.value === "number" && Number.isFinite(options.value)) {
    payload.value = options.value;
    payload.currency = options.currency || "TRY";
  }

  gtag("event", "conversion", payload);
  // Mirror as a named event for GA4 destinations linked to the same Google tag.
  gtag("event", name, {
    send_to: googleAdsId(),
    ...(options.transactionId ? { transaction_id: options.transactionId.slice(0, 64) } : {}),
  });
  return true;
}

/** Test helper — clears the injected script id check only; not for production. */
export function __googleAdsTestReset(): void {
  if (typeof document === "undefined") return;
  document.getElementById(SCRIPT_ID)?.remove();
}

export type { GtagCommand };
