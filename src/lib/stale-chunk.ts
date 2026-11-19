/**
 * After a Vercel deploy, an open tab can keep an old entry bundle that
 * still points at hashed chunks that no longer exist. The SPA rewrite then
 * serves index.html for `/assets/*.js`, and the browser rejects it with a
 * MIME-type error for module scripts. Detect that class of failure and
 * force a one-shot hard reload so the captain lands on the fresh build.
 */

const RELOAD_FLAG = "thalvo:stale-chunk-reload";

const STALE_CHUNK_RE =
  /mime type|failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk \d+ failed|importing a module script failed|text\/html.*javascript|javascript.*text\/html/i;

export function isStaleChunkError(error: unknown): boolean {
  if (error == null) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return STALE_CHUNK_RE.test(msg);
}

/** Clear the one-shot guard after a successful boot so a later deploy can recover again. */
export function clearStaleChunkReloadFlag(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Hard-reload once per tab session when a stale deploy chunk is detected.
 * Returns true when a reload was started (caller should stop rendering).
 */
export function reloadForStaleChunk(error?: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (error !== undefined && !isStaleChunkError(error)) return false;

  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") return false;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    /* still attempt the reload below */
  }

  window.location.reload();
  return true;
}

/** User-initiated retry: always hard-reload, clearing the one-shot guard. */
export function forceAppReload(): void {
  if (typeof window === "undefined") return;
  clearStaleChunkReloadFlag();
  window.location.reload();
}
