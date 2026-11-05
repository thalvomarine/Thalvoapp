import test from "node:test";
import assert from "node:assert/strict";
import { packageTitleLang, resolveAiLang } from "./ai-lang.ts";

test("resolveAiLang maps Greek to English AI copy", () => {
  assert.equal(resolveAiLang("el"), "en");
  assert.equal(resolveAiLang("el-GR"), "en");
  assert.equal(resolveAiLang("en-US"), "en");
  assert.equal(resolveAiLang("tr"), "tr");
  assert.equal(resolveAiLang("tr-TR"), "tr");
});

test("packageTitleLang keeps Greek on English catalogue titles", () => {
  assert.equal(packageTitleLang("el"), "en");
  assert.equal(packageTitleLang("en"), "en");
  assert.equal(packageTitleLang("tr"), "tr");
});
