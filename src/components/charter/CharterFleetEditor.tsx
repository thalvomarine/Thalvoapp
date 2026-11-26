import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyAmount, StatusBadge } from "@/components/core";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { type CharterHull, type CharterKind } from "@/lib/charter-desk";
import { createYacht, markInquiryQuoted, setWeekStatus, setYachtListed, setYachtPhotos } from "@/lib/charter-fleet-api";
import {
  upcomingSaturdays,
  yachtInputError,
  type FleetYachtInput,
  type StoredInquiry,
  type StoredYacht,
} from "@/lib/charter-fleet";

const EMPTY: FleetYachtInput = {
  name: "",
  model: "",
  year: new Date().getFullYear(),
  loaM: 12,
  berths: 6,
  cabins: 3,
  base: "",
  hull: "sail",
  kind: "bareboat",
  weeklyEur: 4000,
  skipper: "",
  listed: true,
};

export function CharterFleetEditor({
  ownerId,
  operatorName,
  yachts,
  inquiries,
  onChanged,
}: {
  ownerId: string;
  operatorName: string;
  yachts: StoredYacht[];
  inquiries: StoredInquiry[];
  onChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<FleetYachtInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const saturdays = upcomingSaturdays(undefined, 8);

  const save = async () => {
    const error = yachtInputError(form);
    if (error || operatorName.trim().length < 2) {
      toast.error(t("charter.fleet_invalid"));
      return;
    }
    setBusy(true);
    try {
      await createYacht(ownerId, operatorName, form);
      setForm(EMPTY);
      toast.success(t("charter.fleet_saved"));
      onChanged();
    } catch {
      toast.error(t("charter.fleet_failed"));
    } finally {
      setBusy(false);
    }
  };

  const toggleWeek = async (yacht: StoredYacht, startIso: string) => {
    const current = yacht.weeks.find((week) => week.startIso === startIso)?.status ?? "blocked";
    try {
      await setWeekStatus(yacht.id, startIso, current === "open" ? "blocked" : "open");
      onChanged();
    } catch {
      toast.error(t("charter.fleet_failed"));
    }
  };

  const addPhoto = async (yacht: StoredYacht, url: string) => {
    if (!url || yacht.photos.includes(url) || yacht.photos.length >= 8) return;
    try {
      await setYachtPhotos(yacht.id, [...yacht.photos, url]);
      onChanged();
    } catch {
      toast.error(t("charter.fleet_failed"));
    }
  };

  return (
    <div className="space-y-4">
      <GlassPanel>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{t("charter.fleet_eyebrow")}</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{t("charter.fleet_title")}</h2>
        <p className="mt-1 text-[12px] text-white/55">{t("charter.fleet_body")}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <TextField label={t("charter.field_boat")} value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <TextField label={t("charter.field_model")} value={form.model} onChange={(model) => setForm({ ...form, model })} />
          <TextField label={t("charter.field_year")} value={String(form.year)} onChange={(year) => setForm({ ...form, year: Number(year) })} />
          <TextField label={t("charter.loa")} value={String(form.loaM)} onChange={(loaM) => setForm({ ...form, loaM: Number(loaM) })} />
          <TextField label={t("charter.berths")} value={String(form.berths)} onChange={(berths) => setForm({ ...form, berths: Number(berths) })} />
          <TextField label={t("charter.cabins")} value={String(form.cabins)} onChange={(cabins) => setForm({ ...form, cabins: Number(cabins) })} />
          <TextField label={t("charter.from_week")} value={String(form.weeklyEur)} onChange={(weeklyEur) => setForm({ ...form, weeklyEur: Number(weeklyEur) })} />
          <TextField label={t("charter.skipper")} value={form.skipper} onChange={(skipper) => setForm({ ...form, skipper })} />
          <TextField label={t("charter.field_base")} value={form.base} onChange={(base) => setForm({ ...form, base })} />
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("charter.field_hull")}</span>
            <select value={form.hull} onChange={(event) => setForm({ ...form, hull: event.target.value as CharterHull })} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#071422] px-3 text-sm text-white">
              {(["sail", "catamaran", "motor", "gulet"] as const).map((hull) => <option key={hull} value={hull}>{t(`charter.hull_${hull}`)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("charter.field_kind")}</span>
            <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as CharterKind })} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#071422] px-3 text-sm text-white">
              {(["bareboat", "crewed", "cabin"] as const).map((kind) => <option key={kind} value={kind}>{t(`charter.kind_${kind}`)}</option>)}
            </select>
          </label>
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className="mt-4 h-10 rounded-full bg-[#F5B942] px-5 text-sm font-semibold text-[#1a1203] disabled:opacity-40">
          {t("charter.fleet_add")}
        </button>
      </GlassPanel>

      {yachts.map((yacht) => (
        <GlassPanel key={yacht.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{yacht.name}</p>
              <p className="text-[12px] text-white/55">{yacht.base} · {yacht.model}</p>
              <p className="mt-1 text-[12px] text-white/70"><MoneyAmount value={yacht.weeklyEur} currency="EUR" tone="gold" /> <span className="text-white/40">/ {t("charter.per_week")} · {t("charter.simulated")}</span></p>
            </div>
            <button type="button" onClick={() => void setYachtListed(yacht.id, !yacht.listed).then(onChanged)} className="text-[11px]">
              <StatusBadge tone={yacht.listed ? "success" : "neutral"}>{yacht.listed ? t("charter.listed") : t("charter.hidden")}</StatusBadge>
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {yacht.photos.map((url) => (
              <img key={url} src={url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
            ))}
          </div>
          {yacht.photos.length < 8 && (
            <div className="mt-3 max-w-xs">
              <ImageUploader value="" onChange={(url) => void addPhoto(yacht, url)} userId={ownerId} compact />
            </div>
          )}
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.open_days")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {saturdays.map((iso) => {
              const open = yacht.weeks.some((week) => week.startIso === iso && week.status === "open");
              return (
                <button key={iso} type="button" onClick={() => void toggleWeek(yacht, iso)} className={"rounded-full border px-2.5 py-1 text-[11px] " + (open ? "border-emerald-300/40 text-emerald-100" : "border-white/10 text-white/40")}>
                  {formatDay(iso, i18n.language)}
                </button>
              );
            })}
          </div>
        </GlassPanel>
      ))}

      {inquiries.length > 0 && (
        <GlassPanel>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.live_inquiries")}</p>
          <ul className="mt-3 space-y-3">
            {inquiries.map((row) => {
              const yacht = yachts.find((item) => item.id === row.yachtId);
              return (
                <li key={row.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.guestName}</p>
                      <p className="text-[12px] text-white/55">{yacht?.name} · {formatDay(row.startIso, i18n.language)} · {row.party}</p>
                      <p className="text-[12px] text-white/70">{row.contact}</p>
                    </div>
                    <StatusBadge tone={row.status === "new" ? "info" : "warning"}>{t(`charter.inquiry_${row.status}`)}</StatusBadge>
                  </div>
                  {row.status === "new" && (
                    <button type="button" onClick={() => void markInquiryQuoted(row.id).then(onChanged)} className="mt-2 text-[11px] font-semibold text-[#F5B942]">
                      {t("charter.quote_action")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#F5B942]/50" />
    </label>
  );
}

function formatDay(iso: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(y!, m! - 1, d!));
}
