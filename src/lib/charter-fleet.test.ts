import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogueMatch, inquiryInputError, isSaturdayIso, sortCatalogue, upcomingSaturdays, weekOverlapsStay, yachtInputError } from "./charter-fleet.ts";
import type { FleetYachtInput } from "./charter-fleet.ts";

const valid: FleetYachtInput = {
  name: "Meltem",
  model: "Bavaria C42",
  year: 2022,
  loaM: 12.8,
  berths: 8,
  cabins: 3,
  base: "Göcek",
  hull: "sail",
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
    assert.equal(yachtInputError({ ...valid, base: "İstanbul" }), null);
    assert.equal(yachtInputError({ ...valid, base: "A" }), "base");
    assert.equal(yachtInputError({ ...valid, hull: "rib" as "sail" }), "hull");
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

  it("matches a port by name and keeps a smaller party off a short boat", () => {
    const split = { base: "Split", openWeeks: ["2026-11-28"], berths: 8, hull: "sail" as const, kind: "bareboat" as const, weeklyEur: 3600, loaM: 12.8 };
    const query = { place: "spl", week: "2026-11-28", party: 4, hull: "sail" as const, kind: "all" as const };
    assert.equal(catalogueMatch(split, query), true);
    assert.equal(catalogueMatch(split, { ...query, place: "İstanbul" }), false);
    assert.equal(catalogueMatch({ ...split, berths: 2 }, { ...query, party: 6 }), false);
    const priced = sortCatalogue(
      [
        { ...split, weeklyEur: 9000, openWeeks: ["2026-12-05"] },
        { ...split, base: "Palma", weeklyEur: 2000, openWeeks: ["2026-11-28"] },
      ],
      "price",
    );
    assert.equal(priced[0]?.base, "Palma");
  });

  it("keeps a Saturday week that overlaps the stay and drops a later one", () => {
    assert.equal(weekOverlapsStay("2026-11-14", "2026-11-16", "2026-11-20"), true);
    assert.equal(weekOverlapsStay("2026-11-21", "2026-11-16", "2026-11-20"), false);
    const boat = {
      base: "Göcek",
      openWeeks: ["2026-11-14", "2026-11-21"],
      berths: 8,
      cabins: 3,
      hull: "gulet" as const,
      kind: "crewed" as const,
      weeklyEur: 18000,
      loaM: 28,
    };
    assert.equal(
      catalogueMatch(boat, { place: "göcek", week: "", checkIn: "2026-11-16", checkOut: "2026-11-20", party: 2, minCabins: 1, hull: "all", kind: "all" }),
      true,
    );
    assert.equal(
      catalogueMatch(boat, { place: "", week: "", party: 2, minCabins: 6, hull: "all", kind: "all" }),
      false,
    );
  });
});
