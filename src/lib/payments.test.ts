import test from "node:test";
import assert from "node:assert/strict";
import { readCompleteJobResult } from "./payments.ts";

test("readCompleteJobResult recognises close outcomes", () => {
  assert.equal(readCompleteJobResult({ status: "completed" }), "completed");
  assert.equal(readCompleteJobResult({ status: "already_completed" }), "already_completed");
  assert.equal(readCompleteJobResult({ status: "awaiting_counterpart" }), "awaiting_counterpart");
});

test("readCompleteJobResult rejects unexpected shapes", () => {
  assert.equal(readCompleteJobResult(null), "unknown");
  assert.equal(readCompleteJobResult(undefined), "unknown");
  assert.equal(readCompleteJobResult({}), "unknown");
  assert.equal(readCompleteJobResult([]), "unknown");
  assert.equal(readCompleteJobResult("completed"), "unknown");
  assert.equal(readCompleteJobResult({ status: "weird" }), "unknown");
});
