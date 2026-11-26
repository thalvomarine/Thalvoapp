import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SEED_FLEET,
  bookingNights,
  buildSeedBookings,
  buildWeekStrip,
  charterMoney,
  filterBookings,
  filterFleet,
  fleetStats,
  formatLoa,
  handoverItems,
  occupancyCell,
  saturdayWeeks,
  todayIso,
  todaysOps,
  yachtById,
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

  it("builds Saturday occupancy the way a charter base reads the week", () => {
    const now = new Date(2026, 10, 26, 9, 0, 0); // Thu 26 Nov 2026
    const weeks = saturdayWeeks(now, 4);
    assert.equal(weeks.length, 4);
    assert.equal(weeks[0]?.startIso, "2026-11-21");
    assert.equal(weeks[0]?.endIso, "2026-11-28");
    assert.equal(weeks[1]?.startIso, "2026-11-28");

    const bookings = buildSeedBookings(now);
    const today = todayIso(now);
    const twin = yachtById(SEED_FLEET, "yt-twin-coast")!;
    assert.equal(occupancyCell(twin, weeks[0]!, bookings, today).tone, "service");

    const pearl = yachtById(SEED_FLEET, "yt-aegean-pearl")!;
    const pearlCell = occupancyCell(pearl, weeks[0]!, bookings, today);
    assert.equal(pearlCell.tone, "booked");
    assert.equal(pearlCell.booking?.guest, "Helena & Markus W.");

    const gulet = yachtById(SEED_FLEET, "yt-blue-anatolia")!;
    assert.equal(occupancyCell(gulet, weeks[0]!, bookings, today).tone, "one_way");

    const wind = yachtById(SEED_FLEET, "yt-lycian-wind")!;
    const optionWeek = weeks.find((week) => occupancyCell(wind, week, bookings, today).tone === "option");
    assert.ok(optionWeek);

    const meltemi = yachtById(SEED_FLEET, "yt-meltemi")!;
    const sophie = bookings.find((b) => b.yachtId === "yt-meltemi")!;
    const money = charterMoney(sophie, meltemi);
    assert.equal(money.collected, Math.round(money.fee * 0.5));
    assert.ok(money.deposit > 0);
    assert.equal(money.apa, 0);
    assert.ok(handoverItems("bareboat").includes("transit_log"));
    assert.ok(handoverItems("bareboat").includes("licence"));
    assert.ok(handoverItems("crewed").includes("apa"));
    const guletMoney = charterMoney(bookings.find((b) => b.yachtId === "yt-blue-anatolia")!, gulet);
    assert.ok(guletMoney.apa > 0);
    assert.equal(guletMoney.deposit, 0);
  });
});
