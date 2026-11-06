import assert from "node:assert/strict";
import test from "node:test";
import {
  googleAdsConversionLabels,
  googleAdsId,
  isGoogleAdsEnabled,
  trackGoogleAdsConversion,
} from "./google-ads.ts";

test("Google Ads stays off without VITE_GOOGLE_ADS_ID", () => {
  assert.equal(googleAdsId(), "");
  assert.equal(isGoogleAdsEnabled(), false);
  assert.equal(trackGoogleAdsConversion("sign_up"), false);
});

test("conversion labels are empty when env unset", () => {
  const labels = googleAdsConversionLabels();
  assert.equal(labels.sign_up, undefined);
  assert.equal(labels.email_confirmed, undefined);
  assert.equal(labels.boatshow_lead, undefined);
  assert.equal(labels.begin_checkout, undefined);
});
