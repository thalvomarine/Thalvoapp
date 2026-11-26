import { supabase } from "@/integrations/supabase/client";
import type { CharterBase, CharterKind, InquiryStatus } from "@/lib/charter-desk";
import {
  upcomingSaturdays,
  type FleetYachtInput,
  type StoredInquiry,
  type StoredWeek,
  type StoredYacht,
} from "@/lib/charter-fleet";

interface YachtRow {
  id: string;
  owner_id: string;
  operator_name: string;
  name: string;
  model: string;
  year: number;
  loa_m: number;
  berths: number;
  cabins: number;
  base: string;
  kind: string;
  weekly_eur: number;
  skipper: string | null;
  listed: boolean;
  photos: string[] | null;
}

interface WeekRow {
  yacht_id: string;
  start_iso: string;
  status: string;
}

interface InquiryRow {
  id: string;
  yacht_id: string;
  guest_name: string;
  contact: string;
  party: number;
  start_iso: string;
  note: string | null;
  status: string;
}

function asYacht(row: YachtRow, weeks: StoredWeek[]): StoredYacht {
  return {
    id: row.id,
    ownerId: row.owner_id,
    operatorName: row.operator_name,
    name: row.name,
    model: row.model,
    year: row.year,
    loaM: Number(row.loa_m),
    berths: row.berths,
    cabins: row.cabins,
    base: row.base as CharterBase,
    kind: row.kind as CharterKind,
    weeklyEur: Number(row.weekly_eur),
    skipper: row.skipper,
    listed: row.listed,
    photos: (row.photos ?? []).filter((url) => typeof url === "string" && url.length > 0).slice(0, 8),
    weeks,
  };
}

async function weeksFor(ids: string[]): Promise<Map<string, StoredWeek[]>> {
  const grouped = new Map<string, StoredWeek[]>();
  if (ids.length === 0) return grouped;
  const { data, error } = await supabase
    .from("charter_weeks")
    .select("yacht_id,start_iso,status")
    .in("yacht_id", ids);
  if (error) throw error;
  for (const row of (data ?? []) as WeekRow[]) {
    const list = grouped.get(row.yacht_id) ?? [];
    if (row.status === "open" || row.status === "blocked") {
      list.push({ startIso: row.start_iso, status: row.status });
    }
    grouped.set(row.yacht_id, list);
  }
  return grouped;
}

async function loadYachts(filter: { listed?: boolean; ownerId?: string }): Promise<StoredYacht[]> {
  let query = supabase.from("charter_yachts").select("*").order("name");
  if (filter.listed) query = query.eq("listed", true);
  if (filter.ownerId) query = query.eq("owner_id", filter.ownerId);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as YachtRow[];
  const weeks = await weeksFor(rows.map((row) => row.id));
  return rows.map((row) => asYacht(row, weeks.get(row.id) ?? []));
}

export function loadListedYachts(): Promise<StoredYacht[]> {
  return loadYachts({ listed: true });
}

export function loadOwnerYachts(ownerId: string): Promise<StoredYacht[]> {
  return loadYachts({ ownerId });
}

export async function createYacht(ownerId: string, operatorName: string, input: FleetYachtInput): Promise<string> {
  const { data, error } = await supabase
    .from("charter_yachts")
    .insert({
      owner_id: ownerId,
      operator_name: operatorName.trim(),
      name: input.name.trim(),
      model: input.model.trim(),
      year: input.year,
      loa_m: input.loaM,
      berths: input.berths,
      cabins: input.cabins,
      base: input.base,
      kind: input.kind,
      weekly_eur: input.weeklyEur,
      skipper: input.skipper.trim() || null,
      listed: input.listed,
      photos: [],
    })
    .select("id")
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  const weeks = upcomingSaturdays().map((startIso) => ({
    yacht_id: id,
    start_iso: startIso,
    status: "open" as const,
  }));
  const saved = await supabase.from("charter_weeks").insert(weeks);
  if (saved.error) throw saved.error;
  return id;
}

export async function setYachtPhotos(id: string, photos: string[]): Promise<void> {
  const { error } = await supabase.from("charter_yachts").update({ photos: photos.slice(0, 8) }).eq("id", id);
  if (error) throw error;
}

export async function setYachtListed(id: string, listed: boolean): Promise<void> {
  const { error } = await supabase.from("charter_yachts").update({ listed }).eq("id", id);
  if (error) throw error;
}

export async function setWeekStatus(yachtId: string, startIso: string, status: "open" | "blocked"): Promise<void> {
  const { error } = await supabase.from("charter_weeks").upsert(
    { yacht_id: yachtId, start_iso: startIso, status },
    { onConflict: "yacht_id,start_iso" },
  );
  if (error) throw error;
}

export async function sendInquiry(yachtId: string, input: { guestName: string; contact: string; party: number; startIso: string; note: string }): Promise<void> {
  const { error } = await supabase.from("charter_inquiries").insert({
    yacht_id: yachtId,
    guest_name: input.guestName.trim(),
    contact: input.contact.trim(),
    party: input.party,
    start_iso: input.startIso,
    note: input.note.trim() || null,
    status: "new",
  });
  if (error) throw error;
}

export async function loadOwnerInquiries(yachtIds: string[]): Promise<StoredInquiry[]> {
  if (yachtIds.length === 0) return [];
  const { data, error } = await supabase
    .from("charter_inquiries")
    .select("id,yacht_id,guest_name,contact,party,start_iso,note,status")
    .in("yacht_id", yachtIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as InquiryRow[]).map((row) => ({
    id: row.id,
    yachtId: row.yacht_id,
    guestName: row.guest_name,
    contact: row.contact,
    party: row.party,
    startIso: row.start_iso,
    note: row.note,
    status: row.status as InquiryStatus,
  }));
}

export async function markInquiryQuoted(id: string): Promise<void> {
  const { error } = await supabase.from("charter_inquiries").update({ status: "quoted" }).eq("id", id);
  if (error) throw error;
}
