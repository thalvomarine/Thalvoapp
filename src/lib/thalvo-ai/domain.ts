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
  {
    domain: "machinery",
    keys: ["hararet", "overheat", "ısındı", "isindi", "temperature", "hararet yaptı", "hararet yapti"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Motor soğutma suyunu yeterince alamıyor veya ısıyı denize atamıyor.
- Neden olabilir: Deniz suyu süzgeci tıkalı; impeller yırtık; kayış gevşek; ekzoz dirseği (mixing elbow) daralmış.
- Şimdi ne yap: Devri düşür. Hararet düşmezse motoru durdur. Sıcakken radyatör veya eşanjör kapağını açma. Tatlı su devresine deniz suyu karıştıysa ustaya bırak.
- Ne zaman usta çağır: Durdurmana rağmen ibre düşmüyorsa, beyaz buhar veya soğutma suyu kaçağı varsa.
- Marka notu: Parça kodu plakadaki model olmadan söylenmez. Volvo Penta, Yanmar ve dıştan takmalarda ilk bakılacak parça sezonluk impeller'dır.`,
    en: `## Plain-language report
- What is happening: The engine is not taking enough seawater, or it cannot dump the heat.
- What can cause it: Blocked seawater strainer, torn impeller, loose belt, or a narrowed mixing elbow.
- What to do now: Reduce rpm. Stop the engine if the temperature does not fall. Do not open a hot cooling cap.
- When to call a mechanic: The gauge stays high after shutdown, or you see steam or a cooling-water leak.
- Brand note: No part number without the plate. On Volvo Penta, Yanmar, and outboards the seasonal impeller is the first item to inspect.`,
  },
  {
    domain: "machinery",
    keys: ["yağ basıncı", "yag basinci", "oil pressure", "yağ ikaz", "yag ikaz"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Yağ basıncı düşünce yataklar yağsız kalır. Bu bir seyir arızası değil, motoru durdurma sebebidir.
- Neden olabilir: Yağ seviyesi düşük; yağ filtresi tıkalı; basınç müşiri arızalı; kaçak.
- Şimdi ne yap: Motoru hemen durdur. Seviyeyi motor soğuyunca kontrol et. Kaçak varsa üstüne basma ve kıvılcım çıkarma.
- Ne zaman usta çağır: Şimdi. Yağsız motoru tekrar çalıştırma.
- Marka notu: Müşir hatası ihtimali, düşük yağ ihtimalinden sonra gelir. Uydurma basınç değeri yok.`,
    en: `## Plain-language report
- What is happening: Low oil pressure starves the bearings. Stop the engine.
- What can cause it: Low oil level, a blocked filter, a faulty sender, or a leak.
- What to do now: Shut down now. Check the level only once it is cool. Keep sparks away from a leak.
- When to call a mechanic: Now. Do not restart an engine that ran without oil pressure.
- Brand note: A bad sender is considered after a real low level. No invented pressure figure.`,
  },
  {
    domain: "machinery",
    keys: ["çalışmıyor", "calismiyor", "marş", "mars basmıyor", "won't start", "wont start", "no start", "marş almıyor"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Motor dönmüyor ya da dönüp tutuşmuyor.
- Neden olabilir: Akü zayıf veya şalter kapalı; yakıt musluğu kapalı; yakıtta hava; stop ipleri veya güvenlik şalteri çekili.
- Şimdi ne yap: Akü şalterini, stop düğmesini ve yakıt vanasını kontrol et. Marş basarken tık yoksa akü ve kutup başıdır. Devir alıp sönüyorsa yakıtta hava olabilir.
- Ne zaman usta çağır: Kutuplar temiz ve yakıt açıkken hâlâ dönmüyorsa.
- Marka notu: Seri numarası veya arıza kodu uydurulmaz. Plakadaki marka ve modeli yaz.`,
    en: `## Plain-language report
- What is happening: The engine does not crank, or it cranks and does not fire.
- What can cause it: A weak battery or an open switch, a closed fuel valve, air in the fuel, or a kill switch left on.
- What to do now: Check the battery switch, stop button, and fuel valve. A click with no crank points at the battery. Crank then die points at air in the fuel.
- When to call a mechanic: It still will not turn with clean terminals and fuel open.
- Brand note: Do not invent a fault code. Read the brand and model off the plate.`,
  },
  {
    domain: "machinery",
    keys: ["impeller", "su atmıyor", "su atmiyor", "tell-tale", "soğutma suyu yok", "sogutma suyu yok"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Deniz suyu pompası basmıyor. Dıştan takmada kontrol deliğinden (tell-tale) su gelmez; içten takmada hararet bunu izler.
- Neden olabilir: Impeller kanatları kopmuş; süzgeç yosun tutmuş; termostat kapalı kalmış.
- Şimdi ne yap: Motoru yükte çalıştırmaya devam etme. Sezon başı impeller kontrolü standart bakımdır. Kopan kanat eşanjörde kalmış olabilir.
- Ne zaman usta çağır: Impeller değişince de su gelmiyorsa.
- Marka notu: Kanat sayısı modele göredir. Plakasız parça kodu yok.`,
    en: `## Plain-language report
- What is happening: The seawater pump is not pumping. On an outboard the tell-tale goes dry; on an inboard the temperature follows.
- What can cause it: A shredded impeller, a fouled strainer, or a thermostat stuck shut.
- What to do now: Do not keep it under load. Checking the impeller at the start of the season is normal service. Broken vanes can sit in the heat exchanger.
- When to call a mechanic: Still no water after a new impeller.
- Brand note: Vane count depends on the model. No part number without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["duman", "smoke", "beyaz duman", "siyah duman", "mavi duman"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Egzoz dumanının rengi yanma veya soğutma hakkında ipucu verir. Tek başına teşhis değildir.
- Neden olabilir: Beyaz ve sürekli duman soğutma suyunun egzoza kaçması olabilir. Siyah duman fazla yakıt veya tıkalı hava filtresi. Mavi duman yağ yakımı.
- Şimdi ne yap: Yükü azalt. Beyaz duman hararetle birlikteyse motoru durdur. Yakıt kaçağının yanında çıplak alev veya kıvılcım yok.
- Ne zaman usta çağır: Renk yük kalkınca geçmiyorsa veya su kaçağı şüphesi varsa.
- Marka notu: Enjektör kodu veya kompresyon değeri uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Exhaust colour is a clue, not a diagnosis by itself.
- What can cause it: Continuous white smoke can be cooling water in the exhaust. Black smoke is excess fuel or a choked air filter. Blue smoke is oil.
- What to do now: Reduce load. If white smoke comes with overheating, stop. No flame or spark near a fuel leak.
- When to call a mechanic: The colour stays after you ease off, or you suspect water in the engine.
- Brand note: No invented injector code or compression figure.`,
  },
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
    keys: ["colreg", "çatışma", "catisma", "sancak", "starboard", "sis", "fog", "çatışmayı önleme"],
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
    domain: "machinery",
    keys: ["akü", "aku", "battery", "şarj etmiyor", "sarj etmiyor", "voltaj düşük", "12v"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Elektrik sistemi gerilim tutmuyor veya marş için yeterli güç vermiyor.
- Neden olabilir: Akü yaşlanmış; kutup başı oksitli; alternatör kayışı gevşek; kaçak yük (buzdolabı, inverter) geceyi boşaltmış.
- Şimdi ne yap: Voltajı ölç (motor kapalı ~12,4 V ve üstü iyi). Kutupları temizle. Motor çalışırken şarj ~13,5–14,5 V bandında olmalı — kesin sayı plakaya ve regülatöre bağlıdır, uydurma.
- Ne zaman usta çağır: Motor çalışırken gerilim yükselmiyorsa veya akü şişmiş/kokuyorsa.
- Marka notu: AGM / jel / ıslak tip farklı şarj ister. Tip plakasız tahmin edilmez.`,
    en: `## Plain-language report
- What is happening: The electrical system will not hold voltage, or it will not crank.
- What can cause it: An aged battery, oxidised terminals, a loose alternator belt, or a parasitic load overnight.
- What to do now: Measure voltage (engine off, about 12.4 V and up is healthy). Clean the posts. Running charge is often ~13.5–14.5 V — exact band depends on the regulator; do not invent a figure.
- When to call a mechanic: Voltage does not rise with the engine, or the battery is swollen or smells.
- Brand note: AGM, gel, and flooded need different charge profiles. Do not guess the type off the plate.`,
  },
  {
    domain: "machinery",
    keys: ["sintine", "bilge", "su alma", "flooding", "tekne su alıyor", "tekne su aliyor"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Gövdeye veya sintineye su giriyor. Bu makine arızasından önce emniyet işidir.
- Neden olabilir: Sintine pompası çalışmıyor; hortum/kelepçe kaçırıyor; shaft packing / stuffing box; açık deniz suyu vanası; gövde çatlağı.
- Şimdi ne yap: Pompayı aç, yedek pompa varsa kullan. Deniz suyu vanalarını bilinen sızıntı hattında kapat. Can yeleği hazır tut. Su yükseliyorsa VHF / telefon ile yardım iste.
- Ne zaman usta çağır: Pompa yetişmiyorsa veya kaynak bulunamıyorsa — şimdi.
- Marka notu: Kaçak yeri görmeden parça uydurma.`,
    en: `## Plain-language report
- What is happening: Water is entering the hull or bilge. Safety before diagnosis.
- What can cause it: A dead bilge pump, a hose clamp, stuffing box, an open seacock, or a hull breach.
- What to do now: Run the pump and any spare. Close seacocks on the known leak line. Keep lifejackets ready. Call for help if the water is winning.
- When to call a mechanic: The pump cannot keep up, or you cannot find the source — now.
- Brand note: Do not invent a part before you see the leak.`,
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
  {
    domain: "machinery",
    keys: ["dümen", "dumen", "steering", "direksiyon boş", "hidrolik dümen"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Dümen cevapsız veya aşırı boş. Trafikte bu acildir.
- Neden olabilir: Hidrolik kaçak / seviye düşük; kablo kopuk; otolota / autopilot kavraması; dümen yekesi / quadrant.
- Şimdi ne yap: Sürati düşür. Trafikten uzaklaş. Yedek dümen (tiller / emergency steering) varsa hazırla. Yakıt kaçağı gibi hidrolik yağı varsa kıvılcım yok.
- Ne zaman usta çağır: Yedek dümenle limana dönemiyorsan — şimdi yardım iste.
- Marka notu: Hidrolik yağ tipi plakasız söylenmez.`,
    en: `## Plain-language report
- What is happening: Steering is dead or dangerously loose. In traffic this is an emergency.
- What can cause it: Hydraulic leak or low fluid, a parted cable, autopilot clutch, or quadrant failure.
- What to do now: Slow down. Get clear of traffic. Rig emergency steering if fitted. No sparks near hydraulic oil mistreated as a fuel hazard.
- When to call a mechanic: If you cannot make harbour on emergency steering — call help now.
- Brand note: Do not invent the hydraulic fluid type off the plate.`,
  },
];

export function classifyMarineDomain(text: string): MarineDomain {
  const q = text.toLocaleLowerCase("tr");
  let best: MarineDomain = "outside";
  let score = 0;
  for (const domain of ["weather", "machinery", "seamanship"] as const) {
    const hits = LEXICON[domain].reduce((sum, word) => sum + (q.includes(word) ? word.length : 0), 0);
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

export function retrieveMarineNotes(text: string, lang: "tr" | "en"): string {
  const note = matchNote(text);
  if (!note) return "";
  return lang === "tr" ? note.tr : note.en;
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
  const note = matchNote(input.text);
  if (!note) {
    const text =
      domain === "machinery"
        ? input.lang === "tr"
          ? "Makine için belirtiyi yaz: hararet, yağ basıncı, marş, su atmama, duman rengi, akü veya sintine. Plakadaki marka ve modeli ekle. Parça kodu uydurmam."
          : "For machinery, name the symptom: overheating, oil pressure, no start, no tell-tale, smoke colour, battery, or bilge. Add the brand and model from the plate. I will not invent a part number."
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

function matchNote(text: string): Note | null {
  const q = text.toLocaleLowerCase("tr");
  let best: Note | null = null;
  let score = 0;
  for (const note of NOTES) {
    const hits = note.keys.reduce((sum, key) => sum + (q.includes(key) ? key.length : 0), 0);
    if (hits > score) {
      score = hits;
      best = note;
    }
  }
  return best;
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
