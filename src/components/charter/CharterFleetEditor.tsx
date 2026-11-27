import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Anchor, CalendarDays, Inbox, Radar, Ship, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyAmount, StatusBadge } from "@/components/core";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { type CharterHull } from "@/lib/charter-desk";
import { createYacht, markInquiryQuoted, setWeekStatus, setYachtListed, setYachtPhotos } from "@/lib/charter-fleet-api";
import {
  upcomingDays,
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
  kind: "crewed",
  weeklyEur: 4000,
  skipper: "",
  listed: true,
};

const HULLS: CharterHull[] = ["sail", "catamaran", "motor", "gulet"];
const PORT_HINTS = ["Göcek", "Marmaris", "Bodrum", "Fethiye", "İstanbul", "Split", "Atina", "Palma"];

type DeskTab = "publish" | "fleet" | "inbox";

function listingScore(input: FleetYachtInput): { score: number; checks: Array<{ id: string; ok: boolean }> } {
  const checks = [
    { id: "name", ok: input.name.trim().length >= 2 },
    { id: "model", ok: input.model.trim().length >= 2 },
    { id: "base", ok: input.base.trim().length >= 2 },
    { id: "hull", ok: Boolean(input.hull) },
    { id: "price", ok: input.weeklyEur > 0 },
    { id: "cabins", ok: input.cabins >= 1 && input.berths >= 1 },
    { id: "loa", ok: input.loaM > 0 },
  ];
  const score = Math.round((checks.filter((row) => row.ok).length / checks.length) * 100);
  return { score, checks };
}

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
  const [tab, setTab] = useState<DeskTab>(yachts.length === 0 ? "publish" : "fleet");
  const [form, setForm] = useState<FleetYachtInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const days = upcomingDays(undefined, 28);
  const { score, checks } = useMemo(() => listingScore(form), [form]);
  const listed = yachts.filter((yacht) => yacht.listed).length;
  const fresh = inquiries.filter((row) => row.status === "new").length;

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
      setTab("fleet");
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
      toast.success(t("charter.day_toggled"));
      onChanged();
    } catch {
      toast.error(t("charter.fleet_failed"));
    }
  };

  const addPhoto = async (yacht: StoredYacht, url: string) => {
    if (!url || yacht.photos.includes(url) || yacht.photos.length >= 8) return;
    try {
      await setYachtPhotos(yacht.id, [...yacht.photos, url]);
      toast.success(t("charter.photo_saved"));
      onChanged();
    } catch {
      toast.error(t("charter.fleet_failed"));
    }
  };

  return (
    <div className="space-y-4">
      <GlassPanel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8BA8A3]/80">{t("charter.fleet_eyebrow")}</p>
            <h2 className="thalvo-display mt-1 text-[1.7rem] tracking-wide text-white">{t("charter.fleet_title")}</h2>
            <p className="mt-1 max-w-xl text-[13px] text-white/60">{t("charter.fleet_body")}</p>
          </div>
          <p className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/55">{operatorName}</p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <StatCard icon={<Ship className="size-4 text-[#8BA8A3]" />} label={t("charter.stat_fleet")} value={String(yachts.length)} hint={t("charter.stat_listed", { count: listed })} />
          <StatCard icon={<Inbox className="size-4 text-[#C9B896]" />} label={t("charter.stat_inbox")} value={String(inquiries.length)} hint={t("charter.stat_new", { count: fresh })} />
          <StatCard icon={<CalendarDays className="size-4 text-emerald-300" />} label={t("charter.stat_days")} value={String(days.length)} hint={t("charter.stat_days_hint")} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["publish", t("charter.tab_publish"), Sparkles],
              ["fleet", t("charter.tab_my_fleet"), Ship],
              ["inbox", t("charter.tab_inbox"), Inbox],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[12px] font-semibold transition-colors " +
                (tab === id
                  ? "border-[#C9B896]/55 bg-[#C9B896]/15 text-[#C9B896]"
                  : "border-white/10 text-white/65 hover:border-white/25 hover:text-white")
              }
            >
              <Icon className="size-3.5" />
              {label}
              {id === "inbox" && fresh > 0 && (
                <span className="rounded-full bg-[#C9B896] px-1.5 text-[10px] text-[#0a192f]">{fresh}</span>
              )}
            </button>
          ))}
        </div>
      </GlassPanel>

      {tab === "publish" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <GlassPanel>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.publish_kicker")}</p>
            <h3 className="mt-1 text-base font-semibold text-white">{t("charter.publish_title")}</h3>
            <p className="mt-1 text-[12px] text-white/55">{t("charter.publish_body")}</p>

            <SectionTitle icon={<Ship className="size-3.5" />} title={t("charter.section_identity")} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <TextField label={t("charter.field_boat")} value={form.name} onChange={(name) => setForm({ ...form, name })} />
              <TextField label={t("charter.field_model")} value={form.model} onChange={(model) => setForm({ ...form, model })} />
              <TextField label={t("charter.field_year")} value={String(form.year)} onChange={(year) => setForm({ ...form, year: Number(year) })} suffix="" />
              <TextField label={t("charter.loa")} value={String(form.loaM)} onChange={(loaM) => setForm({ ...form, loaM: Number(loaM) })} suffix="m" />
            </div>

            <SectionTitle icon={<Anchor className="size-3.5" />} title={t("charter.section_capacity")} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <TextField label={t("charter.cabins")} value={String(form.cabins)} onChange={(cabins) => setForm({ ...form, cabins: Number(cabins) })} />
              <TextField label={t("charter.berths")} value={String(form.berths)} onChange={(berths) => setForm({ ...form, berths: Number(berths) })} />
              <TextField label={t("charter.from_week")} value={String(form.weeklyEur)} onChange={(weeklyEur) => setForm({ ...form, weeklyEur: Number(weeklyEur) })} suffix="EUR" />
              <TextField label={t("charter.skipper")} value={form.skipper} onChange={(skipper) => setForm({ ...form, skipper })} />
            </div>

            <SectionTitle icon={<Radar className="size-3.5" />} title={t("charter.section_port")} />
            <div className="mt-3 space-y-3">
              <TextField label={t("charter.field_base")} value={form.base} onChange={(base) => setForm({ ...form, base })} />
              <div className="flex flex-wrap gap-1.5">
                {PORT_HINTS.map((port) => (
                  <button
                    key={port}
                    type="button"
                    onClick={() => setForm({ ...form, base: port })}
                    className={
                      "rounded-full border px-2.5 py-1 text-[11px] " +
                      (form.base === port ? "border-[#8BA8A3]/50 text-[#8BA8A3]" : "border-white/10 text-white/55 hover:border-white/25")
                    }
                  >
                    {port}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("charter.field_hull")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HULLS.map((hull) => (
                    <button
                      key={hull}
                      type="button"
                      onClick={() => setForm({ ...form, hull })}
                      className={
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold " +
                        (form.hull === hull ? "border-[#C9B896]/55 bg-[#C9B896]/15 text-[#C9B896]" : "border-white/10 text-white/65")
                      }
                    >
                      {t(`charter.hull_${hull}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={busy || score < 100}
              onClick={() => void save()}
              className="mt-6 h-11 w-full rounded-full bg-[#C9B896] text-sm font-semibold text-[#0a192f] transition-opacity disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {t("charter.fleet_add")}
            </button>
            <p className="mt-2 text-[11px] text-white/40">{t("charter.publish_note")}</p>
          </GlassPanel>

          <aside className="h-fit space-y-3 lg:sticky lg:top-4">
            <GlassPanel>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.score_title")}</p>
              <p className="thalvo-display mt-2 text-[2.4rem] tracking-wide text-[#C9B896]">{score}</p>
              <p className="text-[12px] text-white/50">{t("charter.score_body")}</p>
              <ul className="mt-4 space-y-2">
                {checks.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className={row.ok ? "text-white/80" : "text-white/40"}>{t(`charter.score_${row.id}`)}</span>
                    <span className={row.ok ? "text-emerald-300" : "text-white/25"}>{row.ok ? "●" : "○"}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
            <GlassPanel>
              <p className="text-[12px] leading-relaxed text-white/60">{t("charter.score_help")}</p>
            </GlassPanel>
          </aside>
        </div>
      )}

      {tab === "fleet" && (
        <div className="space-y-4">
          {yachts.length === 0 ? (
            <EmptyState
              title={t("charter.empty_fleet_title")}
              body={t("charter.empty_fleet_owner")}
              action={t("charter.tab_publish")}
              onAction={() => setTab("publish")}
            />
          ) : (
            yachts.map((yacht) => {
              const openCount = yacht.weeks.filter((week) => week.status === "open").length;
              return (
                <GlassPanel key={yacht.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="thalvo-display text-[1.35rem] tracking-wide text-white">{yacht.name}</p>
                      <p className="text-[12px] text-white/55">
                        {yacht.base} · {yacht.model} · {t(`charter.hull_${yacht.hull}`)}
                      </p>
                      <p className="mt-1 text-[13px] text-white/75">
                        <MoneyAmount value={yacht.weeklyEur} currency="EUR" tone="gold" />
                        <span className="text-white/40"> / {t("charter.per_week")} · {t("charter.simulated")}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void setYachtListed(yacht.id, !yacht.listed)
                          .then(() => {
                            toast.success(yacht.listed ? t("charter.hidden") : t("charter.listed"));
                            onChanged();
                          })
                          .catch(() => toast.error(t("charter.fleet_failed")))
                      }
                    >
                      <StatusBadge tone={yacht.listed ? "success" : "neutral"}>{yacht.listed ? t("charter.listed") : t("charter.hidden")}</StatusBadge>
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {yacht.photos.map((url) => (
                      <img key={url} src={url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                    ))}
                    {yacht.photos.length === 0 && (
                      <div className="flex h-16 w-full items-center rounded-lg border border-dashed border-white/10 px-3 text-[12px] text-white/40">
                        {t("charter.photo_empty")}
                      </div>
                    )}
                  </div>
                  {yacht.photos.length < 8 && (
                    <div className="mt-3 max-w-xs">
                      <ImageUploader value="" onChange={(url) => void addPhoto(yacht, url)} userId={ownerId} compact />
                    </div>
                  )}

                  <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("charter.open_days")}</p>
                      <p className="text-[11px] text-emerald-200/90">{t("charter.open_count", { count: openCount })}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {days.map((iso) => {
                        const open = yacht.weeks.some((week) => week.startIso === iso && week.status === "open");
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => void toggleWeek(yacht, iso)}
                            className={
                              "min-w-[3.2rem] rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors " +
                              (open
                                ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                                : "border-white/10 bg-white/[0.02] text-white/35 line-through decoration-white/25")
                            }
                          >
                            {formatDay(iso, i18n.language)}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-white/40">{t("charter.owner_day_hint")}</p>
                  </div>
                </GlassPanel>
              );
            })
          )}
        </div>
      )}

      {tab === "inbox" && (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <EmptyState title={t("charter.empty_inbox_title")} body={t("charter.empty_inbox_body")} />
          ) : (
            <GlassPanel>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t("charter.live_inquiries")}</p>
              <ul className="mt-3 space-y-3">
                {inquiries.map((row) => {
                  const yacht = yachts.find((item) => item.id === row.yachtId);
                  return (
                    <li key={row.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{row.guestName}</p>
                          <p className="text-[12px] text-white/55">
                            {yacht?.name} · {formatDay(row.startIso, i18n.language)}
                            {row.endIso ? ` → ${formatDay(row.endIso, i18n.language)}` : ""} · {row.party} {t("charter.party")}
                          </p>
                          <p className="mt-1 text-[12px] text-white/70">{row.contact}</p>
                          {row.note && <p className="mt-1 text-[12px] text-white/50">{row.note}</p>}
                        </div>
                        <StatusBadge tone={row.status === "new" ? "info" : "warning"}>{t(`charter.inquiry_${row.status}`)}</StatusBadge>
                      </div>
                      {row.status === "new" && (
                        <button
                          type="button"
                          onClick={() =>
                            void markInquiryQuoted(row.id)
                              .then(() => {
                                toast.success(t("charter.quote_done"));
                                onChanged();
                              })
                              .catch(() => toast.error(t("charter.fleet_failed")))
                          }
                          className="mt-3 inline-flex h-9 items-center rounded-full border border-[#C9B896]/45 px-3 text-[11px] font-semibold text-[#C9B896]"
                        >
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
      )}
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
        {icon}
        {label}
      </div>
      <p className="thalvo-display mt-1 text-[1.7rem] tracking-wide text-white">{value}</p>
      <p className="text-[11px] text-white/45">{hint}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4">
      <span className="text-[#8BA8A3]/90">{icon}</span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{title}</p>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <GlassPanel>
      <div className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center">
        <div className="grid size-12 place-items-center rounded-2xl border border-[#8BA8A3]/30 bg-[#8BA8A3]/10 text-[#8BA8A3]">
          <Radar className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-[13px] text-white/55">{body}</p>
        </div>
        {action && onAction && (
          <button type="button" onClick={onAction} className="h-10 rounded-full bg-[#C9B896] px-4 text-[12px] font-semibold text-[#0a192f]">
            {action}
          </button>
        )}
      </div>
    </GlassPanel>
  );
}

function TextField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</span>
      <span className="relative mt-1 block">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#C9B896]/50"
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[11px] text-white/35">{suffix}</span> : null}
      </span>
    </label>
  );
}

function formatDay(iso: string, locale: string): string {
  const tag = locale.startsWith("tr") ? "tr-TR" : locale.startsWith("el") ? "el-GR" : "en-GB";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(y!, m! - 1, d!));
}
