import assert from "node:assert/strict";
import test from "node:test";
import { decodeRendezvous, encodeRendezvous, escrowTotal } from "./rendezvous.ts";

test("own-boat fee is added to the escrow total", () => {
  assert.equal(escrowTotal(4000, { mode: "own_boat", fee: 1500 }), 5500);
  assert.equal(escrowTotal(4000, { mode: "pickup", fee: 1500 }), 4000);
  assert.equal(escrowTotal(4000, { mode: "marina", fee: 0 }), 4000);
});

test("rendezvous round-trips through the offer note", () => {
  const note = encodeRendezvous({
    mode: "marina",
    fee: 0,
    point: "Göcek",
    note: "Akü zayıf, marş almıyor.",
  });
  const parsed = decodeRendezvous(note);
  assert.equal(parsed.mode, "marina");
  assert.equal(parsed.point, "Göcek");
  assert.equal(parsed.note, "Akü zayıf, marş almıyor.");
});
