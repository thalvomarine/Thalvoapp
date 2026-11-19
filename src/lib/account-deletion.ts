/** True when the typed confirmation is the signed-in account email. */
export function emailMatchesAccount(typed: string, email: string | null | undefined): boolean {
  const expected = email?.trim().toLowerCase() ?? "";
  if (!expected.includes("@")) return false;
  return typed.trim().toLowerCase() === expected;
}
