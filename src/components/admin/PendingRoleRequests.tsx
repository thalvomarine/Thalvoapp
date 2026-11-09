import { useTranslation } from "react-i18next";
import { GlassPanel } from "@/components/mission/GlassPanel";
import { StatusChip } from "@/components/mission/StatusChip";
import { EmptyState } from "@/components/core/EmptyState";
import { UserCheck } from "lucide-react";

export interface DealerApplicationSummary {
  legal_name: string;
  store_name: string;
  entity_type: string;
  tax_id: string;
  tax_office: string;
  mersis_number: string | null;
  kep_address: string;
  iban: string;
  iban_account_name: string;
  home_marina: string;
  product_focus: string;
  delivery_mode: string;
  status: string;
  tax_plate_path: string | null;
  signature_doc_path: string | null;
  trade_registry_path: string | null;
  activity_certificate_path: string | null;
  submitted_at: string | null;
}

export interface RoleRequestRow {
  id: string;
  full_name: string | null;
  boat_name: string | null;
  business_name: string | null;
  home_marina: string | null;
  requested_role: string;
  created_at: string;
  dealer_application?: DealerApplicationSummary | null;
}

interface Props {
  requests: RoleRequestRow[];
  /** id of the row currently being written, so its controls are disabled. */
  busyId: string | null;
  onApprove: (row: RoleRequestRow) => void;
  onReject: (row: RoleRequestRow) => void;
}

function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, "");
  if (clean.length < 10) return clean;
  return `${clean.slice(0, 4)} ··· ${clean.slice(-4)}`;
}

/** PendingRoleRequests — operators approve or clear pending role upgrades. */
export function PendingRoleRequests({ requests, busyId, onApprove, onReject }: Props) {
  const { t, i18n } = useTranslation();
  const fmt = new Intl.DateTimeFormat(i18n.language === "tr" ? "tr-TR" : "en-IE", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <GlassPanel padded={false}>
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 flex items-center gap-1.5">
            <UserCheck className="size-3.5" /> {t("admin.requests.title")}
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {t("admin.requests.count", { count: requests.length })}
          </p>
        </div>
        {requests.length > 0 && <StatusChip tone="warning">{requests.length}</StatusChip>}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="size-4" />}
          title={t("admin.requests.empty_title")}
          body={t("admin.requests.empty_body")}
        />
      ) : (
        <ul className="divide-y divide-white/[0.05] max-h-[480px] overflow-y-auto">
          {requests.map((r) => {
            const busy = busyId === r.id;
            const dealer = r.requested_role === "Supplier" ? r.dealer_application : null;
            return (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white truncate">
                      {dealer?.legal_name ??
                        r.business_name ??
                        r.full_name ??
                        t("admin.requests.unnamed")}
                    </p>
                    <p className="text-[10px] text-white/60 truncate">
                      {dealer
                        ? `${dealer.store_name} · ${dealer.home_marina}`
                        : `${r.boat_name ?? r.home_marina ?? t("admin.requests.no_boat")} · ${fmt.format(new Date(r.created_at))}`}
                    </p>
                  </div>
                  <StatusChip tone="info">{r.requested_role}</StatusChip>
                </div>

                {dealer && (
                  <dl className="mt-2.5 space-y-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-[10px] leading-snug text-white/65">
                    <div className="flex justify-between gap-2">
                      <dt>{t("admin.requests.dealer_entity")}</dt>
                      <dd className="text-white/85">
                        {t(`auth.dealer.entity_${dealer.entity_type}`, dealer.entity_type)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("admin.requests.dealer_tax")}</dt>
                      <dd className="font-mono text-white/85">
                        {dealer.tax_id} · {dealer.tax_office}
                      </dd>
                    </div>
                    {dealer.mersis_number && (
                      <div className="flex justify-between gap-2">
                        <dt>MERSİS</dt>
                        <dd className="font-mono text-white/85">{dealer.mersis_number}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt>KEP</dt>
                      <dd className="truncate text-white/85">{dealer.kep_address}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>IBAN</dt>
                      <dd className="font-mono text-white/85">{maskIban(dealer.iban)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("admin.requests.dealer_focus")}</dt>
                      <dd className="truncate text-right text-white/85">{dealer.product_focus}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("admin.requests.dealer_docs")}</dt>
                      <dd className="text-white/85">
                        {[
                          dealer.tax_plate_path && t("auth.dealer.doc_tax_plate"),
                          dealer.signature_doc_path && t("auth.dealer.doc_signature_doc"),
                          dealer.trade_registry_path && t("auth.dealer.doc_trade_registry"),
                          dealer.activity_certificate_path &&
                            t("auth.dealer.doc_activity_certificate"),
                        ]
                          .filter(Boolean)
                          .join(" · ") || t("admin.requests.dealer_docs_none")}
                      </dd>
                    </div>
                    {dealer.submitted_at && (
                      <div className="flex justify-between gap-2">
                        <dt>{t("admin.requests.dealer_submitted")}</dt>
                        <dd>{fmt.format(new Date(dealer.submitted_at))}</dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onApprove(r)}
                    className="h-8 flex-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-40 transition-colors"
                  >
                    {t("admin.requests.approve")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReject(r)}
                    className="h-8 flex-1 rounded-lg border border-white/15 bg-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 hover:bg-white/[0.12] disabled:opacity-40 transition-colors"
                  >
                    {t("admin.requests.reject")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}
