/**
 * Yard-mechanic field notes for THALVO AI.
 * Order of checks a captain can do on deck. Not a workshop manual:
 * no torque, part numbers, fault codes, or invented pressures.
 * More specific notes stay above the generic one for the same symptom.
 */

export interface MachineryNote {
  domain: "machinery";
  keys: string[];
  tr: string;
  en: string;
  emergency?: boolean;
}

export const MACHINERY_NOTES: MachineryNote[] = [
  {
    domain: "machinery",
    keys: [
      "yüksek devirde hararet",
      "yuksek devirde hararet",
      "yükte hararet",
      "yukte hararet",
      "egzozdan az su",
      "egzoz suyu az",
      "sadece yükte ısınıyor",
      "overheats under load",
      "little water at the exhaust",
    ],
    tr: `## Sade Dil Raporu
- Ne oluyor: Rölantide idare eden soğutma, yükte yetmiyor. Pompa debisi düşünce veya egzoz yolu daralınca ısı denizde kalır.
- Neden olabilir: Impeller kanadı eksik; deniz suyu süzgeci yarı tıkalı; egzoz dirseği (mixing elbow) içi daralmış.
- Şimdi ne yap: Devri, suyun düzenli geldiği banda indir. İbre inmezse durdur. Sıcakken tatlı su kapağını açma.
- Olduğunu nasıl anlarsın: Aynı devirde egzoz suyu kesilmeden akar ve ibre orada kalır.
- Bunu ayırt etmek için: Rölantide egzozdan su bol mu, yoksa o da zayıf mı?
- Ne zaman usta çağır: Temiz süzgeç ve yeni impeller'dan sonra yükte yine yükseliyorsa. Dirsek ve eşanjör açmak usta işidir.
- Marka notu: Kanat sayısı modele göredir. Volvo Penta, Yanmar ve dıştan takmada plakasız parça kodu yok.`,
    en: `## Plain-language report
- What is happening: Cooling that copes at idle fails under load. Low pump flow or a narrowed exhaust path leaves the heat aboard.
- What can cause it: A missing impeller vane, a half-blocked seawater strainer, or a narrowed mixing elbow.
- What to do now: Drop to the rpm where water still flows steadily. Stop if the gauge does not fall. Do not open a hot freshwater cap.
- How you know it worked: At that same rpm the exhaust water does not break and the gauge stays put.
- One question to split the fault: Is exhaust water strong at idle, or weak there too?
- When to call a mechanic: It still climbs under load after a clean strainer and a new impeller. The elbow and heat exchanger are workshop work.
- Brand note: Vane count depends on the model. No part number off the plate on Volvo Penta, Yanmar, or an outboard.`,
  },
  {
    domain: "machinery",
    keys: ["hararet", "overheat", "ısındı", "isindi", "temperature", "hararet yaptı", "hararet yapti"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Motor soğutma suyunu yeterince alamıyor veya ısıyı denize atamıyor.
- Neden olabilir: Deniz suyu süzgeci tıkalı; impeller yırtık; kayış gevşek. Eşanjör kireci ve egzoz dirseği bunlardan sonra gelir.
- Şimdi ne yap: Devri düşür. Hararet düşmezse motoru durdur. Sıcakken kapağı açma. Süzgeci ancak motor durunca ve deniz suyu vanası kapalıyken aç; iş bitince vanayı yine aç.
- Olduğunu nasıl anlarsın: İçten takmada egzozdan, dıştan takmada tell-tale'den düzenli su gelir ve ibre yavaş iner.
- Bunu ayırt etmek için: Su her devirde mi yok, yoksa yalnız yükte mi azalıyor?
- Ne zaman usta çağır: Durdurmana rağmen ibre düşmüyorsa, beyaz buhar varsa, veya tatlı suya deniz suyu karıştıysa.
- Marka notu: Parça kodu plakadaki model olmadan söylenmez. Volvo Penta, Yanmar ve dıştan takmalarda ilk bakılan parça sezonluk impeller'dır. Kopan kanat eşanjörde kalabilir.`,
    en: `## Plain-language report
- What is happening: The engine is not taking enough seawater, or it cannot dump the heat.
- What can cause it: Blocked seawater strainer, torn impeller, loose belt. Scale and a narrowed mixing elbow come after those.
- What to do now: Reduce rpm. Stop if the temperature does not fall. Do not open a hot cap. Open the strainer only with the engine stopped and the seacock shut; open the seacock again when you finish.
- How you know it worked: Steady water at the exhaust (inboard) or the tell-tale (outboard), and the gauge eases down.
- One question to split the fault: Is the water missing at every rpm, or only under load?
- When to call a mechanic: The gauge stays high after shutdown, you see steam, or seawater has entered the freshwater side.
- Brand note: No part number without the plate. On Volvo Penta, Yanmar, and outboards the seasonal impeller is the first item. Broken vanes can sit in the heat exchanger.`,
  },
  {
    domain: "machinery",
    keys: ["yağ süt", "yag sut", "yağ mayonez", "yag mayonez", "süt gibi yağ", "milky oil", "oil looks like milk", "mayonnaise"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Yağ süt veya mayonez gibi olduysa su yağa karışmıştır. Yataklar bu yağla dönmez.
- Neden olabilir: Eşanjör veya yağ soğutucusu delinmiş; kapak contası. Hangisi olduğu çubuktan anlaşılmaz.
- Şimdi ne yap: Motoru durdur. Tekrar çalıştırarak "bir bakayım" deme. Seviye çubuğunu ancak soğuyunca kontrol et. Yakıt ve yağ kaçağının yanında kıvılcım yok.
- Olduğunu nasıl anlarsın: Çubukta krema görüntüsü varsa teşhis tamamdır. Temiz yağ ancak kaçağın yeri bulununca konur.
- Bunu ayırt etmek için: Bu görüntü hararet veya egzozdan beyaz buharla birlikte mi geldi?
- Ne zaman usta çağır: Şimdi. Su ile yağ karışmış motoru limana kendi gücüyle zorlama.
- Marka notu: Conta veya soğutucu kodu plakasız söylenmez. Basınç sayısı uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Oil that looks like milk or mayonnaise has water in it. Bearings cannot run on that.
- What can cause it: A holed heat exchanger or oil cooler, or a head gasket. The dipstick does not say which.
- What to do now: Stop. Do not restart "just to see". Read the dipstick only once it is cool. No sparks near oil or fuel.
- How you know it worked: Cream on the stick is the finding. Fresh oil goes in only after the leak is found.
- One question to split the fault: Did this show up with overheating or white steam at the exhaust?
- When to call a mechanic: Now. Do not push a watered engine to harbour on its own power.
- Brand note: No gasket or cooler code without the plate. No invented pressure.`,
  },
  {
    domain: "machinery",
    keys: ["yağ basıncı", "yag basinci", "oil pressure", "yağ ikaz", "yag ikaz"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Yağ basıncı düşünce yataklar yağsız kalır. Bu seyir arızası değil, motoru durdurma sebebidir.
- Neden olabilir: Seviye düşük; filtre tıkalı; kaçak. Müşir arızası ancak yağ gerçekten yerindeyse düşünülür.
- Şimdi ne yap: Motoru hemen durdur. Seviyeyi soğuyunca bak. Kaçak varsa üstüne basma ve kıvılcım çıkarma. Yağsız motoru tekrar çalıştırma.
- Olduğunu nasıl anlarsın: Soğukken çubukta seviye varsa ve kaçak yoksa bir sonraki adım usta ölçümüdür. Çalıştırarak ikazın sönmesini bekleme.
- Bunu ayırt etmek için: İkaz kalkışta bir saniye yanıp sönüyor mu, yoksa devirliyken de sönmüyor mu?
- Ne zaman usta çağır: Şimdi.
- Marka notu: Uydurma basınç değeri yok. Müşir, seviye kontrolünden sonra gelir.`,
    en: `## Plain-language report
- What is happening: Low oil pressure starves the bearings. Stop the engine. This is not a fault to cruise with.
- What can cause it: Low level, a blocked filter, or a leak. A bad sender is considered only after the oil is really there.
- What to do now: Shut down now. Check the level once it is cool. No sparks on a leak. Do not restart an engine that ran without oil pressure.
- How you know it worked: Level on the stick when cool, and no leak, still means the next reading is the mechanic's. Do not crank hoping the lamp goes out.
- One question to split the fault: Does the lamp flash for a second at start and then go out, or does it stay on while running?
- When to call a mechanic: Now.
- Brand note: No invented pressure figure. The sender comes after the level check.`,
  },
  {
    domain: "machinery",
    keys: [
      "çalışıp sönüyor",
      "calisip sonuyor",
      "basıp sönüyor",
      "basip sonuyor",
      "hava yapmış",
      "hava yapmis",
      "yakıtta hava",
      "yakitta hava",
      "starts then dies",
      "cranks and dies",
    ],
    tr: `## Sade Dil Raporu
- Ne oluyor: Motor dönüyor, tutuşuyor, sonra sönüyor. Çoğu zaman yakıt hattı hava yapmıştır.
- Neden olabilir: Filtre lastiği veya hortum kelepçesi hava emiyor; depo boşalıyor; separatör kapağı gevşek.
- Şimdi ne yap: Depodaki yakıtı ve vanayı kontrol et. Kelepçeleri elle yokla. Lift pompası varsa kolu elle bas; kabarcık bitene kadar. Hava alma vidasının yeri modele göre değişir, uydurma. Yakıtın yanında çıplak alev yok.
- Olduğunu nasıl anlarsın: Filtre kabından köpüksüz yakıt gelir ve motor rölantide sönmeden kalır.
- Bunu ayırt etmek için: Sönmeden hemen önce devir dalgalanıyor mu, yoksa yağ veya hararet ikazı mı yanıyor?
- Ne zaman usta çağır: Hava alındıktan sonra yükte yine sönüyorsa. Enjektör ve pompa ayarı güverte işi değildir.
- Marka notu: Volvo Penta ve Yanmar'da hava çoğu zaman filtre kapağı veya besleme hortumundandır. Parça kodu plakasız yok.`,
    en: `## Plain-language report
- What is happening: It cranks, fires, then dies. The fuel line has usually taken air.
- What can cause it: A filter seal or hose clamp pulling air, an empty tank, or a loose separator lid.
- What to do now: Check the tank and the valve. Feel the clamps. If there is a lift-pump lever, pump until the bubbles stop. Bleed-screw location depends on the model — do not invent it. No naked flame near fuel.
- How you know it worked: Clear fuel, no foam, leaves the filter bowl and the engine holds idle.
- One question to split the fault: Did rpm surge just before it died, or did an oil or heat lamp come on?
- When to call a mechanic: It dies again under load after bleeding. Injectors and the injection pump are not deck work.
- Brand note: On Volvo Penta and Yanmar the air is often at the filter lid or the feed hose. No part number without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["yakıtta su", "yakitta su", "separatör", "separator", "su kabı dolu", "water in the fuel", "fuel bowl"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Separatör kabında su, yakıttan ağır durur ve önce oraya çöker. Motor hava yapmış gibi tekleyebilir.
- Neden olabilir: İstasyondan su; tank havalandırmasından giren yağmur; eski filtrenin dolması.
- Şimdi ne yap: Motoru durdur. Alt tahliye vidasını bir kaba alarak su bitip yakıt gelene kadar boşalt. Sonra havayı al. Döktüğün suyu denize verme. Yakıtın yanında kıvılcım yok.
- Olduğunu nasıl anlarsın: Kaptan önce su, sonra berrak yakıt gelir ve motor yükte teklemeyi keser.
- Bunu ayırt etmek için: Su kabın dibinde mi duruyor, yoksa yakıtın kendisi bulanık mı?
- Ne zaman usta çağır: Birkaç kez su geliyorsa tankın kendisi su alıyordur.
- Marka notu: Filtre elemanı kodu plakadaki modele göredir. Kod uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Water is heavier than fuel and settles in the separator first. The engine can stumble as if it had air.
- What can cause it: A wet fill at the pump, rain down the tank vent, or a separator that is due.
- What to do now: Stop. Drain the bottom screw into a jug until water stops and fuel comes. Then bleed the air. Do not dump that water over the side. No sparks near fuel.
- How you know it worked: The jug shows water first, then clear fuel, and the stumble under load stops.
- One question to split the fault: Is the water sitting at the bottom, or is the fuel itself cloudy?
- When to call a mechanic: Water keeps returning. The tank itself is then taking water.
- Brand note: The element code depends on the plate. Do not invent it.`,
  },
  {
    domain: "machinery",
    keys: ["çalışmıyor", "calismiyor", "marş", "mars basmıyor", "won't start", "wont start", "no start", "marş almıyor", "mars almiyor"],
    tr: `## Sade Dil Raporu
- Ne oluyor: İki ayrı arıza vardır. Ya marş motoru döndürmüyor, ya da dönüyor ama tutuşmuyor.
- Neden olabilir: Dönmüyorsa akü, şalter, kutup başı veya güvenlik şalteri. Dönüp tutuşmuyorsa yakıt vanası, stop, veya yakıtta hava.
- Şimdi ne yap: Akü şalterini, stop düğmesini ve yakıt vanasını kontrol et. Marşta yalnız tık varsa kutup ve aküdür. Devir alıp sönüyorsa yakıt hattına bak.
- Olduğunu nasıl anlarsın: Dönmeme, kutup temizlenince marşın çevirmesiyle ayrılır. Tutuşmama, yakıt gelince ilk patlama ile ayrılır.
- Bunu ayırt etmek için: Marş basınca motor dönüyor mu, yoksa yalnız tık mı var?
- Ne zaman usta çağır: Kutuplar temiz, yakıt açık ve yine de ne dönüyor ne tutuşuyorsa.
- Marka notu: Seri numarası veya arıza kodu uydurulmaz. Plakadaki marka ve modeli yaz.`,
    en: `## Plain-language report
- What is happening: Two different faults. Either the starter does not turn the engine, or it turns and does not fire.
- What can cause it: No crank points at the battery, switch, terminals, or a kill lanyard. Crank with no fire points at the fuel valve, stop control, or air in the fuel.
- What to do now: Check the battery switch, stop button, and fuel valve. A click and no crank is the battery and posts. Crank then die points at the fuel line.
- How you know it worked: No-crank is solved when clean posts let it turn. No-fire is solved at the first firing once fuel arrives.
- One question to split the fault: When you press start, does the engine turn, or is there only a click?
- When to call a mechanic: Clean terminals, fuel open, and it still neither turns nor fires.
- Brand note: Do not invent a fault code. Read the brand and model off the plate.`,
  },
  {
    domain: "machinery",
    keys: ["impeller", "su atmıyor", "su atmiyor", "tell-tale", "soğutma suyu yok", "sogutma suyu yok", "egzozdan su gelmiyor"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Deniz suyu pompası basmıyor. Dıştan takmada tell-tale kurur; içten takmada egzozdan su kesilir, hararet bunu izler.
- Neden olabilir: Impeller kanatları kopmuş; süzgeç yosun tutmuş; termostat kapalı kalmış.
- Şimdi ne yap: Yükte çalıştırmaya devam etme. Sezon başı impeller kontrolü normal bakımdır. Kopan kanat eşanjörde veya dirsekte kalmış olabilir; sadece pompayı değiştirip bırakma.
- Olduğunu nasıl anlarsın: Tell-tale veya egzoz suyu, rölantide düzenli ve kesintisiz gelir.
- Bunu ayırt etmek için: Su hiç mi yok, yoksa var ama ince bir sızıntı mı?
- Ne zaman usta çağır: Yeni impeller'dan sonra da su gelmiyorsa.
- Marka notu: Kanat sayısı modele göredir. Plakasız parça kodu yok.`,
    en: `## Plain-language report
- What is happening: The seawater pump is not pumping. On an outboard the tell-tale goes dry; on an inboard the exhaust water stops and the temperature follows.
- What can cause it: A shredded impeller, a fouled strainer, or a thermostat stuck shut.
- What to do now: Do not keep it under load. An impeller check at the start of the season is normal service. Broken vanes can lodge in the exchanger or the elbow; do not only swap the pump and leave them.
- How you know it worked: Tell-tale or exhaust water runs steady at idle, without breaks.
- One question to split the fault: Is there no water at all, or only a thin trickle?
- When to call a mechanic: Still no water after a new impeller.
- Brand note: Vane count depends on the model. No part number without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["egzoz kokusu", "karbonmonoksit", "carbon monoxide", "kamara egzoz", "exhaust smell in the cabin", "co alarm"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Kamarada egzoz kokusu karbonmonoksit şüphesidir. Bu bir koku şikâyeti değil, insanı dışarı çıkarma sebebidir.
- Neden olabilir: Egzoz hortumu veya dirsek kaçırıyor; rüzgâr kokuyu kıça basıyor; ıslak egzoz susturucusu tıkalı.
- Şimdi ne yap: Herkesi açık havaya çıkar. Motoru durdur. Kamarayı rüzgâra aç. İçeride uyuyan var mı bak. Kokuyu "birazdan dağılır" diye bekleme.
- Olduğunu nasıl anlarsın: İnsanlar dışarıda ve alarm veya koku içeride kesilmiş. Kaynak bulunmadan kamarada yatılmaz.
- Bunu ayırt etmek için: Koku kıç güvertede de var mı, yoksa yalnız kapalı kamara mı?
- Ne zaman usta çağır: Şimdi. Hortum, kelepçe ve dirsek kaçakları çalışır motorun yanında aranmaz.
- Marka notu: Dedektör eşik değeri veya hortum kodu uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Exhaust smell in a cabin is a carbon-monoxide alarm. Get people out. It is not a comfort complaint.
- What can cause it: A leaking exhaust hose or elbow, wind pushing the gas aboard, or a blocked wet muffler.
- What to do now: Everyone into the open air. Stop the engine. Open the cabin to the wind. Check anyone who was asleep. Do not wait for it to "clear".
- How you know it worked: People are outside and the alarm or the smell inside has stopped. Nobody sleeps aboard until the source is found.
- One question to split the fault: Is the smell on the aft deck as well, or only in the closed cabin?
- When to call a mechanic: Now. Hose, clamp, and elbow leaks are not hunted beside a running engine.
- Brand note: Do not invent a detector threshold or a hose code.`,
  },
  {
    domain: "machinery",
    keys: ["duman", "smoke", "beyaz duman", "siyah duman", "mavi duman", "white smoke", "black smoke", "blue smoke"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Egzoz renginin rengi ipucudur, tek başına teşhis değildir. İlk kalkışta kısa beyaz duman çoğu zaman yoğuşmadır; yükte süren beyaz duman başka şeydir.
- Neden olabilir: Sürekli beyaz, özellikle hararetle, soğutma suyunun egzoza kaçması olabilir. Siyah duman fazla yakıt, kirli hava filtresi veya yükün pervaneyi boğması. Mavi duman yağ yakımı.
- Şimdi ne yap: Yükü azalt. Beyaz duman hararetle birlikteyse motoru durdur. Yakıt kaçağının yanında çıplak alev yok.
- Olduğunu nasıl anlarsın: Yoğuşma bir iki dakika içinde açılır. Renk yük kalkınca da kalıyorsa not düş ve zorlama.
- Bunu ayırt etmek için: Renk yalnız ilk çalıştırmada mı, yoksa ısınınca da sürüyor mu?
- Ne zaman usta çağır: Renk geçmiyorsa veya suyun yağa karıştığından şüphe varsa.
- Marka notu: Enjektör kodu veya kompresyon değeri uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Exhaust colour is a clue, not a diagnosis. A short white puff at first start is often condensate. White smoke that stays under load is not.
- What can cause it: Continuous white smoke, especially with heat, can be cooling water in the exhaust. Black smoke is excess fuel, a dirty air filter, or a prop the engine cannot turn. Blue smoke is oil.
- What to do now: Reduce load. If white smoke comes with overheating, stop. No flame near a fuel leak.
- How you know it worked: Condensate clears in a minute or two. If the colour stays after you ease off, note it and do not press on.
- One question to split the fault: Is the colour only at first start, or does it stay once the engine is warm?
- When to call a mechanic: The colour stays, or you suspect water in the oil.
- Brand note: No invented injector code or compression figure.`,
  },
  {
    domain: "machinery",
    keys: ["vuruntu", "metal sesi", "knock", "knocking", "rod knock"],
    emergency: true,
    tr: `## Sade Dil Raporu
- Ne oluyor: Metalik vuruntu, yatak veya piston sesi olabilir. Enjektör tıkırtısı daha ince ve ritmiktir; ayırmak için motoru zorlamaya değmez.
- Neden olabilir: Yağsız yatak; gevşek montaj ayağı; sert yanma. İlk ihtimal en pahalısıdır ve en hızlı durdurulandır.
- Şimdi ne yap: Devri hemen düşür ve motoru durdur. Ses "geçer mi" diye gaz verme.
- Olduğunu nasıl anlarsın: Durunca ses kesilir. Tekrar çalışınca aynı vuruş varsa o motor seyir motoru değildir.
- Bunu ayırt etmek için: Ses devir yükseldikçe mi artıyor, yoksa yalnız rölantide mi?
- Ne zaman usta çağır: Şimdi. Kulağa göre yatak ayırmak güverte işi değildir.
- Marka notu: Boşluk veya tork değeri uydurulmaz.`,
    en: `## Plain-language report
- What is happening: A metallic knock can be a bearing or a piston. Injector clatter is lighter and rhythmic. Do not load the engine to decide which.
- What can cause it: A bearing without oil, a loose mount, or hard combustion. The first is the expensive one and the one you stop for.
- What to do now: Drop rpm at once and stop. Do not add throttle to see if it goes away.
- How you know it worked: The noise stops with the engine. If the same knock is there on the next start, this is not an engine to cruise.
- One question to split the fault: Does it grow as rpm rises, or is it only at idle?
- When to call a mechanic: Now. Splitting a bearing by ear is not deck work.
- Brand note: Do not invent a clearance or a torque.`,
  },
  {
    domain: "machinery",
    keys: [
      "devirlenmiyor",
      "devire çıkmıyor",
      "devire cikmiyor",
      "won't reach rpm",
      "pervane yosun",
      "pervane kirli",
      "fouled prop",
      "yükte bayılıyor",
      "yukte bayiliyor",
      "pervaneye halat",
      "halat dolandı",
      "halat dolandi",
      "rope around the prop",
      "rope on the prop",
    ],
    tr: `## Sade Dil Raporu
- Ne oluyor: Motor bağırıyor ama tekne devrine çıkmıyor. Çoğu zaman pervane yosun, halat veya eğilmiş kanat yüzünden ağırdır.
- Neden olabilir: Kirli veya hasarlı pervane; halat şaftta; tekne aşırı yüklü. Yakıt veya turbo bundan sonra gelir.
- Şimdi ne yap: Gazı, duman ve hararet olmadan tutabildiğin devirde bırak. Şaftta halat varsa vites boşa, motor stop, pervane durunca bak. Döner şafta el uzatma.
- Olduğunu nasıl anlarsın: Pervane temizlenince aynı gazda devir yerine gelir ve siyah duman kesilir.
- Bunu ayırt etmek için: Boş viteste devir alıyor mu, yoksa boşta da mı kesiyor?
- Ne zaman usta çağır: Boşta da devir almıyorsa, veya kanat eğildiyse. Şaftı eğmek için zorlama.
- Marka notu: Pitch ve pervane kodu plakasız söylenmez.`,
    en: `## Plain-language report
- What is happening: The engine labours and will not make rpm. The prop is often heavy with weed, a rope, or a bent blade.
- What can cause it: A fouled or damaged prop, rope on the shaft, or a boat that is overloaded. Fuel and the turbo come after that.
- What to do now: Hold the throttle where it will run without smoke or heat. If rope is on the shaft: neutral, stop, look only once the prop has stopped. Never reach for a spinning shaft.
- How you know it worked: After the prop is clean, the same throttle makes rpm again and the black smoke stops.
- One question to split the fault: Does it reach rpm in neutral, or does it fall short even with no load?
- When to call a mechanic: It will not rev in neutral either, or a blade is bent. Do not force a bent shaft.
- Brand note: Do not invent pitch or a prop code without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["titreme", "vibrasyon", "vibration", "motor titriyor", "engine vibrates"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Titreme ya pervaneden ya şafttan ya da motor ayağından gelir. Tek başına yatak teşhisi değildir.
- Neden olabilir: Eğilmiş pervane kanadı; şaftta halat veya ot; gevşek motor ayağı. Kesik yatağı (cutlass) ancak bunlar elendikten sonra.
- Şimdi ne yap: Titremenin başladığı devirden aşağı in. Metalik vuruntu da varsa motoru durdur. Halat için şaft ancak durunca kontrol edilir.
- Olduğunu nasıl anlarsın: O devirde tekne ve dümen dolabı sakinler.
- Bunu ayırt etmek için: Titreme boş viteste de var mı, yoksa yalnız yükte mi?
- Ne zaman usta çağır: Ayaklar sağlam ve pervane temizken sürüyorsa. Şaft hizası güverte işi değildir.
- Marka notu: Ayak kodu ve hiza ölçüsü uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Vibration comes from the prop, the shaft, or an engine mount. It is not a bearing diagnosis by itself.
- What can cause it: A bent blade, rope or weed on the shaft, or a loose mount. The cutlass bearing comes after those are ruled out.
- What to do now: Stay below the rpm where it starts. If there is also a metallic knock, stop. Check for rope only after the shaft has stopped.
- How you know it worked: At that rpm the boat and the wheel go quiet.
- One question to split the fault: Is the vibration there in neutral, or only under load?
- When to call a mechanic: Mounts are sound, the prop is clean, and it still shakes. Shaft alignment is not deck work.
- Brand note: Do not invent a mount code or an alignment figure.`,
  },
  {
    domain: "machinery",
    keys: [
      "şanzıman",
      "sanziman",
      "vitese geçmiyor",
      "vitese gecmiyor",
      "vites kayıyor",
      "vites kayiyor",
      "won't go into gear",
      "gearbox",
      "gear slips",
    ],
    tr: `## Sade Dil Raporu
- Ne oluyor: Vites geçmiyor veya yükte kayıyorsa ya kumanda yolu ya kavramadır. Şanzımanı zorlayarak "oturtturmak" diski yakar.
- Neden olabilir: Kumanda teli ayarsız veya kopuk; yağ seviyesi düşük; saildrive veya şanzıman kavraması aşınmış.
- Şimdi ne yap: Motor rölantideyken vitese al. Geçmiyorsa gaz verme. Seviyeyi motor stop ve düz teknede, çubuğun kendi işaretinden bak. Yağ tipi plakada yazar; tahmin etme. Telin kola geldiği yeri elle yokla.
- Olduğunu nasıl anlarsın: Rölantide net bir geçiş olur ve yükte devir kaçar gibi yükselmez.
- Bunu ayırt etmek için: Kol sonuna kadar gidiyor mu, yoksa yarı yolda boş mu boşalıyor?
- Ne zaman usta çağır: Seviye tamam, tel kolu çekiyor ve yine kayıyorsa. Kavrama ve damper plaka usta işidir.
- Marka notu: Volvo Penta saildrive ile şaft şanzımanı aynı yağ değildir. Tip plakasız söylenmez.`,
    en: `## Plain-language report
- What is happening: If it will not take gear, or it slips under load, the path is the control or the clutch. Forcing it "until it grabs" burns the plate.
- What can cause it: A cable out of adjustment or parted, low fluid, or a worn saildrive or gearbox clutch.
- What to do now: Select gear at idle. Do not add throttle if it will not engage. Read the level with the engine stopped, boat level, against that stick's own marks. The fluid type is on the plate; do not guess. Feel whether the cable still pulls the lever.
- How you know it worked: A clean engagement at idle, and rpm does not flare away under load.
- One question to split the fault: Does the lever reach the end of its travel, or does it go slack halfway?
- When to call a mechanic: Level is right, the cable pulls the lever, and it still slips. Clutch and damper plate are workshop work.
- Brand note: A Volvo Penta saildrive and a shaft gearbox do not share a fluid. Do not name the type without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["rölanti dalgalan", "rolanti dalgalan", "devir dalgalan", "hunting", "idle hunts", "surges at idle"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Rölanti bir inip bir çıkıyorsa motor yakıtta hava veya düzensiz yakıt arıyordur.
- Neden olabilir: Filtre hava emiyor; separatörde su; rölanti kolu veya stop teli yarı çekili.
- Şimdi ne yap: Yük bindirme. Stop telinin geri oturduğunu ve yakıt vanasının açık olduğunu gör. Hava ve su kontrolleri, sönme ve separatör notlarındaki sırayla yapılır.
- Olduğunu nasıl anlarsın: Rölanti kulakla düzleşir, ibre oynamadan durur.
- Bunu ayırt etmek için: Dalgalanma sıcak motorda mı sürüyor, yoksa yalnız soğukken mi?
- Ne zaman usta çağır: Hava ve su elendikten sonra sıcak motorda da sürüyorsa. Pompa ayarı güverte işi değildir.
- Marka notu: Rölanti devri plakadaki değere göredir. Sayı uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Idle that rises and falls means the engine is chasing fuel or air in the fuel.
- What can cause it: A filter pulling air, water in the separator, or an idle stop or kill cable left half on.
- What to do now: Do not add load. See that the stop cable is home and the fuel valve is open. Air and water checks follow the stall and separator notes.
- How you know it worked: Idle sounds even and the tachometer sits still.
- One question to split the fault: Does the surge stay on a hot engine, or only while it is cold?
- When to call a mechanic: Air and water are ruled out and a hot engine still hunts. Pump settings are not deck work.
- Brand note: Idle rpm is the figure on the plate. Do not invent one.`,
  },
  {
    domain: "machinery",
    keys: ["dişli yağı süt", "disli yagi sut", "kuyruk yağı", "kuyruk yagi", "lower unit", "gear oil milky", "lower unit oil"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Dıştan takma kuyruğunun dişli yağı süt gibi olduysa conta su alıyordur. Bu yağ, motor karter yağı değildir.
- Neden olabilir: Pervane mili keçesi; su pompası contası tarafı; tahliye pulu gevşek. Hangisi olduğu yağın renginden tek başına çıkmaz.
- Şimdi ne yap: O kuyrukla uzun yol yapma. Yağı temiz bir kaba boşalt, su mu yağ mı bak. Keçeyi teknedeyken "idare eder" diye bırakma. Döktüğün yağı denize verme.
- Olduğunu nasıl anlarsın: Yeni yağ, kısa bir denemeden sonra hâlâ bal kıvamında ve süt değilse o conta tutuyordur. Süt geri gelirse keçe bitmiştir.
- Bunu ayırt etmek için: Yağ yalnız biraz bulanık mı, yoksa kahve sütü gibi mi?
- Ne zaman usta çağır: Süt rengi varsa. Keçe ve mil usta işidir.
- Marka notu: Yamaha, Mercury, Suzuki, Honda ve Tohatsu'da yağ viskozitesi plakadadır. Tip ve tapa pulu kodu uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Milky lower-unit oil means a seal is taking water. This is not the engine sump oil.
- What can cause it: The prop-shaft seal, the water-pump side, or a loose drain washer. Colour alone does not say which.
- What to do now: Do not make a passage on that leg. Drain into a clean jug and see water versus oil. Do not leave a seal "for now". Do not dump the oil over the side.
- How you know it worked: After a short run the new oil is still honey-coloured, not milk. If the milk returns, the seal is finished.
- One question to split the fault: Is the oil only slightly cloudy, or coffee-milk?
- When to call a mechanic: If it is milky. Seal and shaft are workshop work.
- Brand note: On Yamaha, Mercury, Suzuki, Honda, and Tohatsu the viscosity is on the plate. Do not invent the grade or the washer code.`,
  },
  {
    domain: "machinery",
    keys: ["saildrive yağ", "saildrive yag", "sail drive oil", "yelken ayağı yağ", "yelken ayagi yag"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Saildrive yağı ayrı devrededir. Süt rengi veya seviye kaybı, keçe veya diyafram şüphesidir. Gövde ile bacak arasındaki lastik de ayrıca yaşlanır.
- Neden olabilir: Alt keçe su alıyor; diyafram yorgun; tahliye tapası. Motor karterine su buradan karışmaz, ama bacak susuz kalır.
- Şimdi ne yap: Seviyeyi kendi çubuğundan, motor stopken bak. Süt rengindeyse veya seviye kendiliğinden düşüyorsa yola çıkma. Lastik diyaframın yılı plakada veya servis defterindedir; yılı uydurma.
- Olduğunu nasıl anlarsın: Seviye yerinde kalır ve yağ bal rengini korur.
- Bunu ayırt etmek için: Kayıp yalnız bacakta mı, yoksa motor çubuğunda da süt var mı?
- Ne zaman usta çağır: Süt rengi, seviye kaybı veya diyafram yılı geldiyse.
- Marka notu: Volvo Penta saildrive yağı, şaft şanzımanı yağıyla karıştırılmaz. Tip plakasız söylenmez.`,
    en: `## Plain-language report
- What is happening: Saildrive oil is its own circuit. Milk, or a level that falls, points at a seal or the diaphragm. The rubber between hull and leg ages on its own.
- What can cause it: The lower seal taking water, a tired diaphragm, or the drain plug. It does not put water in the engine sump, but the leg then runs dry.
- What to do now: Read the level on its own stick, engine stopped. Do not leave if it is milky or the level falls by itself. The diaphragm year is on the plate or in the service book; do not invent the year.
- How you know it worked: The level stays put and the oil stays honey-coloured.
- One question to split the fault: Is the loss only in the leg, or is the engine dipstick milky too?
- When to call a mechanic: Milk, lost level, or a diaphragm that is due.
- Brand note: Volvo Penta saildrive oil is not shaft-gearbox oil. Do not name the type without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["körük", "koruk", "bellows", "sterndrive körük", "sterndrive bellows", "kardan körüğü"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Kuyruklu (sterndrive) teknede körük, deniz suyu ile kardanı birbirinden ayırır. Çatlak körük sintineye su basar ve kardanı yakar.
- Neden olabilir: Lastik yaşlanmış; kelepçe gevşek; biriken su don veya buruşma ile yırtmış. Mercury MerCruiser ve Volvo Penta kuyrukta bu parça sezonluk bakımdır.
- Şimdi ne yap: Körük ıslak, yağlı veya çatlaksa o tekneyle açılma. Sintine suyuna bak. Körüğü "bir sezon daha" diye bantlama.
- Olduğunu nasıl anlarsın: Kelepçe kuru, lastik çatlaksız ve sintine o hattan su yapmıyor.
- Bunu ayırt etmek için: Su sintinede mi birikiyor, yoksa yalnız kuyruk yağında mı süt var?
- Ne zaman usta çağır: Çatlak, yaş veya şüphe varsa. Körük değişimi tekne karadayken yapılır.
- Marka notu: Körük seti kuyruk modeline göredir. Plakasız kod yok.`,
    en: `## Plain-language report
- What is happening: On a sterndrive the bellows keeps seawater off the gimbal and the U-joint. A split bellows floods the bilge and ruins the gimbal.
- What can cause it: Aged rubber, a loose clamp, or a fold that tore. On Mercury MerCruiser and Volvo Penta sterndrives this is seasonal service.
- What to do now: If the bellows is wet, oily, or cracked, do not leave. Check the bilge. Do not tape a bellows for "one more season".
- How you know it worked: The clamp is dry, the rubber has no cracks, and the bilge is not taking water from that path.
- One question to split the fault: Is water collecting in the bilge, or is only the drive oil milky?
- When to call a mechanic: Cracked, old, or in doubt. The bellows is changed with the boat ashore.
- Brand note: The bellows set depends on the drive model. No code without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["antisifon", "anti sifon", "anti-siphon", "susturucu su dolu", "muffler full of water", "egzoz su bastı", "egzoz su basti"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Deniz suyu, stop eden motora egzozdan geri yürüyüp susturucuyu ve silindiri doldurabilir. Buna sifon denir.
- Neden olabilir: Antisifon valfi tıkalı veya yok; egzoz dirseği su çizgisinin altında kalıyor; susturucu çökmüş.
- Şimdi ne yap: Motoru tekrar zorla çalıştırma. Susturucu ve egzoz hortumu su doluysa marş, suyu silindire sıkıştırır. Vana ve valf ancak düzen bilinince kontrol edilir.
- Olduğunu nasıl anlarsın: Çalışırken egzozdan su gelir, stopta ise geri yürümez. Valften denize ince bir kontrol kaçağı normal olabilir; hortum şişmesi değildir.
- Bunu ayırt etmek için: Su, motor stop olduktan sonra mı egzoza doldu?
- Ne zaman usta çağır: Susturucu doluysa veya valf şüpheliyse. Silindirdeki su usta işidir.
- Marka notu: Valf yüksekliği ve hortum çapı tekne düzenine göredir. Ölçü uydurulmaz.`,
    en: `## Plain-language report
- What is happening: Seawater can walk back into a stopped engine through the exhaust and fill the muffler and a cylinder. That is a siphon.
- What can cause it: A blocked or missing anti-siphon valve, an elbow that sits below the waterline, or a collapsed muffler.
- What to do now: Do not force another start. If the muffler and exhaust hose are full of water, cranking can hydraulic a cylinder. Check the valve only when you know the layout.
- How you know it worked: Water leaves at the exhaust while running and does not walk back after shutdown. A small tell-tale drip from the valve can be normal; a swelling hose is not.
- One question to split the fault: Did the exhaust fill after the engine was stopped?
- When to call a mechanic: The muffler is full, or the valve is in doubt. Water in a cylinder is workshop work.
- Brand note: Valve height and hose size follow the boat's layout. Do not invent a dimension.`,
  },
  {
    domain: "machinery",
    keys: [
      "kayış ötüyor",
      "kayis otyor",
      "kayış koptu",
      "kayis koptu",
      "alternatör şarj etmiyor",
      "alternator not charging",
      "şarj ikazı sönmüyor",
      "sarj ikazi sonmuyor",
    ],
    tr: `## Sade Dil Raporu
- Ne oluyor: Kayış, alternatörü ve birçok içten takmada tatlı su pompasını çevirir. Ötme kayma sesidir. Şarj ikazı motor çalışırken sönmüyorsa üretim yok demektir.
- Neden olabilir: Kayış gevşek, parlak veya kopuk; alternatör bağlantısı oksitli. Akünün kendi yaşlılığı bundan sonra gelir.
- Şimdi ne yap: Motoru durdurup kayışa bak. Parmakla gerginlik tahmin etme; üreticinin yolu plakadadır. Kopuk kayışla yola devam etme: şarj kesilir, bazılarında soğutma da kesilir.
- Olduğunu nasıl anlarsın: Kayış kuru ve çatlaksızdır, ötme biter, çalışırken şarj ikazı söner.
- Bunu ayırt etmek için: İkaz motor çalışırken mi yanıyor, yoksa yalnız marş anında mı?
- Ne zaman usta çağır: Kayış sağlamken çalışır motorda ikaz sönmüyorsa.
- Marka notu: Kayış kodu ve gerdirme ölçüsü modele göredir. Sayı uydurulmaz.`,
    en: `## Plain-language report
- What is happening: The belt turns the alternator and, on many inboards, the freshwater pump. A squeal is slip. A charge lamp that stays on while running means no output.
- What can cause it: A loose, glazed, or broken belt, or an oxidised alternator connection. An aged battery comes after that.
- What to do now: Stop and look at the belt. Do not guess tension by thumb; the maker's method is on the plate. Do not leave on a broken belt: charge stops, and on some engines cooling stops with it.
- How you know it worked: The belt is dry and uncracked, the squeal is gone, and the charge lamp goes out while running.
- One question to split the fault: Is the lamp on while the engine runs, or only at the moment of start?
- When to call a mechanic: The belt is sound and the lamp still stays on with the engine running.
- Brand note: Belt code and tension depend on the model. Do not invent a figure.`,
  },
  {
    domain: "machinery",
    keys: ["akü", "aku", "battery", "şarj etmiyor", "sarj etmiyor", "voltaj düşük", "voltaj dusuk"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Elektrik gerilim tutmuyor veya marşa yetmiyor.
- Neden olabilir: Akü yaşlanmış; kutup oksitli; alternatör kayışı gevşek; buzdolabı veya inverter geceyi boşaltmış.
- Şimdi ne yap: Motor kapalıyken gerilime bak. Kutupları temizle ve sık. Motor çalışırken gerilim yükselmiyorsa üretim yok demektir. Islak, jel ve AGM aynı şarjı istemez.
- Olduğunu nasıl anlarsın: Kutuplar temizken marş çevirir ve çalışırken ikaz söner.
- Bunu ayırt etmek için: Motor çalışırken gerilim yükseliyor mu, yoksa yalnız akü mü çöküyor?
- Ne zaman usta çağır: Çalışırken gerilim yükselmiyorsa, veya akü şişmiş ya da ekşi kokuyorsa.
- Marka notu: Sağlam bir servis aküsü motor kapalıyken çoğu zaman 12,4 V ve üstüdür. Çalışırken şarj çoğu regülatörde kabaca 13,5–14,5 V bandındadır. Tam sayı plaka ve akü tipine bağlıdır; tipi bilmeden sayı kesinleştirme.`,
    en: `## Plain-language report
- What is happening: The electrical system will not hold voltage, or it will not crank.
- What can cause it: An aged battery, oxidised terminals, a loose alternator belt, or a fridge or inverter that emptied it overnight.
- What to do now: Read the voltage with the engine off. Clean and tighten the posts. If voltage does not rise while running, there is no charge. Flooded, gel, and AGM do not want the same charge.
- How you know it worked: With clean posts it cranks, and the lamp goes out while running.
- One question to split the fault: Does voltage rise with the engine running, or is only the battery collapsing?
- When to call a mechanic: Voltage does not rise while running, or the battery is swollen or smells sour.
- Brand note: A healthy service battery is often 12.4 V or more with the engine off. Running charge is often about 13.5–14.5 V. The exact figure depends on the regulator and the battery type; do not lock a number without the type.`,
  },
  {
    domain: "machinery",
    emergency: true,
    keys: ["sintine", "bilge", "su alma", "flooding", "tekne su alıyor", "tekne su aliyor"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Gövdeye veya sintineye su giriyor. Bu, makine teşhisinden önce emniyet işidir.
- Neden olabilir: Sintine pompası çalışmıyor; hortum veya kelepçe; salmastra (stuffing box); açık deniz suyu vanası; gövde çatlağı.
- Şimdi ne yap: Pompayı aç, yedek varsa onu da çalıştır. Bilinen kaçak hattının vanasını kapat. Can yeleği hazır olsun. Su yükseliyorsa VHF veya telefon ile yardım iste.
- Olduğunu nasıl anlarsın: Seviye, pompa çalışırken düşer ve vana kapanınca o hat susar.
- Bunu ayırt etmek için: Su tuzlu mu, yoksa tatlı su / antifriz kokusu mu var?
- Ne zaman usta çağır: Pompa yetişmiyorsa veya kaynak bulunamıyorsa. Şimdi.
- Marka notu: Kaçak yeri görmeden parça uydurma.`,
    en: `## Plain-language report
- What is happening: Water is entering the hull or the bilge. Safety before diagnosis.
- What can cause it: A dead bilge pump, a hose or clamp, the stuffing box, an open seacock, or a hull crack.
- What to do now: Run the pump and any spare. Close the seacock on the known leak. Keep lifejackets ready. If the water is winning, call on VHF or the phone.
- How you know it worked: The level falls while the pump runs, and that line goes quiet once its seacock is shut.
- One question to split the fault: Is the water salt, or does it smell of freshwater or antifreeze?
- When to call a mechanic: The pump cannot keep up, or you cannot find the source. Now.
- Brand note: Do not invent a part before you see the leak.`,
  },
  {
    domain: "machinery",
    emergency: true,
    keys: ["dümen", "dumen", "steering", "direksiyon boş", "hidrolik dümen", "hidrolik dumen"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Dümen cevapsız veya aşırı boş. Trafikte bu acildir.
- Neden olabilir: Hidrolik kaçak veya seviye düşük; kablo kopuk; otopilot kavraması; dümen yekesi.
- Şimdi ne yap: Sürati düşür. Trafikten uzaklaş. Yedek dümen varsa tak. Hidrolik yağ buharının yanında kıvılcım yok.
- Olduğunu nasıl anlarsın: Dolap iskele ve sancağı, boşluksuz, yekeye iletir.
- Bunu ayırt etmek için: Boşluk yalnız otopilot açıkken mi var?
- Ne zaman usta çağır: Yedek dümenle limana dönemiyorsan. Şimdi yardım iste.
- Marka notu: Hidrolik yağ tipi plakasız söylenmez.`,
    en: `## Plain-language report
- What is happening: Steering is dead or dangerously loose. In traffic this is an emergency.
- What can cause it: A hydraulic leak or low fluid, a parted cable, the autopilot clutch, or the quadrant.
- What to do now: Slow down. Get clear of traffic. Rig emergency steering if you have it. No sparks near a mist of hydraulic fluid.
- How you know it worked: The wheel sends port and starboard to the tiller without slack.
- One question to split the fault: Is the slack there only while the autopilot is on?
- When to call a mechanic: You cannot make harbour on emergency steering. Ask for help now.
- Brand note: Do not invent the hydraulic fluid without the plate.`,
  },
  {
    domain: "machinery",
    keys: ["seyir öncesi motor", "seyir oncesi motor", "kalkış öncesi", "kalkis oncesi", "pre-departure engine", "limandan çıkmadan motor", "limandan cikmadan motor"],
    tr: `## Sade Dil Raporu
- Ne oluyor: Kalkıştan önce makine, arıza beklemeden dolaşılır. Bu bir tamir değil, kapıyı açmadan önceki kontroldür.
- Neden olabilir: Unutulan deniz suyu vanası, gevşek kayış, separatörde su, kuru salmastra veya ölü sintine pompası yolda arıza olur.
- Şimdi ne yap: Yağ çubuğu soğukken. Deniz suyu vanası açık, süzgeç temiz. Kayış yerinde ve çatlaksız. Yakıt separatöründe su yok. Sintine kuru, pompa bir an çalışıyor. Dümen tam iskele ve sancak. Rölantide egzoz suyu veya tell-tale geliyor mu bak, sonra gaz ver.
- Olduğunu nasıl anlarsın: Su egzozda düzenli, ikazlar sönük, sintine yerinde, dümen dolu.
- Bunu ayırt etmek için: Bu turda hangi madde eksik kaldı?
- Ne zaman usta çağır: Su gelmiyorsa, yağ sütse, kayış kopuksa veya sintine daha şimdiden su yapıyorsa. O halde kalkma.
- Marka notu: Tork, filtre kodu ve yağ litrosu bu listede yok. Onlar plakada ve atölye kitabında.`,
    en: `## Plain-language report
- What is happening: Before leaving, the machinery is walked whether or not it has a fault. This is the check at the gate, not a repair.
- What can cause it: A shut seacock, a slack belt, water in the separator, a dry stuffing box, or a dead bilge pump becomes the fault underway.
- What to do now: Dipstick while cool. Seacock open, strainer clean. Belt in place and uncracked. No water in the fuel separator. Bilge dry, pump runs for a moment. Wheel hard over both ways. At idle, confirm exhaust water or the tell-tale, then throttle up.
- How you know it worked: Water at the exhaust is steady, lamps are out, the bilge stays put, and the wheel is firm.
- One question to split the fault: Which item on that round did you not check?
- When to call a mechanic: No water, milky oil, a broken belt, or a bilge that is already making water. Do not leave.
- Brand note: This list has no torque, filter code, or oil quantity. Those live on the plate and in the workshop manual.`,
  },
];
