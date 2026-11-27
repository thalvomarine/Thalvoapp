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

test("each live-chart mark is the pre-redraw soft capsule", () => {
  const seen = new Set<string>();
  for (const kind of KINDS) {
    const html = chartPinHtml(kind);
    assert.match(html, /^<div style="width:30px;height:46px/);
    assert.match(html, /border-radius:15px 15px 12px 12px/);
    assert.equal(html.includes("<script"), false);
    seen.add(html);
  }
  assert.equal(seen.size, KINDS.length);
  assert.deepEqual(CHART_PIN_SIZE, [30, 46]);
  assert.deepEqual(CHART_PIN_ANCHOR, [15, 46]);
  assert.match(chartPinHtml("marina"), /svg width="20"/);
  assert.match(chartPinHtml("marina"), /#C4A15A/);
  assert.match(chartPinHtml("hazard"), /#C45C4A/);
  for (const kind of KINDS) {
    assert.doesNotMatch(chartPinHtml(kind), /#34d399|#fb7185|#22d3ee|#38bdf8|#c4b5fd|#00F0FF/i);
  }
});

test("usta wrench and captain cap keep their alarm tones", () => {
  const brass = actorPinHtml("wrench", "cyan");
  const alarm = actorPinHtml("wrench", "red");
  assert.notEqual(brass, alarm);
  assert.match(brass, /#C4A15A/);
  assert.match(alarm, /#C45C4A/);

  const day = actorPinHtml("cap", "gold");
  const night = actorPinHtml("cap", "red");
  assert.notEqual(day, night);
  assert.match(night, /#C45C4A/);
  assert.match(day, /#C4A15A/);
});
