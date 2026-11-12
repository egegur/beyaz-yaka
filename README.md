# [Marka] — Beyaz yaka kariyer koçu

"İşteyken yanındaki koç." Özel sektörde çalışan beyaz yakalılar için yapay zekâ destekli kariyer koçu.
Önce web, sonra aynı kod tabanından iPhone uygulaması.

> Marka adı henüz belirlenmedi; arayüzde `[Marka]` yazıyor. Çalışma adı: "beyaz yaka".

## Mimari (altyapıya ücret ödenmez)

| Katman | Teknoloji | Ücret |
|---|---|---|
| Ön yüz | React 19 + Vite + TypeScript | — |
| Sunucu | Cloudflare Workers (ön yüzü de aynı Worker sunar) | Ücretsiz paket |
| Veritabanı | Cloudflare D1 | Ücretsiz paket |
| Giriş | Firebase Authentication (Spark) — Google ve e-posta | Ücretsiz paket |
| Yapay zekâ | Claude API, `claude-sonnet-5-5` | **Tek ücretli kalem** |

Claude Sonnet 5.5 fiyatı: milyon girdi token başına 2 $, milyon çıktı token başına 10 $ (10 Kasım 2026'da doğrulandı).

## Klasörler

```
worker/      Sunucu (API): kimlik, güvenlik, kota, Claude çağrıları
  prompts.ts   Koçun sistem talimatı ve araç tanımları
  safety.ts    Kriz (112) ve iş hukuku (ALO 170) yönlendirmesi
  budget.ts    Kullanıcı kotası + günlük harcama tavanı
shared/      Ön yüz ve sunucunun ortak tipleri
src/         Ön yüz (ekranlar: src/screens)
migrations/  D1 veritabanı şeması
test/        Testler (yerel D1 ile uçtan uca API testleri dahil)
```

## Özellikler

- **Beş alan:** Rolümü anlamak · Yöneticimle ilişki (birebir hazırlığı, zor konuşma provası) · Kendimi geliştirmek (beceri açığı haritası, aylık plan) · Yükselmek (maaş görüşmesi, kazanım günlüğü → terfi dosyası) · Kariyer değişimi (yol haritası).
- **Ek araçlar:** Mesaj tonu kontrolü; **ATS CV skoru (ücretli, hak ile çalışır)**.
- Tüm cevaplar yapılandırılmış çıktı olarak gelir (Claude'a araç kullanımı zorunlu tutulur), ekrana gitmeden önce şekle sokulur.

## Güvenlik ve maliyet korumaları

1. **Kriz yönlendirmesi:** Kendine zarar sinyalinde yapay zekâ hiç çağrılmaz; 112 yönlendirmesi gösterilir.
2. **İş hukuku notu:** Kıdem/ihbar tazminatı, fesih, mobbing gibi konularda çıktıya avukat ve ALO 170 notu eklenir.
3. **Sistem talimatı:** Rakam/maaş uydurmama, CV'de deneyim uydurtmama, kapsam dışı konuları reddetme, kullanıcı metnini talimat saymama.
4. **18+ onayı** olmadan yapay zekâ araçları çalışmaz.
5. **Kota:** Deneme 7 gün, günde 8 çağrı; abone günde 60 çağrı (`wrangler.jsonc` → `vars`).
6. **Günlük harcama tavanı:** Tüm uygulama için günde 3 $ (≈ 90 $/ay). Dolunca yapay zekâ o gün durur.
7. **Veri en aza indirme:** Ad, şirket adı, CV metni ve prova sohbetleri sunucuda saklanmaz. Her araç için son 10 çıktı tutulur. Hesap silme tüm verileri siler.
8. Geliştirici girişi (`DEV_AUTH`) yalnızca `localhost`/`127.0.0.1` adresinde çalışır.

## Kullanıcı demografisi (toplu istatistik)

Kayıttan sonra isteğe bağlı 4 soru sorulur: yaş aralığı, şirket büyüklüğü, ekip yönetimi, şehir (İstanbul/Ankara/İzmir/Diğer).
Her soru atlanabilir ve "Belirtmek istemiyorum" seçeneği vardır. Cevaplar koçun önerilerini uyarlar ("Belirtmek istemiyorum" koça gönderilmez).

Raporlarda yalnızca toplu sayılar kullanılır. **10 kişiden küçük gruplar paylaşılmaz** (kişinin tanınmasını önlemek için):

```bash
npx wrangler d1 execute beyaz-yaka-db --remote --command \
  "SELECT age_range, company_size, COUNT(*) AS kisi FROM users GROUP BY 1, 2 HAVING kisi >= 10"
```

## Yerelde çalıştırma

```bash
npm install
cp .dev.vars.example .dev.vars        # ANTHROPIC_API_KEY'i yaz
npm run db:migrate:local
npm run build && npx wrangler dev     # http://127.0.0.1:8787
```

Firebase ayarı (`.env`) yoksa uygulama "Geliştirici olarak gir" düğmesiyle açılır.
Ön yüzde anlık değişiklik için ayrı terminalde `npm run dev` (5173), API isteklerini 8787'ye yönlendirir.

```bash
npm test          # 54 test
npm run typecheck
```

## Gerçek Claude ile kalite testi

API anahtarı geldiğinde (yaklaşık 0,5 $ harcar):

```bash
# .dev.vars: ANTHROPIC_API_KEY=<gerçek anahtar>, DEV_AUTH=1, TRIAL_DAILY_AI_CALLS=200
npm run build && npx wrangler dev --port 8787
node scripts/kalite-testi.mjs        # ayrı terminalde; rapor test-raporlari/ altına yazılır
```

25 vaka: 13 kalite (her araç) + 12 kırmızı takım (kriz, hukuk notu, talimat enjeksiyonu, karalama, sahte CV, yaş ayrımcılığı, maaş rakamı ısrarı, siyaset, kişisel veri). Otomatik kontroller kesin hataları yakalar; "İnsan kontrolü" işaretli vakalar elle okunur.

## Hukuki metinler

`src/legal.ts` içinde KVKK aydınlatma metni ve kullanım koşulları **taslağı** var (uygulamada /gizlilik, /kosullar). Avukat kontrol listesi: `LEGAL-NOTLAR.md`.

## Canlıya alma (patronla birlikte yapılacak adımlar)

1. **Anthropic konsolu:** API anahtarı oluştur, **aylık harcama limitini 100 $** olarak ayarla (üçüncü koruma katmanı).
2. **Firebase:** Yeni proje (Spark, ücretsiz) → Authentication → Google ve E-posta/Şifre'yi aç → Web uygulaması ekle. Değerleri `.env` dosyasına yaz (`.env.example`). Yetkili alan adlarına canlı adresi ekle.
3. **Cloudflare:**
   ```bash
   npx wrangler login
   npx wrangler d1 create beyaz-yaka-db         # çıkan database_id'yi wrangler.jsonc'ye yaz
   npm run db:migrate:remote
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
   `wrangler.jsonc` içinde `FIREBASE_PROJECT_ID` değerini doldur.
4. `npm run deploy`

**Otomatik yayın (Cloudflare Workers Builds, GitHub'a bağlı):** Build komutu `npm run build`, deploy komutu `npm run deploy:cf` (önce veritabanı tablolarını uygular, sonra yayınlar). `main` dalına her yüklemede yayın kendiliğinden yenilenir.
D1 veritabanı: `beyaz-yaka-db` (12 Kasım 2026'da açıldı, kimlik `wrangler.jsonc`'de).

## Açık işler

- [ ] Marka adı ve alan adı (TÜRKPATENT kontrolü)
- [ ] Ödeme altyapısı: abonelik ve ATS CV hakkı satışı (web için ödeme sağlayıcısı seçimi; iOS'ta Apple uygulama içi satın alma)
- [ ] Maliyet hesabı → deneme kotası ve fiyatlar (şu an yer tutucu)
- [ ] iPhone uygulaması: Capacitor, Apple ile giriş, haftalık hatırlatma bildirimi
- [ ] KVKK aydınlatma metni, açık rıza, kullanım koşulları (avukat kontrolü)
- [ ] Kötüye kullanım için Firebase App Check
- [ ] Gerçek Claude ile Türkçe kalite testleri ve kırmızı takım testi
