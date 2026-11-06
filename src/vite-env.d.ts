/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Classic Supabase anon JWT — accepted as a fallback for VITE_SUPABASE_PUBLISHABLE_KEY. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** Operator email for `/admin` lock — set in deploy env, not committed. */
  readonly VITE_SUPERADMIN_EMAIL?: string;
  /** Google Ads / Google tag id (AW-… or GT-…). Empty disables measurement. */
  readonly VITE_GOOGLE_ADS_ID?: string;
  /** Conversion labels from Google Ads → Goals (not full send_to paths). */
  readonly VITE_GOOGLE_ADS_SIGNUP_LABEL?: string;
  readonly VITE_GOOGLE_ADS_CONFIRM_LABEL?: string;
  readonly VITE_GOOGLE_ADS_BOATSHOW_LABEL?: string;
  /** Reserved for live payments — do not wire to simulated checkout. */
  readonly VITE_GOOGLE_ADS_CHECKOUT_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
