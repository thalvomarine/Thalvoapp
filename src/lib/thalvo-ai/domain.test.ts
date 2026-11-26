import assert from "node:assert/strict";
import test from "node:test";
import { answerFromTraining, classifyMarineDomain, offTopicReply, retrieveMarineNotes, shouldTailorMachinery } from "./domain.ts";
import { lookupPlaceByName, resolveNamedPlace } from "./places.ts";

test("stays inside seamanship, machinery, and weather", () => {
  assert.equal(classifyMarineDomain("Motor hararet yaptı"), "machinery");
  assert.equal(classifyMarineDomain("Göcek'te deniz durumu nasıl?"), "weather");
  assert.equal(classifyMarineDomain("Bu rüzgârda alargaya demirlenir mi?"), "seamanship");
  assert.equal(classifyMarineDomain("Sintine su alıyor"), "machinery");
  assert.equal(classifyMarineDomain("Yangın var motor odasında"), "seamanship");
  assert.equal(classifyMarineDomain("Bana bir pasta tarifi ver"), "outside");
});

test("machinery answer uses the plain-language report and does not invent a part code", async () => {
  const reply = await answerFromTraining({
    text: "Motor hararet yaptı",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.domain, "machinery");
  assert.match(reply.text, /Sade Dil Raporu/);
  assert.match(reply.text, /impeller/i);
  assert.doesNotMatch(reply.text, /parça kodu:\s*\d/i);
});

test("bilge flooding is an emergency machinery note", async () => {
  const reply = await answerFromTraining({
    text: "Tekne su alıyor sintine doluyor",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.domain, "machinery");
  assert.equal(reply.emergency, true);
  assert.match(reply.text, /pompa/i);
});

test("off-topic refusal names the three subjects", () => {
  assert.match(offTopicReply("tr"), /deniz/);
  assert.match(offTopicReply("tr"), /makine/);
  assert.match(offTopicReply("tr"), /hava/);
});

test("weather without a place asks instead of inventing a wave height", async () => {
  const reply = await answerFromTraining({
    text: "Deniz durumu nasıl?",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.domain, "weather");
  assert.match(reply.text, /Göcek/);
  assert.doesNotMatch(reply.text, /\d+(\.\d+)? m/);
});

test("a short overheat stays on the general cooling note", async () => {
  const reply = await answerFromTraining({
    text: "Motor hararet yaptı",
    lang: "tr",
    position: null,
  });
  assert.match(reply.text, /impeller/i);
  assert.doesNotMatch(reply.text, /Rölantide idare eden soğutma/);
  assert.equal(shouldTailorMachinery("Motor hararet yaptı", reply.domain), false);
});

test("load heat with weak exhaust water beats the general overheat note", async () => {
  const reply = await answerFromTraining({
    text: "Yüksek devirde hararet yapıyor, egzozdan az su geliyor",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.domain, "machinery");
  assert.match(reply.text, /Rölantide idare eden soğutma/);
  assert.match(reply.text, /impeller/i);
  assert.doesNotMatch(reply.text, /\d+\s*Nm/i);
});

test("milky oil stops the engine and does not invent a pressure", async () => {
  const reply = await answerFromTraining({
    text: "Yağ süt gibi oldu",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.emergency, true);
  assert.match(reply.text, /durdur/i);
  assert.doesNotMatch(reply.text, /\d+(\.\d+)?\s*bar/i);
  assert.doesNotMatch(reply.text, /parça kodu:\s*\d/i);
});

test("a start that fires and dies is air in the fuel, not a flat battery", async () => {
  const reply = await answerFromTraining({
    text: "Marş basıp sönüyor",
    lang: "tr",
    position: null,
  });
  assert.match(reply.text, /hava/);
  assert.doesNotMatch(reply.text, /Kutuplar temizken marş çevirir/);
});

test("water in the separator is drained, not given a filter code", async () => {
  const reply = await answerFromTraining({
    text: "Yakıtta su var, separatör dolu",
    lang: "tr",
    position: null,
  });
  assert.match(reply.text, /boşalt/i);
  assert.doesNotMatch(reply.text, /\b\d{5,}\b/);
});

test("gearbox slip does not name a fluid", async () => {
  const reply = await answerFromTraining({
    text: "Şanzıman vitese geçmiyor",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.domain, "machinery");
  assert.match(reply.text, /seviye/i);
  assert.doesNotMatch(reply.text, /ATF|Dexron/i);
});

test("rope on the prop says not to reach for a spinning shaft", async () => {
  const reply = await answerFromTraining({
    text: "Pervaneye halat dolandı",
    lang: "tr",
    position: null,
  });
  assert.match(reply.text, /şafta el uzatma/i);
});

test("exhaust smell in the cabin is an emergency", async () => {
  const reply = await answerFromTraining({
    text: "Kamarada egzoz kokusu var",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.emergency, true);
  assert.match(reply.text, /açık havaya/i);
});

test("a brand name is tailored, a vague machinery question is not confident", async () => {
  assert.equal(shouldTailorMachinery("Volvo Penta D2 hararet yapıyor", "machinery"), true);
  const vague = await answerFromTraining({
    text: "Motor tuhaf çalışıyor",
    lang: "tr",
    position: null,
  });
  assert.equal(vague.confident, false);
  assert.match(vague.text, /Marş basınca/);
});

test("a rope on the shaft is machinery even without the word motor", async () => {
  const reply = await answerFromTraining({
    text: "Şafta halat dolandı",
    lang: "tr",
    position: null,
  });
  assert.equal(reply.domain, "machinery");
  assert.match(reply.text, /şafta el uzatma/i);
});

test("plumbing is not the fog rule", () => {
  assert.equal(classifyMarineDomain("Tesisat kontrolü"), "outside");
});

test("two symptoms retrieve more than one yard note", () => {
  const notes = retrieveMarineNotes("beyaz duman ve hararet", "tr");
  assert.match(notes, /Doğrulanmış usta notları/);
  assert.match(notes, /Beyaz duman|beyaz duman|Sürekli beyaz/);
  assert.match(notes, /soğutma suyunu yeterince alamıyor/);
});

test("named coast places resolve for weather", () => {
  assert.equal(resolveNamedPlace("Kaş'ta hava nasıl")?.name, "Kaş");
  assert.equal(lookupPlaceByName("Fethiye")?.name, "Fethiye");
  assert.equal(lookupPlaceByName("Ege")?.region, "aegean");
});
