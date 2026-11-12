import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public ops contact (mailto / partner + boatshow copy).
 * Not an authorization capability — admin access is `user_roles.admin`.
 */
export const OPS_CONTACT_EMAIL = "support@thalvo.org";

export async function userHasAdminRole(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

/**
 * Control Tower (`/app/admin`) — requires `user_roles.admin`.
 * Client-side email bootstrap via `ensure_superadmin` was removed.
 */
export async function ensureAdminAccess(user: Pick<User, "id" | "email">): Promise<boolean> {
  return userHasAdminRole(user.id);
}

/**
 * Platform operator desk (`/admin`) — server RPC only.
 * Never compare a personal email in the public client bundle.
 */
export async function isPlatformOperator(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_operator");
  if (error) {
    console.warn("[superadmin] is_platform_operator", error.message);
    return false;
  }
  return data === true;
}

/**
 * `/admin` stays locked to the platform operator identity AND an admin role row.
 * Operator identity is resolved in Postgres (`is_platform_operator`), not via VITE_*.
 */
export async function ensureSuperadminRouteAccess(
  user: Pick<User, "id" | "email">,
): Promise<boolean> {
  if (!(await userHasAdminRole(user.id))) return false;
  return isPlatformOperator();
}
