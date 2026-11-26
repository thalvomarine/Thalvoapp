# Thalvo’yu yerelde Ollama ile taramak

Bu depo Thalvo MarineOS’un tamamıdır: kokpit, herkese açık harita, auth, bayi masası, marketplace, SOS, ödeme defteri, mobil kabuk ve SQL migration’ları. Ayrı bir “özet repo” yoktur; kopyası bölünür ve kaynakla çelişir.

`ollama/` klasörü, küçük bir yerel modelin bu ağacı baştan sona gezmesi için harita ve tarayıcıdır. Model önce `SYSTEM.md` ve `corpus/` dosyalarını okur, sonra soruyla eşleşen kaynak parçalarını `src/`, `supabase/migrations/`, `docs/` ve `serverless/` içinden alır.

## Kurulum

Ollama çalışıyor olsun (`ollama list` bir model göstermeli). Depoyu klonla:

```bash
git clone https://github.com/thalvomarine/Thalvoapp.git
cd Thalvoapp
npm ci
```

Uygulamayı da açacaksan `.env.example` içindeki adlarla kendi `.env` dosyanı doldur. `.env` commit edilmez ve tarayıcı onu okumaz.

İsteğe bağlı özel model:

```bash
# ollama/Modelfile içindeki FROM satırını `ollama list` çıktındaki bir modele çevir
ollama create thalvo -f ollama/Modelfile
```

`FROM` satırını değiştirmezsen `ollama create` o modeli indirebilir. İndirme istemiyorsan aşağıdaki `--model` yolunu kullan.

## Soru sormak

```bash
node ollama/scripts/ask.mjs --model qwen2.5-coder:7b "Açık SOS hangi RPC ile iptal edilir?"
```

`--model` verilmezse sıra şöyledir: `THALVO_OLLAMA_MODEL`, yoksa `thalvo`.

Tarayıcının modele vereceği metni görmek için (Ollama çağrılmaz):

```bash
node ollama/scripts/ask.mjs --print "checkout_parts_cart bayi siparişini nasıl böler?"
```

Haritayı kaynak ağacı değiştikten sonra yenile:

```bash
node ollama/scripts/build-filemap.mjs
```

Çıktı `ollama/corpus/09-dosya-haritasi.md` dosyasına yazılır.

## Model ne yapar, ne yapmaz

`ask.mjs` depoyu okur ve cevabı terminale yazar. Dosya değiştirmez, migration uygulamaz, Supabase’e bağlanmaz. Yamayı sen veya düzenleme yapabilen bir yerel ajan uygular. Düzenleme yapan araca sistem metni olarak `ollama/SYSTEM.md` verilir; kodun kendisi bu depodadır.

Aider veya benzeri bir araç kullanıyorsan çalışma dizini bu klonun kökü olsun ve modele `ollama/SYSTEM.md` ekle. `node_modules`, `dist`, `.output`, `ios` Pods ve `.env` bağlama girmez.

## Corpus

| Dosya | İçerik |
| --- | --- |
| `SYSTEM.md` | Ürün kuralları. Her soruya eklenir. |
| `corpus/00-indeks.md` | Diğer harita dosyalarının dizini |
| `corpus/01-calistirma.md` | Komutlar, yayın, ortam değişkeni adları |
| `corpus/02-rotalar.md` | URL ve route dosyaları |
| `corpus/03-roller.md` | Kaptan, teknisyen, bayi, admin |
| `corpus/04-veri.md` | Tablolar, enumlar, depolama |
| `corpus/05-rpc.md` | Veritabanı fonksiyonları |
| `corpus/06-akislar.md` | SOS, teklif, ödeme, katalog, AI |
| `corpus/07-arayuz.md` | Kokpit, harita, tema, AI sınırı |
| `corpus/08-sinirlar.md` | Bilinçli olarak yapılmayanlar |
| `corpus/09-dosya-haritasi.md` | Kaynak dosya indeksi |

Ayrıntılı insan dokümanları `docs/` altındadır. Corpus onların yerine geçmez.
