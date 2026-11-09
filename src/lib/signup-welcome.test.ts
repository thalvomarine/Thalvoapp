import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PUBLIC_AUTH_ORIGIN,
  PUBLIC_CONFIRM_REDIRECT,
  confirmationRedirect,
  isEmailNotConfirmedMessage,
} from "./signup-welcome.ts";

describe("confirmationRedirect", () => {
  it("always lands on the live thalvo.org confirm URL", () => {
    assert.equal(PUBLIC_AUTH_ORIGIN, "https://thalvo.org");
    assert.equal(PUBLIC_CONFIRM_REDIRECT, "https://thalvo.org/auth?confirmed=1");
    assert.equal(confirmationRedirect(), PUBLIC_CONFIRM_REDIRECT);
  });
});

describe("isEmailNotConfirmedMessage", () => {
  it("matches GoTrue's English error", () => {
    assert.equal(isEmailNotConfirmedMessage("Email not confirmed"), true);
    assert.equal(isEmailNotConfirmedMessage("Invalid login credentials"), false);
  });
});
