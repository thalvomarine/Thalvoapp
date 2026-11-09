/** Marketplace-grade dealer onboarding — fields aligned with TR marketplaces
 *  (Trendyol / Hepsiburada / Amazon TR / n11), without maritime licenses. */

export const DEALER_ENTITY_TYPES = [
  "sole_proprietorship",
  "limited",
  "joint_stock",
  "artisan",
] as const;

export type DealerEntityType = (typeof DEALER_ENTITY_TYPES)[number];

export const DEALER_INVOICE_TYPES = ["paper", "e_archive", "e_invoice"] as const;
export type DealerInvoiceType = (typeof DEALER_INVOICE_TYPES)[number];

export const DEALER_DELIVERY_MODES = ["marina_pickup", "courier", "both"] as const;
export type DealerDeliveryMode = (typeof DEALER_DELIVERY_MODES)[number];

export const DEALER_DOC_SLOTS = [
  "tax_plate",
  "signature_doc",
  "trade_registry",
  "activity_certificate",
] as const;

export type DealerDocSlot = (typeof DEALER_DOC_SLOTS)[number];

export const HOME_MARINAS = [
  "Didim",
  "Bodrum",
  "Datça",
  "Marmaris",
  "Göcek",
  "Fethiye",
  "Kaş",
  "Finike",
  "Kemer",
  "Antalya",
] as const;

export type DealerApplicationDraft = {
  authorizedName: string;
  authorizedTitle: string;
  phone: string;
  entityType: DealerEntityType;
  legalName: string;
  storeName: string;
  taxId: string;
  taxOffice: string;
  mersisNumber: string;
  kepAddress: string;
  invoiceType: DealerInvoiceType;
  iban: string;
  ibanAccountName: string;
  registeredAddress: string;
  billingAddress: string;
  shipFromAddress: string;
  returnAddress: string;
  homeMarina: string;
  opsContactName: string;
  opsContactPhone: string;
  financeContactName: string;
  financeContactPhone: string;
  productFocus: string;
  brandsCarried: string;
  estimatedSkuCount: string;
  deliveryMode: DealerDeliveryMode;
  partnerTermsAccepted: boolean;
};

export const emptyDealerDraft = (): DealerApplicationDraft => ({
  authorizedName: "",
  authorizedTitle: "",
  phone: "",
  entityType: "limited",
  legalName: "",
  storeName: "",
  taxId: "",
  taxOffice: "",
  mersisNumber: "",
  kepAddress: "",
  invoiceType: "e_archive",
  iban: "",
  ibanAccountName: "",
  registeredAddress: "",
  billingAddress: "",
  shipFromAddress: "",
  returnAddress: "",
  homeMarina: "Göcek",
  opsContactName: "",
  opsContactPhone: "",
  financeContactName: "",
  financeContactPhone: "",
  productFocus: "",
  brandsCarried: "",
  estimatedSkuCount: "",
  deliveryMode: "both",
  partnerTermsAccepted: false,
});

export function needsMersis(entity: DealerEntityType): boolean {
  return entity === "limited" || entity === "joint_stock";
}

export function needsTradeRegistry(entity: DealerEntityType): boolean {
  return entity === "limited" || entity === "joint_stock";
}

/** Strip spaces and uppercase; keep TR prefix. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function normalizeTaxId(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function normalizeMersis(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Turkish IBAN: TR + 24 digits. */
export function isValidTurkishIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  return /^TR\d{24}$/.test(iban);
}

/** Şahıs: 11-digit TCKN; şirket: 10-digit VKN. Light checksum-free length check. */
export function isValidTaxId(raw: string, entity: DealerEntityType): boolean {
  const id = normalizeTaxId(raw);
  if (entity === "sole_proprietorship" || entity === "artisan") {
    return id.length === 11;
  }
  return id.length === 10;
}

export function isValidMersis(raw: string): boolean {
  const m = normalizeMersis(raw);
  return m.length === 16;
}

export function isValidKep(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.kep\.tr$/.test(v);
}

export type DealerStepErrors = Partial<Record<keyof DealerApplicationDraft, string>>;

export function validateDealerStep(
  step: 1 | 2 | 3 | 4,
  draft: DealerApplicationDraft,
): DealerStepErrors {
  const errors: DealerStepErrors = {};

  if (step === 1) {
    if (!draft.authorizedName.trim()) errors.authorizedName = "required";
    if (!draft.phone.trim()) errors.phone = "required";
  }

  if (step === 2) {
    if (!draft.legalName.trim()) errors.legalName = "required";
    if (!draft.storeName.trim()) errors.storeName = "required";
    if (!isValidTaxId(draft.taxId, draft.entityType)) errors.taxId = "tax_id";
    if (!draft.taxOffice.trim()) errors.taxOffice = "required";
    if (needsMersis(draft.entityType) && !isValidMersis(draft.mersisNumber)) {
      errors.mersisNumber = "mersis";
    }
    if (!isValidKep(draft.kepAddress)) errors.kepAddress = "kep";
  }

  if (step === 3) {
    if (!isValidTurkishIban(draft.iban)) errors.iban = "iban";
    if (!draft.ibanAccountName.trim()) errors.ibanAccountName = "required";
    if (!draft.registeredAddress.trim()) errors.registeredAddress = "required";
    if (!draft.billingAddress.trim()) errors.billingAddress = "required";
    if (!draft.shipFromAddress.trim()) errors.shipFromAddress = "required";
    if (!draft.returnAddress.trim()) errors.returnAddress = "required";
    if (!draft.homeMarina.trim()) errors.homeMarina = "required";
  }

  if (step === 4) {
    if (!draft.productFocus.trim()) errors.productFocus = "required";
    if (!draft.partnerTermsAccepted) errors.partnerTermsAccepted = "terms";
  }

  return errors;
}

export function dealerDraftToRow(
  userId: string,
  draft: DealerApplicationDraft,
  docs: Partial<Record<DealerDocSlot, string>>,
) {
  const sku = Number.parseInt(draft.estimatedSkuCount.replace(/\D/g, ""), 10);
  return {
    user_id: userId,
    status: "submitted" as const,
    entity_type: draft.entityType,
    legal_name: draft.legalName.trim(),
    store_name: draft.storeName.trim(),
    tax_id: normalizeTaxId(draft.taxId),
    tax_office: draft.taxOffice.trim(),
    mersis_number: needsMersis(draft.entityType)
      ? normalizeMersis(draft.mersisNumber)
      : null,
    kep_address: draft.kepAddress.trim().toLowerCase(),
    invoice_type: draft.invoiceType,
    iban: normalizeIban(draft.iban),
    iban_account_name: draft.ibanAccountName.trim(),
    authorized_name: draft.authorizedName.trim(),
    authorized_title: draft.authorizedTitle.trim() || null,
    registered_address: draft.registeredAddress.trim(),
    billing_address: draft.billingAddress.trim(),
    ship_from_address: draft.shipFromAddress.trim(),
    return_address: draft.returnAddress.trim(),
    home_marina: draft.homeMarina.trim(),
    ops_contact_name: draft.opsContactName.trim() || null,
    ops_contact_phone: draft.opsContactPhone.trim() || null,
    finance_contact_name: draft.financeContactName.trim() || null,
    finance_contact_phone: draft.financeContactPhone.trim() || null,
    product_focus: draft.productFocus.trim(),
    brands_carried: draft.brandsCarried.trim() || null,
    estimated_sku_count: Number.isFinite(sku) && sku > 0 ? sku : null,
    delivery_mode: draft.deliveryMode,
    tax_plate_path: docs.tax_plate ?? null,
    signature_doc_path: docs.signature_doc ?? null,
    trade_registry_path: docs.trade_registry ?? null,
    activity_certificate_path: docs.activity_certificate ?? null,
    partner_terms_accepted_at: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
  };
}
