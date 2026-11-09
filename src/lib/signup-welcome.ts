const FLAG = "thalvo:signup-welcome";
const UNCONFIRMED = "thalvo:email-unconfirmed";
const SHOW_CONFIRMED = "thalvo:show-confirmed";

/** Live site origin used for every auth email redirect (confirm / recover). */
export const PUBLIC_AUTH_ORIGIN = "https://thalvo.org";

/** Canonical post-confirm landing on the live site. */
export const PUBLIC_CONFIRM_REDIRECT = `${PUBLIC_AUTH_ORIGIN}/auth?confirmed=1`;

/** Password-recovery email lands on the reset form. */
export const PUBLIC_RECOVERY_REDIRECT = `${PUBLIC_AUTH_ORIGIN}/auth/reset`;

/** Mark a fresh signup so MissionShell can show a soft email-confirm banner. */
export function markSignupWelcome(): void {
  try {
    sessionStorage.setItem(FLAG, "1");
  } catch {
    /* private mode / SSR */
  }
}

export function markEmailUnconfirmed(): void {
  try {
    localStorage.setItem(UNCONFIRMED, "1");
  } catch {
    /* private mode */
  }
}

export function clearEmailUnconfirmed(): void {
  try {
    localStorage.removeItem(UNCONFIRMED);
  } catch {
    /* private mode */
  }
}

export function isEmailUnconfirmed(): boolean {
  try {
    return localStorage.getItem(UNCONFIRMED) === "1";
  } catch {
    return false;
  }
}

export function armEmailConfirmedNotice(): void {
  try {
    sessionStorage.setItem(SHOW_CONFIRMED, "1");
  } catch {
    /* private mode */
  }
}

export function consumeEmailConfirmedNotice(): boolean {
  try {
    if (sessionStorage.getItem(SHOW_CONFIRMED) !== "1") return false;
    sessionStorage.removeItem(SHOW_CONFIRMED);
    return true;
  } catch {
    return false;
  }
}

export function isEmailNotConfirmedMessage(message: string): boolean {
  return /email not confirmed/i.test(message);
}

/**
 * Redirect target embedded in Supabase confirmation emails.
 *
 * Always use the live thalvo.org URL. If Site URL in the Supabase dashboard
 * is still localhost, GoTrue falls back there whenever redirectTo is missing
 * or not on the allow list — so clients must never send a local origin here.
 */
export function confirmationRedirect(): string {
  return PUBLIC_CONFIRM_REDIRECT;
}

export function recoveryRedirect(): string {
  return PUBLIC_RECOVERY_REDIRECT;
}

export function urlLooksLikeEmailConfirm(): boolean {
  if (typeof window === "undefined") return false;
  const search = window.location.search;
  const hash = window.location.hash;
  return (
    search.includes("confirmed=1") ||
    /type=(signup|email|magiclink|invite|recovery)/.test(hash) ||
    /type=(signup|email|magiclink|invite|recovery)/.test(search)
  );
}

export function consumeSignupWelcome(): boolean {
  try {
    if (sessionStorage.getItem(FLAG) !== "1") return false;
    sessionStorage.removeItem(FLAG);
    return true;
  } catch {
    return false;
  }
}
