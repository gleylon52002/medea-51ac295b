Sistemi taradım. Aşağıda kategori bazlı, doğrulanmış mantıksızlıklar var. Bu plan **tespit raporu**dur; hangilerini düzeltmek istediğini söylersen onları uygulamaya geçeriz.

---

## 1) Sepet / Ödeme sistemi yarım kaldırılmış (en kritik)

Önceki turda "sepet ve checkout tamamen kaldırılsın, sadece Shopier linki kalsın" denilmişti. Kod hâlâ büyük ölçüde eski sepet sistemini taşıyor:

- `src/contexts/CartContext.tsx` mevcut ve `src/App.tsx` (satır 9, 170, 292) hâlâ `<CartProvider>` ile tüm uygulamayı sarıyor.
- `src/components/products/ProductCard.tsx` Shopier'a yönlendirmiyor — hâlâ `useCart()` + `addToCart()` çağırıyor (satır 5, 28, 62-84). "Satın Al" butonu yerine "Ekle" (sepete ekle) butonu render ediyor.
- `src/components/products/QuickView.tsx` aynı şekilde `addToCart` kullanıyor.
- `src/components/products/BundleOffers.tsx` `addToCart` ile paket ekliyor.
- `src/pages/Checkout.tsx` ve `src/pages/PayTRPayment.tsx` dosyaları silinmemiş (route yok ama dosyalar duruyor, içeride `useCheckoutEvents`, `CheckoutSecurityBadges` importları aktif).
- `src/components/cart/CartDrawer.tsx`, `StickyAddToCart.tsx`, `CheckoutSecurityBadges.tsx`, `CouponInput.tsx`, `FreeShippingProgress.tsx` dosyaları duruyor.
- Hook'lar: `useUserCart`, `useAbandonedCart`, `useCheckoutEvents`, `useCreateOrder` hâlâ var.
- `src/lib/analytics.ts` ve `src/lib/metaPixel.ts` cart/checkout event'leri gönderiyor.

Sadece `ProductDetail.tsx` doğru: `shopier_link` + `handleBuyClick` ile Shopier'a yönlendiriyor.

**Sonuç:** Kullanıcı ürünleri ürün listesinden veya QuickView'den eklemeye çalıştığında hâlâ eski sepete düşüyor; ama sepetin gideceği bir checkout sayfası yok → kullanıcı çıkmaza giriyor.

---

## 2) Admin & Hesap panelinde "ölü" sayfalar

Ödeme/sipariş akışı yokken hâlâ sipariş/ödeme/sepet ekranları var:

- **Admin sidebar** (`src/components/admin/AdminLayout.tsx`):
  - `/admin/siparisler` — Siparişler
  - `/admin/odemeler` — Satıcı Ödemeleri
  - `/admin/sepetler` — Kullanıcı Sepetleri
  - `/admin/faturalar` — Faturalar
  - `/admin/donusum-hunisi` — Dönüşüm Hunisi (sepet→ödeme funnel'i)
- **Hesap sayfası** (`src/pages/Account.tsx`):
  - `/hesabim/siparisler` — Siparişlerim (sipariş hiç oluşmuyor)
  - `/hesabim/sadakat` — Sadakat Programı (satın alma yok, puan kazanılmıyor)
- **Genel route'lar (App.tsx):**
  - `/siparis-basarili` (OrderSuccess) — tetiklenebilecek yer yok
  - `/admin/sepetler`, abandoned-cart e-postaları

Bunlar ya tamamen kaldırılmalı ya "Bu özellik şu an pasif" şeklinde gizlenmeli.

---

## 3) İletişim bilgileri / domain tutarsızlığı

Aynı veri 3-4 farklı yerde farklı yazılmış:

| Yer | E-posta | Telefon |
|---|---|---|
| `Footer.tsx` (canlıda görünen) | info@medea.com.tr | +90 555 123 4567 |
| `Contact.tsx` | info@medea.com.tr / destek@medea.com.tr | +90 (212) 123 45 67 + WhatsApp +90 (532) 123 45 67 |
| `legal/PrivacyPolicy.tsx`, `KVKK.tsx`, `CookiePolicy.tsx` | gizlilik@medea.com.tr | +90 (212) 123 45 67 |
| `legal/ReturnPolicy.tsx` | iade@medea.com.tr | +90 (212) 123 45 67 |
| `professionalInvoiceGenerator.ts` | info@medea.**com** (yanlış domain) | — |
| Session replay footer | info@medea.com | +90 555 123 4567 |

Birden fazla domain karışmış: `medea.tr` (canonical/SEO), `medea.com.tr` (e-postalar), `medea.com` (fatura). Hepsi `medea.tr` etrafında tek bir kaynaktan (`site_settings.contact_info`) yönetilmeli; placeholder telefon ve adresler de gerçek bilgilerle değiştirilmeli (Contact.tsx ve LocalBusiness JSON-LD'de "Caferağa Mah. Moda Cad. No: 123" placeholder adresi LocalBusiness şemasına da yazılı — Google için yanlış bilgi).

---

## 4) Satıcı (Seller) altyapısı ile gerçek model çelişiyor

Sistem "Shopier'a yönlendiren tek katalog" hâline geldi ama hâlâ tam bir **çok satıcılı pazaryeri** UI'ı var:

- `/satici/*` altında 15+ ekran (kazançlar, ödemeler, fatura, kargo, stok tahmini, puan satın al, performans, vs.)
- `/admin/saticilar`, `/admin/satici-basvurulari`, `/admin/odemeler` (payout)
- Sipariş/ödeme olmadığı için bu sayfaların "kazanç", "fatura", "payout" verileri her zaman boş veya yanıltıcı.
- Kullanıcı tek satıcı (MEDEA) ise pazaryeri katmanı tamamen kaldırılabilir; çok satıcı kalacaksa Shopier modeliyle bağdaşmıyor (her satıcının ayrı Shopier'ı mı olacak belirsiz).

---

## 5) SEO / Sitemap içerikleri ile gerçek route'lar uyuşmuyor

- `public/sitemap.xml` statik — yeni ürün eklediğinde otomatik güncellenmiyor. Admin SEO'daki "Otomatik Oluştur" butonu Storage'a yüklüyor ama `medea.tr/sitemap.xml` `public/sitemap.xml` dosyasını döndürür, Storage'daki sürümü değil. Yani admin'den "yenile" demek hiçbir şey değiştirmiyor.
- `llms.txt` içine `/iade-politikasi` ve `/gizlilik` yazdım ama gerçek route'lar `/iade-ve-iptal` ve `/gizlilik-politikasi`. Bu link'ler 404'e gidiyor.
- `robots.txt` hâlâ `Disallow: /odeme` içerir — route yok.
- `index.html` `<noscript>` içinde `/kategori/dogal-sabunlar`, `/kategori/yuz-maskeleri`, `/kategori/mumlar` linkleri sabit; veritabanından kategori silinirse bozulur.

---

## 6) Çeviri / i18n boşlukları

- `src/i18n/locales/tr.json` ve `en.json` hâlâ `cart`, `checkout`, `addToCart` anahtarlarını içeriyor; UI'da bu anahtarlar Shopier modeli için anlamsız.
- `useAITranslation` kullanılıyor ama yalnızca `ProductCard` içinde — Hero/Categories/Featured gibi ana sayfada metinler hard-coded Türkçe.

---

## 7) Diğer küçük tutarsızlıklar

- `Footer.tsx` sosyal medyada Pinterest, TikTok, YouTube, Twitter, Facebook, Instagram linkleri var ama `site_settings.social` verileri girilmemişse hepsi `#` veya boş URL'e gidiyor.
- `AdminSEO.tsx` "Otomatik Oluştur" butonu `VITE_SUPABASE_PROJECT_ID`'yi hard-coded fallback ile kullanıyor (`gxzlltmivdlpplunuusi`) — proje taşınırsa kırılır.
- `AdminUserCarts` (kullanıcı sepetleri ekranı) sepet sistemi kaldırılmış olduğu için boş veri gösterecek.
- `PWAInstallPrompt` + `manifest.json` + `sw.js` aktif ama `manifest.json` içindeki ikon/renk MEDEA brand'i ile uyumlu mu kontrol edilmedi (önceki turda elle düzenlenmedi).
- `ProductDetail.tsx`'de `addToCartRef` adında ref hâlâ var ama içeride sepete ekleme yok (sadece "Satın Al"). Ölü kod.
- `useAbandonedCart` hook'u "terk edilmiş sepet" için e-posta tetikliyor → sepet yok, çalışmıyor.

---

## Önerilen düzeltme yol haritası (öncelik sırasıyla)

1. **Sepet sistemini tamamen sökmek**: `CartProvider`, `useCart`, `CartDrawer`, `Checkout.tsx`, `PayTRPayment.tsx`, `useAbandonedCart`, `useCheckoutEvents`, `useCreateOrder`, `useUserCart`, tüm `components/cart/*` ve `components/checkout/*` dosyaları silinir. `ProductCard`, `QuickView`, `BundleOffers` Shopier "Satın Al" butonuna geçirilir (paket için tek Shopier linki veya devre dışı).
2. **Admin & Hesap menülerinden ölü ekranları çıkarmak**: Siparişler, Faturalar, Sepetler, Ödemeler, Dönüşüm Hunisi, Sadakat, OrderSuccess route'u, Abandoned cart email automation.
3. **Pazaryeri / Satıcı katmanı kararı**: tamamen kaldır → tek marka (MEDEA), veya açık tut → Shopier modeline uygun yeni akış tasarla. (Karar gerekli.)
4. **İletişim bilgilerini tek kaynağa çekmek**: `site_settings.contact` → Footer, Contact, tüm legal sayfalar, LocalBusiness JSON-LD, fatura jeneratörü hepsi oradan okur. Telefon/e-posta/adres gerçek değerlerle güncellenir.
5. **SEO temizliği**: `robots.txt`'den `/odeme` satırını çıkar, `llms.txt`'deki kırık route'ları düzelt, sitemap'i build-time generator'a çevir (önceki turda statik `public/sitemap.xml` kullanılıyor — kullanıcı buna razı mı?).
6. **i18n temizliği**: cart/checkout anahtarlarını sil.

---

## Açık sorular

Hangi yönde ilerleyelim, lütfen netleştir:

- (a) Sipariş/ödeme/sepet sisteminin **tamamen silinmesini** mi istiyorsun, yoksa **sadece UI'da gizlenmesini** mi (kod gelecekte geri açılabilsin diye)?
- (b) Çok-satıcılı pazaryeri (`/satici/*`, `/admin/saticilar`, payout) **kalsın mı, gitsin mi**? Sadece sen mi satıyorsun?
- (c) Hesap altında "Siparişlerim" ve "Sadakat" sayfalarını **kaldıralım mı**, yoksa sipariş geçmişi Shopier üzerinden gerçekleşeceği için bir "Shopier siparişlerin için Shopier hesabını ziyaret et" yönlendirmesi mi koyalım?
- (d) Gerçek iletişim bilgilerin (e-posta, telefon, adres) nedir? (Hem placeholder'lar hem KVKK/LocalBusiness şeması için lazım.)
