import { MACHINERY_NOTES } from "./machinery-notes.ts";
import { resolveNamedPlace } from "./places.ts";

export type MarineDomain = "weather" | "machinery" | "seamanship" | "outside";

const LEXICON: Record<Exclude<MarineDomain, "outside">, string[]> = {
  weather: [
    "hava",
    "rüzgar",
    "ruzgar",
    "dalga",
    "fırtına",
    "firtina",
    "meltem",
    "poyraz",
    "lodos",
    "deniz durumu",
    "beaufort",
    "forecast",
    "weather",
    "wind",
    "wave",
    "swell",
    "storm",
    "gale",
    "gust",
    "barometer",
    "basınç",
    "basinc",
    "şiş",
    "sis",
    "etezyen",
    "etesian",
  ],
  machinery: [
    "motor",
    "makine",
    "hararet",
    "overheat",
    "impeller",
    "pervane",
    "yağ",
    "yag",
    "yakıt",
    "yakit",
    "dizel",
    "benzin",
    "volvo",
    "yanmar",
    "mercury",
    "yamaha",
    "cummins",
    "caterpillar",
    "marş",
    "mars",
    "egzoz",
    "duman",
    "kayış",
    "kayis",
    "soğutma",
    "sogutma",
    "alternatör",
    "alternator",
    "jeneratör",
    "generator",
    "outboard",
    "saildrive",
    "mixing elbow",
    "dirsek",
    "tell-tale",
    "su kaçağı",
    "su kacagi",
    "engine",
    "diesel",
    "oil pressure",
    "akü",
    "aku",
    "battery",
    "şarj",
    "sarj",
    "sintine",
    "bilge",
    "pompa",
    "dümen",
    "dumen",
    "steering",
    "hidrolik",
    "şanzıman",
    "sanziman",
    "vites",
    "gearbox",
    "devirlenmiyor",
    "vuruntu",
    "knock",
    "rölanti",
    "rolanti",
    "separatör",
    "separator",
    "titreme",
    "vibrasyon",
    "vibration",
    "karbonmonoksit",
    "carbon monoxide",
    "egzoz kokusu",
    "körük",
    "koruk",
    "bellows",
    "milky",
    "antisifon",
    "anti-siphon",
    "saildrive yağ",
    "lower unit",
    "halat",
    "şaft",
    "saft",
  ],
  seamanship: [
    "demir",
    "alarga",
    "tonoz",
    "colreg",
    "çatışma",
    "catisma",
    "seyir",
    "rota",
    "sığ",
    "siglik",
    "su çekimi",
    "su cekimi",
    "draft",
    "marina",
    "göcek",
    "gocek",
    "marmaris",
    "bodrum",
    "fethiye",
    "kaş",
    "kas",
    "datça",
    "datca",
    "didim",
    "finike",
    "kemer",
    "antalya",
    "adam denize",
    "man overboard",
    "can yeleği",
    "fog",
    "siste",
    "iskele",
    "sancak",
    "mooring",
    "anchor",
    "anchorage",
    "under keel",
    "dip payı",
    "dip payi",
    "yangın",
    "yangin",
    "fire",
    "karaya oturma",
    "grounding",
    "vhf",
    "mayday",
    "pan-pan",
    "su alma",
    "flooding",
    "sis işareti",
    "sis isareti",
    "fog signal",
  ],
};

interface Note {
  domain: Exclude<MarineDomain, "outside" | "weather">;
  keys: string[];
  tr: string;
  en: string;
  emergency?: boolean;
}

const NOTES: Note[] = [
  ...MACHINERY_NOTES,
  {
    domain: "seamanship",
    keys: ["demir", "alarga", "anchor", "anchorage", "tonoz"],
    tr: `## Seyir notu
- Demir yeri: Rüzgâr koyun açık ağzına doğru esiyorsa alarga açık sayılır. Tonoz varsa çapayı ona göre seç.
- Dip payı: Haritadaki derinliğin tekne su çekiminden en az 1,5 m fazla olması gerekir. Derinlik kaydı yoksa "kayıtta yok" de, uydurma.
- Zincir: Sert havada kısa kaloma demiri taratır. Kaloma, rüzgâr ve dip cinsine göre artar. Sayı uydurma.
- Kontrol: Demir tuttuktan sonra sabit bir kerahet (kerteriz) al. Kayma varsa motor hazır olsun.`,
    en: `## Seamanship note
- Anchorage: If the wind blows into the open mouth, the bay is exposed. Use a mooring buoy when one is there.
- Under-keel: Charted depth should exceed draft by at least 1.5 m. If depth is not on file, say so.
- Scope: Short scope drags in a blow. Scope grows with wind and bottom. Do not invent a length.
- Check: Take a transit after the anchor sets. Have the engine ready if the transit moves.`,
  },
  {
    domain: "seamanship",
    keys: ["colreg", "çatışma", "catisma", "sancak", "starboard", "sis", "siste", "fog", "çatışmayı önleme"],
    tr: `## Seyir notu
- Dar kanalda mümkün olduğunca sancağına yakın seyret.
- Karşıdan karşıya: ikisi de sancağa manevra eder.
- Kesişme: sancağındaki tekneye yol ver.
- Sınırlı görüşte sürat düşer ve sis işareti verilir.
- Manevra erken ve karşı tarafa belli olacak kadar belirgin olmalı.`,
    en: `## Seamanship note
- In a narrow channel, keep to starboard as far as is safe.
- Head-on: both alter to starboard.
- Crossing: give way to the vessel on your starboard side.
- In fog, slow down and sound the signal.
- The alteration should be early and large enough to be obvious.`,
  },
  {
    domain: "seamanship",
    keys: ["adam denize", "man overboard", "mob", "denize adam"],
    emergency: true,
    tr: `## Seyir notu
- Bağır, işaret et, bir kişi bakışı hiç kesmesin.
- Can simidini at. Pervaneden uzak dur.
- Tekneyi adama doğru yavaş ve kontrollü yaklaştır. İlk iş motoru tam yol kişiye sürmek değildir.
- VHF veya telefon ile yardım, kişi teknedeyken çağrılır; önce kişi gözden kaçmasın.`,
    en: `## Seamanship note
- Shout, point, and keep one person watching without looking away.
- Throw the lifebuoy. Stay clear of the propeller.
- Bring the boat back slowly. Do not drive full ahead at the person.
- Call for help once someone still has the person in sight.`,
  },
  {
    domain: "seamanship",
    keys: ["meltem", "etezyen", "etesian", "poyraz", "lodos"],
    tr: `## Seyir notu
- Yaz meltemi Ege'de çoğunlukla kuzeyli eser ve öğleden sonra sertleşir.
- Poyraz kuzeydoğudan, lodos güneybatıdan gelir. Koy seçimi rüzgârın ağza mı yoksa sırtın arkasına mı geldiğine bakar.
- Sayı için canlı hava ölçümü gerekir. Bu not rüzgâr hızı uydurmaz.`,
    en: `## Seamanship note
- The summer meltem in the Aegean is usually northerly and often freshens after noon.
- Poyraz is northeasterly, lodos southwesterly. A bay is chosen by whether that wind blows into the mouth or over the hill behind it.
- A speed needs a live weather reading. This note does not invent one.`,
  },
  {
    domain: "seamanship",
    keys: ["yangın", "yangin", "fire", "alev", "duman kokusu"],
    emergency: true,
    tr: `## Seyir notu
- Önce insanlar: herkes can yeleği, yangın battaniyesi / CO₂ / köpük — yakıt tipine uygun söndürücü.
- Elektrik yangınında akü şalterini kes (güvenliyse). Yakıt yangınında su ile büyütme.
- Motor odası kapalıysa kapağı açıp oksijen verme; sabit söndürme varsa onu kullan.
- Duman veya alev kontrol altına alınmıyorsa tekneyi terk planı hazır olsun; VHF Mayday.`,
    en: `## Seamanship note
- People first: lifejackets on, then the right extinguisher for the fuel type.
- For electrical fire, kill the battery switch if safe. Do not fight a fuel fire with water.
- Do not feed a closed engine-room fire with oxygen; use fixed extinguishing if fitted.
- If smoke or flame is not controlled, prepare to abandon and call Mayday on VHF.`,
  },
  {
    domain: "seamanship",
    keys: ["karaya oturma", "grounding", "oturduk", "sığlıkta kaldık", "siglikta kaldik"],
    emergency: true,
    tr: `## Seyir notu
- Motoru zorlama: pervane ve soğutma suyu hasar riski. Durumu sakin değerlendir.
- Gelgit / rüzgâr yönü tekneyi daha mı batırıyor yoksa kaldırıyor mu bak.
- Su alma kontrolü yap. Yaralı yoksa önce tekne bütünlüğü.
- Kendi gücünle çıkamıyorsan çekici / yardım çağır; yanlış çekiş omurgayı yorar.`,
    en: `## Seamanship note
- Do not thrash the engine: prop and cooling intake can be damaged. Assess calmly.
- Check whether tide or wind is setting you harder on, or lifting you off.
- Check for flooding. If no injuries, hull integrity comes next.
- If you cannot free yourself, call a tow; a bad pull can stress the keel.`,
  },
  {
    domain: "seamanship",
    keys: ["vhf", "mayday", "pan-pan", "secürite", "securite", "kanal 16"],
    tr: `## Seyir notu
- Kanal 16 dinlenir. Mayday: can tehlikesi. Pan-Pan: acil ama can tehlikesi yok. Sécurité: seyir uyarısı.
- Mesaj: kimlik, konum (enlem/boylam veya bilinen nokta), ne oldu, kaç kişi, ne yardım.
- Konum uydurma. Bilmiyorsan en yakın bilinen koy / marina adını söyle.`,
    en: `## Seamanship note
- Guard channel 16. Mayday: grave danger. Pan-Pan: urgent, no immediate life threat. Sécurité: safety warning.
- Message: who you are, where (lat/lng or a known place), what happened, how many souls, what help.
- Do not invent a position. If unsure, name the nearest known bay or marina.`,
  },
];

function isLetter(char: string): boolean {
  return /\p{L}/u.test(char);
}

/** Short ASCII tokens must be whole words so "sis" does not fire inside "tesisat", or "mob" inside "mobile". */
function allowsSuffix(key: string): boolean {
  return key.length >= 4 || /[^\u0000-\u007f]/u.test(key);
}

function keyHits(q: string, key: string): boolean {
  let from = 0;
  while (from <= q.length - key.length) {
    const at = q.indexOf(key, from);
    if (at < 0) return false;
    const beforeOk = at === 0 || !isLetter(q.charAt(at - 1));
    const after = q.charAt(at + key.length);
    const afterOk = after === "" || !isLetter(after) || allowsSuffix(key);
    if (beforeOk && afterOk) return true;
    from = at + 1;
  }
  return false;
}

export function classifyMarineDomain(text: string): MarineDomain {
  const lexical = lexicalDomain(text);
  if (lexical !== "outside") return lexical;
  return rankNotes(text)[0]?.domain ?? "outside";
}

function lexicalDomain(text: string): MarineDomain {
  const q = text.toLocaleLowerCase("tr");
  let best: MarineDomain = "outside";
  let score = 0;
  for (const domain of ["weather", "machinery", "seamanship"] as const) {
    const hits = LEXICON[domain].reduce((sum, word) => sum + (keyHits(q, word) ? word.length : 0), 0);
    if (hits > score) {
      score = hits;
      best = domain;
    }
  }
  return best;
}

export function offTopicReply(lang: "tr" | "en"): string {
  return lang === "tr"
    ? "THALVO AI yalnız üç konuda cevap verir: deniz ve seyir, makine, hava durumu. Bu soru o alanın dışında."
    : "THALVO AI answers only three subjects: seamanship, machinery, and weather. That question is outside those subjects.";
}

const ENGINE_CUE =
  /volvo|yanmar|mercury|yamaha|cummins|caterpillar|perkins|mtu|suzuki|honda|tohatsu|nanni|westerbeke|baudouin|mercruiser|saildrive|john deere|scania|steyr|kohler|beta marine/i;

/** A named brand or a long fault story is worth a model pass that must still follow the yard note. */
export function shouldTailorMachinery(text: string, domain: MarineDomain): boolean {
  if (domain !== "machinery") return false;
  if (text.trim().length > 90) return true;
  return ENGINE_CUE.test(text);
}

export function retrieveMarineNotes(text: string, lang: "tr" | "en"): string {
  const ranked = rankNotes(text).slice(0, 3);
  if (ranked.length === 0) return "";
  const header =
    lang === "tr"
      ? "Doğrulanmış usta notları. Bu sırayı esas al. Notta olmayan tork, parça kodu, basınç, kapasite veya arıza kodu yazma."
      : "Verified yard notes. Follow this order. Do not add torque, part numbers, pressures, capacities, or fault codes they omit.";
  const body = ranked.map((note) => (lang === "tr" ? note.tr : note.en)).join("\n\n");
  return `${header}\n\n${body}`;
}

export async function answerFromTraining(input: {
  text: string;
  lang: "tr" | "en";
  position: { lat: number; lng: number } | null;
}): Promise<{
  text: string;
  domain: MarineDomain;
  emergency: boolean;
  confident: boolean;
  weather: { alert: string; summaryTr: string; summaryEn: string } | null;
}> {
  const domain = classifyMarineDomain(input.text);
  if (domain === "outside") {
    return { text: offTopicReply(input.lang), domain, emergency: false, confident: true, weather: null };
  }
  if (domain === "weather") {
    const named = resolveNamedPlace(input.text);
    const place = named ?? (input.position ? { ...input.position, name: null as string | null } : null);
    if (!place) {
      const text =
        input.lang === "tr"
          ? "Hava için bir yer lazım. Göcek, Bodrum, Marmaris, Fethiye, Kaş veya Ege / Akdeniz diyebilirsin; ya da haritada konumunu aç."
          : "Weather needs a place. Name Göcek, Bodrum, Marmaris, Fethiye, Kaş, or Aegean / Mediterranean — or turn on your position.";
      return { text, domain, emergency: false, confident: true, weather: null };
    }
    try {
      const { fetchMarineWeather } = await import("./marine-weather");
      const report = await fetchMarineWeather(place.lat, place.lng);
      const label = "name" in place && typeof place.name === "string" ? place.name : null;
      return {
        text: formatWeather(report, input.lang, label),
        domain,
        emergency: report.alert === "storm" || report.alert === "gale",
        confident: true,
        weather: { alert: report.alert, summaryTr: report.summaryTr, summaryEn: report.summaryEn },
      };
    } catch {
      const text =
        input.lang === "tr"
          ? "Canlı hava ölçümü şu an gelmedi (Open-Meteo). Dalga yüksekliği uydurmam. Biraz sonra aynı yeri tekrar sor."
          : "The live weather reading did not arrive (Open-Meteo). I will not invent a wave height. Ask the same place again shortly.";
      return { text, domain, emergency: false, confident: true, weather: null };
    }
  }
  const note = rankNotes(input.text)[0] ?? null;
  if (!note) {
    const text =
      domain === "machinery"
        ? input.lang === "tr"
          ? "Makine için önce belirtiyi ayır. Marş basınca motor dönüyor mu, yoksa dönüp sönüyor mu? Hararet, yağ ikazı, yağın rengi, duman (beyaz / mavi / siyah), egzoz suyu, sintine, şanzıman veya vuruntu — hangisi? Plakadaki marka ve modeli yaz. Parça kodu ve tork uydurmam."
          : "For machinery, split the symptom first. When you press start, does it turn, or does it fire and die? Heat, oil light, oil colour, smoke (white / blue / black), exhaust water, bilge, gearbox, or a knock — which is it? Read the brand and model off the plate. I will not invent a part number or a torque."
        : input.lang === "tr"
          ? "Seyir için ne yapmak istediğini yaz: demir, çatışma kuralları, denize adam, yangın, karaya oturma veya VHF. Rüzgâr hızı ancak canlı ölçüden gelir."
          : "For seamanship, say what you need: anchoring, collision rules, man overboard, fire, grounding, or VHF. A wind speed comes only from a live reading.";
    return { text, domain, emergency: false, confident: false, weather: null };
  }
  return {
    text: input.lang === "tr" ? note.tr : note.en,
    domain,
    emergency: note.emergency === true,
    confident: true,
    weather: null,
  };
}

function scoreNote(q: string, note: Note): number {
  let hits = 0;
  let score = 0;
  for (const key of note.keys) {
    if (keyHits(q, key)) {
      hits += 1;
      score += key.length;
    }
  }
  if (hits === 0) return 0;
  return score + (hits - 1) * 12;
}

function rankNotes(text: string): Note[] {
  const q = text.toLocaleLowerCase("tr");
  return NOTES.map((note) => ({ note, score: scoreNote(q, note) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.note);
}

function formatWeather(
  report: {
    summaryTr: string;
    summaryEn: string;
  },
  lang: "tr" | "en",
  label: string | null,
): string {
  const body = lang === "tr" ? report.summaryTr : report.summaryEn;
  const where =
    label == null
      ? lang === "tr"
        ? "Bulunduğun nokta"
        : "Your position"
      : label;
  const source =
    lang === "tr"
      ? "Kaynak: Open-Meteo canlı ölçü (resmî MGİM bülteni değil)."
      : "Source: Open-Meteo live reading (not an official national bulletin).";
  return `${where}. ${body} ${source}`;
}
