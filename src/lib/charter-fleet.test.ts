import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inquiryInputError, isSaturdayIso, upcomingSaturdays, yachtInputError } from "./charter-fleet.ts";
import type { FleetYachtInput } from "./charter-fleet.ts";

const valid: FleetYachtInput = {
  name: "Meltem",
  model: "Bavaria C42",
  year: 2022,
  loaM: 12.8,
  berths: 8,
  cabins: 3,
  base: "Göcek",
  kind: "bareboat",
  weeklyEur: 4200,
  skipper: "",
  listed: true,
};

describe("charter fleet input", () => {
  it("accepts a Göcek bareboat and rejects a blank name", () => {
    assert.equal(yachtInputError(valid), null);
    assert.equal(yachtInputError({ ...valid, name: " " }), "name");
    assert.equal(yachtInputError({ ...valid, weeklyEur: -1 }), "price");
    assert.equal(yachtInputError({ ...valid, base: "İstanbul" as "Göcek" }), "base");
  });

  it("lists the next Saturdays from a Thursday", () => {
    const days = upcomingSaturdays(new Date(2026, 10, 26), 3);
    assert.deepEqual(days, ["2026-11-28", "2026-12-05", "2026-12-12"]);
    assert.equal(isSaturdayIso("2026-11-28"), true);
    assert.equal(isSaturdayIso("2026-11-26"), false);
  });

  it("requires a Saturday and a way to reply", () => {
    assert.equal(
      inquiryInputError({ guestName: "Ada", contact: "ada@example.com", party: 4, startIso: "2026-11-28", note: "" }),
      null,
    );
    assert.equal(
      inquiryInputError({ guestName: "Ada", contact: "ada@example.com", party: 4, startIso: "2026-11-26", note: "" }),
      "week",
    );
    assert.equal(
      inquiryInputError({ guestName: "Ada", contact: "a", party: 4, startIso: "2026-11-28", note: "" }),
      "contact",
    );
  });
});
