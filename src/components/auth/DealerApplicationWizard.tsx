import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileUp, Loader2 } from "lucide-react";
import {
  DEALER_DELIVERY_MODES,
  DEALER_DOC_SLOTS,
  DEALER_ENTITY_TYPES,
  DEALER_INVOICE_TYPES,
  HOME_MARINAS,
  emptyDealerDraft,
  needsMersis,
  needsTradeRegistry,
  validateDealerStep,
  type DealerApplicationDraft,
  type DealerDocSlot,
  type DealerStepErrors,
} from "@/lib/dealer-application";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

export type DealerDocsState = Partial<Record<DealerDocSlot, File | null>>;

type Props = {
  draft: DealerApplicationDraft;
  docs: DealerDocsState;
  email: string;
  password: string;
  busy: boolean;
  err: string | null;
  onDraftChange: (next: DealerApplicationDraft) => void;
  onDocsChange: (next: DealerDocsState) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onChangeRole: () => void;
  onSubmit: () => void;
};

export function DealerApplicationWizard({
  draft,
  docs,
  email,
  password,
  busy,
  err,
  onDraftChange,
  onDocsChange,
  onEmailChange,
  onPasswordChange,
  onChangeRole,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepErrors, setStepErrors] = useState<DealerStepErrors>({});

  const patch = (partial: Partial<DealerApplicationDraft>) =>
    onDraftChange({ ...draft, ...partial });

  const steps = useMemo(
    () =>
      [
        { n: 1 as const, label: t("auth.dealer.step_account") },
        { n: 2 as const, label: t("auth.dealer.step_company") },
        { n: 3 as const, label: t("auth.dealer.step_ops") },
        { n: 4 as const, label: t("auth.dealer.step_docs") },
      ] as const,
    [t],
  );

  const fieldError = (key: keyof DealerApplicationDraft) => {
    const code = stepErrors[key];
    if (!code) return null;
    return t(`auth.dealer.err_${code}`, { defaultValue: t("auth.dealer.err_required") });
  };

  const goNext = () => {
    const errors = validateDealerStep(step, draft);
    if (step === 1) {
      if (!email.trim() || password.length < 10 || Object.keys(errors).length > 0) {
        setStepErrors(errors);
        return;
      }
    } else if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors({});
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  };

  const goBack = () => {
    setStepErrors({});
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  };

  const trySubmit = () => {
    const errors = validateDealerStep(4, draft);
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    onSubmit();
  };

  const onPickDoc = (slot: DealerDocSlot, file: File | null) => {
    if (file && file.size > MAX_BYTES) return;
    onDocsChange({ ...docs, [slot]: file });
  };

  return (
    <div className="space-y-3.5">
      <button
        type="button"
        onClick={onChangeRole}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100"
      >
        {t("auth.role_supplier")}
        <span className="text-amber-100/50">·</span>
        {t("auth.change_role")}
      </button>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <p className="text-[12px] leading-snug text-white/70">{t("auth.dealer.kicker")}</p>
        <p className="mt-1.5 text-[11px] leading-snug text-white/40">{t("auth.dealer.kicker_sub")}</p>
      </div>

      <ol className="grid grid-cols-4 gap-1.5" aria-label={t("auth.dealer.steps_label")}>
        {steps.map((s) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <li
              key={s.n}
              className={
                "rounded-lg border px-1.5 py-2 text-center " +
                (active
                  ? "border-[color:var(--pm-gold)]/50 bg-[color:var(--pm-gold)]/10"
                  : done
                    ? "border-emerald-400/25 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.02]")
              }
            >
              <span
                className={
                  "mx-auto flex size-5 items-center justify-center rounded-full text-[10px] font-bold " +
                  (done
                    ? "bg-emerald-400/20 text-emerald-200"
                    : active
                      ? "bg-[color:var(--pm-gold)]/20 text-[color:var(--pm-gold)]"
                      : "bg-white/10 text-white/45")
                }
              >
                {done ? <Check className="size-3" /> : s.n}
              </span>
              <span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-white/55">
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="space-y-3">
          <Field
            label={t("auth.contact_name")}
            value={draft.authorizedName}
            onChange={(v) => patch({ authorizedName: v })}
            required
            autoComplete="name"
            error={fieldError("authorizedName")}
          />
          <Field
            label={t("auth.dealer.authorized_title")}
            value={draft.authorizedTitle}
            onChange={(v) => patch({ authorizedTitle: v })}
            placeholder={t("auth.dealer.authorized_title_ph")}
          />
          <Field
            label={t("auth.phone")}
            value={draft.phone}
            onChange={(v) => patch({ phone: v })}
            type="tel"
            required
            autoComplete="tel"
            placeholder="+90…"
            error={fieldError("phone")}
          />
          <p className="-mt-1 text-[11px] leading-snug text-white/40">{t("auth.phone_private_notice")}</p>
          <Field
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={onEmailChange}
            required
            autoComplete="email"
          />
          <Field
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={onPasswordChange}
            required
            minLength={10}
            autoComplete="new-password"
          />
          <p className="-mt-1 text-[11px] text-white/40">{t("auth.password_hint")}</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label className="auth-label">{t("auth.dealer.entity_type")}</label>
            <select
              value={draft.entityType}
              onChange={(e) =>
                patch({ entityType: e.target.value as DealerApplicationDraft["entityType"] })
              }
              className="auth-field"
            >
              {DEALER_ENTITY_TYPES.map((e) => (
                <option key={e} value={e}>
                  {t(`auth.dealer.entity_${e}`)}
                </option>
              ))}
            </select>
          </div>
          <Field
            label={t("auth.dealer.legal_name")}
            value={draft.legalName}
            onChange={(v) => patch({ legalName: v })}
            required
            autoComplete="organization"
            placeholder={t("auth.business_placeholder")}
            error={fieldError("legalName")}
          />
          <Field
            label={t("auth.dealer.store_name")}
            value={draft.storeName}
            onChange={(v) => patch({ storeName: v })}
            required
            placeholder={t("auth.dealer.store_name_ph")}
            error={fieldError("storeName")}
          />
          <Field
            label={
              draft.entityType === "sole_proprietorship" || draft.entityType === "artisan"
                ? t("auth.dealer.tax_id_person")
                : t("auth.dealer.tax_id_company")
            }
            value={draft.taxId}
            onChange={(v) => patch({ taxId: v })}
            required
            inputMode="numeric"
            error={fieldError("taxId")}
          />
          <Field
            label={t("auth.dealer.tax_office")}
            value={draft.taxOffice}
            onChange={(v) => patch({ taxOffice: v })}
            required
            error={fieldError("taxOffice")}
          />
          {needsMersis(draft.entityType) && (
            <Field
              label={t("auth.dealer.mersis")}
              value={draft.mersisNumber}
              onChange={(v) => patch({ mersisNumber: v })}
              required
              inputMode="numeric"
              placeholder="16 haneli"
              error={fieldError("mersisNumber")}
            />
          )}
          <Field
            label={t("auth.dealer.kep")}
            value={draft.kepAddress}
            onChange={(v) => patch({ kepAddress: v })}
            required
            type="email"
            placeholder="firma@ornek.kep.tr"
            error={fieldError("kepAddress")}
          />
          <div>
            <label className="auth-label">{t("auth.dealer.invoice_type")}</label>
            <select
              value={draft.invoiceType}
              onChange={(e) =>
                patch({ invoiceType: e.target.value as DealerApplicationDraft["invoiceType"] })
              }
              className="auth-field"
            >
              {DEALER_INVOICE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`auth.dealer.invoice_${v}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Field
            label={t("auth.dealer.iban")}
            value={draft.iban}
            onChange={(v) => patch({ iban: v })}
            required
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            error={fieldError("iban")}
          />
          <Field
            label={t("auth.dealer.iban_name")}
            value={draft.ibanAccountName}
            onChange={(v) => patch({ ibanAccountName: v })}
            required
            placeholder={t("auth.dealer.iban_name_ph")}
            error={fieldError("ibanAccountName")}
          />
          <p className="-mt-1 text-[11px] leading-snug text-white/40">{t("auth.dealer.iban_hint")}</p>
          <Field
            label={t("auth.dealer.registered_address")}
            value={draft.registeredAddress}
            onChange={(v) => patch({ registeredAddress: v })}
            required
            error={fieldError("registeredAddress")}
          />
          <Field
            label={t("auth.dealer.billing_address")}
            value={draft.billingAddress}
            onChange={(v) => patch({ billingAddress: v })}
            required
            error={fieldError("billingAddress")}
          />
          <Field
            label={t("auth.dealer.ship_from_address")}
            value={draft.shipFromAddress}
            onChange={(v) => patch({ shipFromAddress: v })}
            required
            error={fieldError("shipFromAddress")}
          />
          <Field
            label={t("auth.dealer.return_address")}
            value={draft.returnAddress}
            onChange={(v) => patch({ returnAddress: v })}
            required
            error={fieldError("returnAddress")}
          />
          <div>
            <label className="auth-label">{t("auth.home_marina")}</label>
            <select
              value={draft.homeMarina}
              onChange={(e) => patch({ homeMarina: e.target.value })}
              className="auth-field"
            >
              {HOME_MARINAS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={`${t("auth.dealer.ops_contact")} (${t("common.optional")})`}
              value={draft.opsContactName}
              onChange={(v) => patch({ opsContactName: v })}
            />
            <Field
              label={`${t("auth.dealer.ops_phone")} (${t("common.optional")})`}
              value={draft.opsContactPhone}
              onChange={(v) => patch({ opsContactPhone: v })}
              type="tel"
            />
            <Field
              label={`${t("auth.dealer.finance_contact")} (${t("common.optional")})`}
              value={draft.financeContactName}
              onChange={(v) => patch({ financeContactName: v })}
            />
            <Field
              label={`${t("auth.dealer.finance_phone")} (${t("common.optional")})`}
              value={draft.financeContactPhone}
              onChange={(v) => patch({ financeContactPhone: v })}
              type="tel"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <Field
            label={t("auth.dealer.product_focus")}
            value={draft.productFocus}
            onChange={(v) => patch({ productFocus: v })}
            required
            placeholder={t("auth.dealer.product_focus_ph")}
            error={fieldError("productFocus")}
          />
          <Field
            label={`${t("auth.dealer.brands")} (${t("common.optional")})`}
            value={draft.brandsCarried}
            onChange={(v) => patch({ brandsCarried: v })}
            placeholder={t("auth.dealer.brands_ph")}
          />
          <Field
            label={`${t("auth.dealer.sku_count")} (${t("common.optional")})`}
            value={draft.estimatedSkuCount}
            onChange={(v) => patch({ estimatedSkuCount: v })}
            inputMode="numeric"
          />
          <div>
            <label className="auth-label">{t("auth.dealer.delivery_mode")}</label>
            <select
              value={draft.deliveryMode}
              onChange={(e) =>
                patch({ deliveryMode: e.target.value as DealerApplicationDraft["deliveryMode"] })
              }
              className="auth-field"
            >
              {DEALER_DELIVERY_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`auth.dealer.delivery_${m}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
              {t("auth.dealer.docs_title")}
            </p>
            <p className="text-[11px] leading-snug text-white/40">{t("auth.dealer.docs_hint")}</p>
            {DEALER_DOC_SLOTS.filter((slot) => {
              if (slot === "trade_registry" && !needsTradeRegistry(draft.entityType)) return false;
              return true;
            }).map((slot) => (
              <DocSlot
                key={slot}
                label={t(`auth.dealer.doc_${slot}`)}
                required={slot === "tax_plate" || slot === "signature_doc"}
                file={docs[slot] ?? null}
                onPick={(f) => onPickDoc(slot, f)}
              />
            ))}
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] leading-snug text-white/70">
            <input
              type="checkbox"
              checked={draft.partnerTermsAccepted}
              onChange={(e) => patch({ partnerTermsAccepted: e.target.checked })}
              className="mt-0.5 size-4 rounded border-white/20 bg-black/40"
            />
            <span>
              {t("auth.dealer.terms")}
              {fieldError("partnerTermsAccepted") && (
                <span className="mt-1 block text-[11px] text-destructive">
                  {fieldError("partnerTermsAccepted")}
                </span>
              )}
            </span>
          </label>
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 space-y-1">
              <p className="font-bold text-destructive">{t("auth.error_generic_title")}</p>
              <p className="text-foreground/80">{err}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={busy}
            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] text-[13px] font-semibold text-white/80 disabled:opacity-60"
          >
            <ChevronLeft className="size-4" />
            {t("common.back")}
          </button>
        ) : null}
        {step < 4 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            className="pm-gold-cta inline-flex h-12 flex-[1.4] items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold tracking-wide disabled:opacity-60"
          >
            {t("common.continue")}
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={trySubmit}
            disabled={busy}
            className="pm-gold-cta inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl text-[14px] font-bold tracking-wide disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("auth.dealer.submit")}
          </button>
        )}
      </div>
    </div>
  );
}

function DocSlot({
  label,
  required,
  file,
  onPick,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const { t } = useTranslation();
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-white/15 bg-black/20 px-2.5 py-2 hover:border-white/30">
      <FileUp className="size-4 shrink-0 text-white/45" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-white/80">
          {label}
          {required ? " *" : ` (${t("common.optional")})`}
        </span>
        <span className="block truncate text-[10px] text-white/40">
          {file ? file.name : t("auth.dealer.doc_pick")}
        </span>
      </span>
      <input
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  placeholder,
  autoComplete,
  inputMode,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  error?: string | null;
}) {
  return (
    <div>
      <label className="auth-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={"auth-field " + (error ? "border-destructive/50" : "")}
      />
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

export function createEmptyDealerDocs(): DealerDocsState {
  return Object.fromEntries(DEALER_DOC_SLOTS.map((s) => [s, null])) as DealerDocsState;
}

export function resetDealerDraft(): DealerApplicationDraft {
  return emptyDealerDraft();
}
