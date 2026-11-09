import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SEED_FLEET,
  bookingNights,
  buildSeedBookings,
  buildWeekStrip,
  filterBookings,
  filterFleet,
  fleetStats,
  formatLoa,
  todayIso,
  todaysOps,
} from "./charter-desk.ts";

describe("charter-desk", () => {
  it("anchors seed bookings to the local calendar day", () => {
    const now = new Date(2026, 6, 15, 10, 0, 0); // 15 Jul 2026
    const bookings = buildSeedBookings(now);
    const today = todayIso(now);
    assert.equal(today, "2026-07-15");
    assert.ok(bookings.some((b) => b.startIso === today));
    assert.ok(bookings.some((b) => b.endIso === today));
  });

  it("filters fleet by base and status", () => {
    const gocek = filterFleet(SEED_FLEET, "Göcek", "all");
    assert.ok(gocek.every((y) => y.base === "Göcek"));
    const avail = filterFleet(SEED_FLEET, "all", "available");
    assert.ok(avail.every((y) => y.status === "available"));
    assert.equal(avail.length, fleetStats(SEED_FLEET).available);
  });

  it("builds today ops columns from bookings", () => {
    const now = new Date(2026, 6, 15, 12, 0, 0);
    const bookings = buildSeedBookings(now);
    const today = todayIso(now);
    const ops = todaysOps(bookings, today);
    assert.ok(ops.checkIns.length >= 1);
    assert.ok(ops.checkOuts.length >= 1);
  });

  it("filters bookings by selected day and base", () => {
    const now = new Date(2026, 6, 15);
    const bookings = buildSeedBookings(now);
    const day = todayIso(now);
    const forDay = filterBookings(bookings, "all", day);
    assert.ok(forDay.every((b) => b.startIso <= day && b.endIso >= day));
    const gocek = filterBookings(bookings, "Göcek", null);
    assert.ok(gocek.every((b) => b.baseOut === "Göcek" || b.baseIn === "Göcek"));
  });

  it("builds a 7-day week strip and formats LOA", () => {
    const now = new Date(2026, 6, 15);
    const bookings = buildSeedBookings(now);
    const week = buildWeekStrip(bookings, SEED_FLEET, now);
    assert.equal(week.length, 7);
    assert.equal(week[0]?.iso, "2026-07-15");
    assert.equal(formatLoa(12.8), "12.8 m");
    const nights = bookingNights(bookings[0]!);
    assert.ok(nights >= 1);
  });
});
