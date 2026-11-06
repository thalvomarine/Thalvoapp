import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateMarineEta,
  DEFAULT_SERVICE_BOAT_KTS,
  etaMinutes,
  haversineNm,
  suggestDispatchEtaMinutes,
} from "./geo-eta.ts";

describe("geo-eta auto dispatch", () => {
  it("haversine Göcek → Marmaris is a coastal-range hop", () => {
    const nm = haversineNm(36.7525, 28.9428, 36.8525, 28.278);
    assert.ok(nm > 20 && nm < 45, `unexpected nm=${nm}`);
  });

  it("calculateMarineEta returns minutes at service-boat speed", () => {
    const eta = calculateMarineEta(
      { lat: 36.7525, lng: 28.9428 },
      { lat: 36.76, lng: 28.95 },
      DEFAULT_SERVICE_BOAT_KTS,
    );
    assert.ok(eta.distanceNm > 0);
    assert.ok(eta.etaMinutes != null && eta.etaMinutes > 0);
    assert.match(eta.label, /NM/);
  });

  it("suggestDispatchEtaMinutes floors at 1 and caps at 24h", () => {
    assert.equal(suggestDispatchEtaMinutes(0), 1);
    assert.equal(suggestDispatchEtaMinutes(0.01), 1);
    const far = suggestDispatchEtaMinutes(etaMinutes(500, DEFAULT_SERVICE_BOAT_KTS) ?? 0);
    assert.ok(far <= 1440);
  });
});
