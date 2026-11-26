import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  catalogueMatch,
  inquiryInputError,
  sortCatalogue,
  stayFullyOpen,
  stayNights,
  upcomingDays,
  yachtInputError,
} from "./charter-fleet.ts";
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
  kind: "crewed",
  weeklyEur: 4200,
  skipper: "",
  listed: true,
};

describe("charter fleet input", () => {
  it("accepts a Göcek yacht and rejects a blank name", () => {
    assert.equal(yachtInputError(valid), null);
    assert.equal(yachtInputError({ ...valid, name: " " }), "name");
    assert.equal(yachtInputError({ ...valid, weeklyEur: -1 }), "price");
    assert.equal(yachtInputError({ ...valid, base: "İstanbul" }), null);
    assert.equal(yachtInputError({ ...valid, base: "A" }), "base");
    assert.equal(yachtInputError({ ...valid, hull: "rib" as "sail" }), "hull");
  });

  it("lists the next calendar days from a Thursday", () => {
    const days = upcomingDays(new Date(2026, 10, 26), 3);
    assert.deepEqual(days, ["2026-11-26", "2026-11-27", "2026-11-28"]);
  });

  it("requires a stay range and a way to reply", () => {
    assert.equal(
      inquiryInputError({ guestName: "Ada", contact: "ada@example.com", party: 4, startIso: "2026-11-16", endIso: "2026-11-20", note: "" }),
      null,
    );
    assert.equal(
      inquiryInputError({ guestName: "Ada", contact: "ada@example.com", party: 4, startIso: "2026-11-20", endIso: "2026-11-16", note: "" }),
      "dates",
    );
    assert.equal(
      inquiryInputError({ guestName: "Ada", contact: "a", party: 4, startIso: "2026-11-16", endIso: "2026-11-20", note: "" }),
      "contact",
    );
  });

  it("matches a port by name and keeps a smaller party off a short boat", () => {
    const split = {
      base: "Split",
      openDays: ["2026-11-28", "2026-11-29", "2026-11-30", "2026-12-01"],
      berths: 8,
      hull: "sail" as const,
      weeklyEur: 3600,
      loaM: 12.8,
    };
    const query = { place: "spl", checkIn: "2026-11-28", checkOut: "2026-12-01", party: 4, hull: "sail" as const };
    assert.equal(catalogueMatch(split, query), true);
    assert.equal(catalogueMatch(split, { ...query, place: "İstanbul" }), false);
    assert.equal(catalogueMatch({ ...split, berths: 2 }, { ...query, party: 6 }), false);
    const priced = sortCatalogue(
      [
        { ...split, weeklyEur: 9000, openDays: ["2026-12-05"] },
        { ...split, base: "Palma", weeklyEur: 2000, openDays: ["2026-11-28"] },
      ],
      "price",
    );
    assert.equal(priced[0]?.base, "Palma");
  });

  it("requires every night of the stay to be open", () => {
    assert.deepEqual(stayNights("2026-11-16", "2026-11-20"), ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]);
    assert.equal(stayFullyOpen(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"], "2026-11-16", "2026-11-20"), true);
    assert.equal(stayFullyOpen(["2026-11-16", "2026-11-17", "2026-11-19"], "2026-11-16", "2026-11-20"), false);
    const boat = {
      base: "Göcek",
      openDays: ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"],
      berths: 8,
      cabins: 3,
      hull: "gulet" as const,
      weeklyEur: 18000,
      loaM: 28,
    };
    assert.equal(
      catalogueMatch(boat, { place: "göcek", checkIn: "2026-11-16", checkOut: "2026-11-20", party: 2, minCabins: 1, hull: "all" }),
      true,
    );
    assert.equal(
      catalogueMatch(boat, { place: "", checkIn: "2026-11-16", checkOut: "2026-11-21", party: 2, hull: "all" }),
      false,
    );
  });
});
