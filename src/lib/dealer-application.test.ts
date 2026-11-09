import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyDealerDraft,
  isValidKep,
  isValidMersis,
  isValidTaxId,
  isValidTurkishIban,
  needsMersis,
  validateDealerStep,
} from "./dealer-application.ts";

describe("dealer-application validators", () => {
  it("accepts a Turkish IBAN", () => {
    assert.equal(isValidTurkishIban("TR33 0006 1005 1978 6457 8413 26"), true);
    assert.equal(isValidTurkishIban("DE89 3704 0044 0532 0130 00"), false);
  });

  it("checks tax id length by entity", () => {
    assert.equal(isValidTaxId("1234567890", "limited"), true);
    assert.equal(isValidTaxId("12345678901", "sole_proprietorship"), true);
    assert.equal(isValidTaxId("123", "limited"), false);
  });

  it("requires MERSİS for companies", () => {
    assert.equal(needsMersis("limited"), true);
    assert.equal(needsMersis("sole_proprietorship"), false);
    assert.equal(isValidMersis("1234567890123456"), true);
    assert.equal(isValidMersis("123"), false);
  });

  it("validates kep.tr addresses", () => {
    assert.equal(isValidKep("firma@ornek.kep.tr"), true);
    assert.equal(isValidKep("firma@gmail.com"), false);
  });

  it("blocks incomplete company step", () => {
    const draft = emptyDealerDraft();
    const errors = validateDealerStep(2, draft);
    assert.ok(errors.legalName);
    assert.ok(errors.taxId);
    assert.ok(errors.kepAddress);
  });
});
