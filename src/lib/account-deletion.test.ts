import test from "node:test";
import assert from "node:assert/strict";
import { emailMatchesAccount } from "./account-deletion.ts";

test("emailMatchesAccount accepts the signed-in email ignoring case and space", () => {
  assert.equal(emailMatchesAccount("  Captain@Thalvo.org ", "captain@thalvo.org"), true);
});

test("emailMatchesAccount rejects a different address, a blank, and a missing account email", () => {
  assert.equal(emailMatchesAccount("other@thalvo.org", "captain@thalvo.org"), false);
  assert.equal(emailMatchesAccount("", "captain@thalvo.org"), false);
  assert.equal(emailMatchesAccount("captain@thalvo.org", ""), false);
  assert.equal(emailMatchesAccount("captain@thalvo.org", null), false);
});
