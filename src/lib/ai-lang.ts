/**
 * THALVO AI training and system prompts ship EN + TR.
 * Greek UI falls through to English (not Turkish) so EL crews
 * get international phrasing instead of a wrong language.
 */
export type AiLang = "en" | "tr";

export function resolveAiLang(language: string | undefined | null): AiLang {
  const base = (language ?? "en").toLowerCase().split("-")[0];
  if (base === "tr") return "tr";
  return "en";
}

/** Service package titles: EL uses English catalogue names. */
export function packageTitleLang(language: string | undefined | null): "en" | "tr" {
  const base = (language ?? "en").toLowerCase().split("-")[0];
  return base === "tr" ? "tr" : "en";
}
