import assert from "node:assert/strict";
import test from "node:test";
import {
  actorPinHtml,
  chartPinHtml,
  CHART_PIN_ANCHOR,
  CHART_PIN_SIZE,
  type ChartPinKind,
} from "./chart-pins.ts";

const KINDS: ChartPinKind[] = [
  "lighthouse",
  "marina",
  "anchorage",
  "fuel",
  "hazard",
  "restaurant",
  "own",
  "diver",
  "vessel",
  "report",
];

test("each live-chart mark is its own 36px svg, centered on the fix", () => {
  const seen = new Set<string>();
  for (const kind of KINDS) {
    const html = chartPinHtml(kind);
    assert.match(html, /^<svg width="36" height="36" viewBox="0 0 32 32" /);
    assert.equal(html.includes("<script"), false);
    assert.equal((html.match(/<svg/g) ?? []).length, 1);
    assert.equal(html.endsWith("</svg>"), true);
    seen.add(html);
  }
  assert.equal(seen.size, KINDS.length);
  assert.deepEqual(CHART_PIN_SIZE, [36, 36]);
  assert.deepEqual(CHART_PIN_ANCHOR, [18, 18]);
});

test("usta wrench and captain cap keep their alarm tones", () => {
  const brass = actorPinHtml("wrench", "cyan");
  const alarm = actorPinHtml("wrench", "red");
  assert.notEqual(brass, alarm);
  assert.match(brass, /#3EE7F2/);
  assert.match(alarm, /#EF4444/);

  const day = actorPinHtml("cap", "gold");
  const night = actorPinHtml("cap", "red");
  assert.notEqual(day, night);
  assert.match(night, /#EF4444/);
  assert.match(day, /#F5B942/);
});
