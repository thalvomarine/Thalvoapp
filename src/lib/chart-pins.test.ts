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
  assert.match(chartPinHtml("marina"), /#f5b942/);
  assert.match(chartPinHtml("hazard"), /#fb7185/);
});

test("usta wrench and captain cap keep their alarm tones", () => {
  const brass = actorPinHtml("wrench", "cyan");
  const alarm = actorPinHtml("wrench", "red");
  assert.notEqual(brass, alarm);
  assert.match(brass, /#f5b942/);
  assert.match(alarm, /#fb7185/);

  const day = actorPinHtml("cap", "gold");
  const night = actorPinHtml("cap", "red");
  assert.notEqual(day, night);
  assert.match(night, /#fb7185/);
  assert.match(day, /#f5b942/);
});
