import { supabase } from "@/integrations/supabase/client";

/** Name the captain actually registered — passport first, profile field second. */
export async function resolveCallerVessel(userId: string): Promise<string> {
  const [vesselsRes, profileRes] = await Promise.all([
    supabase
      .from("vessels")
      .select("name")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase.from("profiles").select("boat_name").eq("id", userId).maybeSingle(),
  ]);

  const passport = (vesselsRes.data?.[0]?.name ?? "").trim();
  const profileName = (profileRes.data?.boat_name ?? "").trim();
  const name = passport || profileName;

  if (passport && passport !== profileName) {
    await supabase.from("profiles").update({ boat_name: passport }).eq("id", userId);
  }

  return name.slice(0, 80);
}
