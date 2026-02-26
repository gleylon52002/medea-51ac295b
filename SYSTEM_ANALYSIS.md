# Medea E-Ticaret Sistemi - Analiz ve Özellik Dokümanı

## 📋 Genel Bakış
Çok satıcılı (multi-vendor) e-ticaret platformu. React + Vite + Tailwind CSS + Lovable Cloud altyapısı üzerinde çalışır.

---

## ✅ Tamamlanan Özellikler

### 1. Kullanıcı Sistemi
- **Kayıt / Giriş**: E-posta doğrulamalı kayıt, şifre ile giriş
- **Profil Yönetimi**: Ad, telefon, avatar güncelleme
- **Adres Yönetimi**: Çoklu adres ekleme, varsayılan seçme
- **Rol Sistemi (RBAC)**: `admin`, `user`, `seller` rolleri
- **Cüzdan**: Bakiye sistemi, sipariş ödemelerinde kullanım

### 2. Ürün Yönetimi
- **CRUD**: Admin ve satıcılar tarafından ürün ekleme/düzenleme/silme
- **Kategoriler**: Alt kategori desteği, slug bazlı routing
- **Varyantlar**: Renk, ağırlık, koku türleri; fiyat farkı ve ayrı stok
- **Görseller**: Çoklu görsel yükleme (Lovable Cloud Storage)
- **SEO**: Meta title/description her ürün ve kategoride
- **İlişkili Ürünler**: Manuel ilişkilendirme
- **Ürün Karşılaştırma**: Oturum bazlı karşılaştırma tablosu

### 3. Sepet ve Ödeme
- **Sepet**: LocalStorage + veritabanı senkronizasyonu
- **Kupon Sistemi**: Yüzde ve sabit tutar indirimleri
- **Cüzdan Kullanımı**: Bakiye ile kısmi ödeme
- **Referans Sistemi**: Referans koduyla %5 komisyon
- **Ödeme Yöntemleri**: Kredi kartı, havale/EFT, kapıda ödeme, Shopier, ShopiNext, Payizone
- **Satıcı Ürün Kısıtlaması**: Satıcı ürünleri sadece online ödeme

### 4. Sipariş Yönetimi
- **Güvenli Sipariş Oluşturma**: `create_order_secure` RPC fonksiyonu (sunucu tarafı doğrulama)
- **Stok Yönetimi**: Sipariş anında otomatik stok düşürme (ürün + varyant)
- **Sipariş Takibi**: Durum güncellemeleri (beklemede → onaylandı → hazırlanıyor → kargoda → teslim edildi)
- **Kargo Takibi**: Kargo şirketi ve takip numarası
- **Sipariş Numarası**: `MDA-ZAMAN-RANDOM` formatı

### 5. Fatura Sistemi
- **Profesyonel PDF**: jsPDF ile modern tasarımlı fatura oluşturma
- **Otomatik KDV**: %18 KDV hesaplama
- **Admin Örnek Fatura**: Admin panelinde her an indirilebilir örnek fatura
- **Türkçe Karakter Desteği**: Encoding sorunları için mapping

### 6. Çok Satıcılı Pazaryeri
- **Satıcı Başvurusu**: Kimlik, vergi, banka bilgileriyle başvuru
- **Admin Onayı**: Başvuru inceleme ve onay/red
- **Komisyon Sistemi**: Varsayılan %15 komisyon, satıcıya özel oran
- **İtibar Puanları**: Satıcı performans takibi
- **Puan Satın Alma**: Paket bazlı itibar puanı satın alma
- **Satıcı Ürünleri**: Ayrı ürün yönetimi
- **Kazanç Takibi**: Satıcı komisyon ve net kazanç raporları
- **Ceza Sistemi**: Otomatik hesap askıya alma

### 7. Admin Paneli
- **Dashboard**: Genel istatistikler
- **Ürün / Kategori / Sipariş Yönetimi**
- **Kullanıcı Yönetimi**: Roller, sepet görüntüleme
- **Kupon / Kampanya Yönetimi**
- **Ödeme Ayarları**: Provider bazlı aktif/pasif
- **Kargo Şirketleri**: Ekleme/düzenleme
- **SSS, Bülten, İletişim Mesajları**
- **Tema / SEO / Hero Slider Ayarları**
- **Satıcı Yönetimi**: Başvurular, satıcılar, ayarlar, ödemeler
- **Kullanıcı Sepetleri**: Görüntüleme ve kişisel indirim uygulama
- **Fatura Yönetimi**: Tüm faturalar, örnek fatura indirme

### 8. Satıcı Paneli
- **Dashboard**: Satış istatistikleri
- **Ürün Yönetimi**: Kendi ürünlerini CRUD
- **Sipariş Takibi**: Kendi ürünlerinin siparişleri
- **Kazanç Raporu**: Komisyon kesintili kazanç analizi
- **Puan Sistemi**: İtibar puanı geçmişi
- **Puan Satın Alma**: Paket seçimi ile puan yükleme
- **Ürün Öne Çıkarma**: Puanla ürün boost
- **Mesajlaşma**: Müşteri/admin ile iletişim
- **Soru-Cevap**: Ürün sorularını yanıtlama
- **Kargo Yönetimi**: Kargo şirketi seçimi
- **Bildirimler**: Sipariş ve sistem bildirimleri

### 9. İletişim ve İçerik
- **İletişim Formu**: Mesaj gönderme
- **Hakkımızda Sayfası**
- **SSS**: Dinamik soru-cevap
- **Bülten**: E-posta aboneliği
- **Sosyal Medya Linkleri**: Dinamik yönetim

### 10. Yasal Sayfalar
- KVKK, Gizlilik Politikası, Mesafeli Satış Sözleşmesi
- İade ve İptal Politikası, Çerez Politikası

### 11. Arama ve Keşif
- **Arama Dialog**: Ürün arama
- **Son Görüntülenen**: Kullanıcı bazlı geçmiş
- **Ürün Yorumları**: Yıldız puanlama + yorum

---

## 🐛 Tespit Edilen Hatalar ve Düzeltmeler

### Düzeltildi ✅
| # | Hata | Çözüm |
|---|------|-------|
| 1 | `create_order_secure` RPC fonksiyonu yoktu, sipariş oluşturulamıyordu | Veritabanında SECURITY DEFINER fonksiyon oluşturuldu |
| 2 | Teslimat bilgileri boş bırakılarak 2. adıma geçilebiliyordu | Form validasyonu eklendi (ad, soyad, e-posta, telefon, adres, il, ilçe) |
| 3 | E-posta formatı doğrulanmıyordu | Regex ile e-posta validasyonu eklendi |
| 4 | Aktif ödeme yöntemi olmadan onay adımına geçilebiliyordu | Ödeme yöntemi kontrolü eklendi |

### Bilinen Eksiklikler ⚠️
| # | Konu | Açıklama | Öncelik |
|---|------|----------|---------|
| 1 | Kredi kartı bilgileri dekoratif | Kart numarası, CVV alanları state'e bağlı değil, doğrulama yok. Gerçek ödeme Shopier/Payizone gibi harici sağlayıcılar üzerinden yapılmalı | Yüksek |
| 2 | Ödeme entegrasyonları placeholder | Shopier, ShopiNext, Payizone API endpoint'leri placeholder, gerçek API key'ler girilmeli | Yüksek |
| 3 | E-posta gönderimi | `send-email` edge function mevcut ama SMTP yapılandırması gerekli | Orta |
| 4 | `wallets` tablosunda `user_id` unique constraint yok | `ON CONFLICT (user_id)` referans kodunda çalışmayabilir | Orta |
| 5 | `seller_transactions.order_item_id` serial sequence kullanıyor | `order_items.id` UUID olduğu için `currval(pg_get_serial_sequence(...))` hata verebilir | Orta |
| 6 | Kargo ücreti her zaman 0 gönderiliyor | `shippingCost: 0` hard-coded, 300₺ altı kargo ücreti uygulanmıyor | Düşük |
| 7 | `personalDiscounts` hook checkout'ta import ediliyor ama kullanılmıyor | Dead code | Düşük |

---

## 🗄️ Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `products` | Ürünler (fiyat, stok, kategori, satıcı) |
| `product_variants` | Ürün varyantları (renk/ağırlık/koku) |
| `categories` | Kategoriler (alt kategori destekli) |
| `orders` | Siparişler |
| `order_items` | Sipariş kalemleri |
| `profiles` | Kullanıcı profilleri |
| `user_roles` | Rol atamaları (admin/user/seller) |
| `addresses` | Kullanıcı adresleri |
| `favorites` | Favori ürünler |
| `reviews` | Ürün yorumları |
| `product_questions` | Ürün soru-cevap |
| `coupons` / `coupon_uses` | Kupon sistemi |
| `campaigns` | Kampanyalar |
| `wallets` / `wallet_transactions` | Cüzdan sistemi |
| `affiliate_links` | Referans linkleri |
| `sellers` | Satıcı bilgileri |
| `seller_applications` | Satıcı başvuruları |
| `seller_transactions` | Satıcı komisyon takibi |
| `seller_notifications` | Satıcı bildirimleri |
| `seller_points_history` | Puan geçmişi |
| `seller_point_packages` | Puan paketleri |
| `seller_settings` | Satıcı ayarları |
| `user_carts` | Kullanıcı sepetleri (admin görüntüleme + indirim) |
| `payment_settings` | Ödeme yöntemi yapılandırmaları |
| `payment_transactions` | Ödeme işlem kayıtları |
| `shipping_companies` | Kargo şirketleri |
| `invoices` | Faturalar |
| `email_logs` | E-posta kayıtları |
| `conversations` / `messages` / `message_attachments` | Mesajlaşma |
| `contact_messages` | İletişim formu mesajları |
| `newsletter_subscribers` | Bülten aboneleri |
| `site_settings` | Site ayarları |
| `social_media_links` | Sosyal medya linkleri |
| `faqs` | Sık sorulan sorular |
| `related_products` | İlişkili ürünler |
| `product_comparisons` | Ürün karşılaştırma |

---

## 🔐 Güvenlik

- **RLS (Row Level Security)**: Tüm tablolarda aktif
- **RBAC**: `is_admin()`, `is_seller()`, `has_role()` fonksiyonları
- **SECURITY DEFINER**: Sipariş oluşturma sunucu tarafında doğrulanır
- **Ödeme Ayarları**: Config bilgileri sadece admin'e görünür (`payment_settings_public` view)

---

## 📁 Proje Yapısı

```
src/
├── components/
│   ├── admin/        # Admin bileşenleri
│   ├── cart/          # Sepet bileşenleri
│   ├── chat/          # Mesajlaşma
│   ├── checkout/      # Ödeme bileşenleri
│   ├── home/          # Ana sayfa bölümleri
│   ├── layout/        # Header, Footer, Layout
│   ├── products/      # Ürün kartları, zoom, badge'ler
│   ├── search/        # Arama dialog
│   ├── seller/        # Satıcı bileşenleri
│   └── ui/            # Shadcn UI bileşenleri
├── contexts/          # Auth, Cart context'leri
├── hooks/             # Tüm custom hook'lar
├── pages/             # Sayfa bileşenleri
│   ├── account/       # Hesap sayfaları
│   ├── admin/         # Admin sayfaları
│   ├── legal/         # Yasal sayfalar
│   └── seller/        # Satıcı sayfaları
├── lib/               # Utility fonksiyonlar, fatura üretici
└── integrations/      # Supabase client & types
```

---

## 🚀 Sonraki Adımlar (Öneriler)

1. **Gerçek Ödeme Entegrasyonu**: Shopier/Payizone API key'lerini ekleyip test etmek
2. **E-posta Bildirimleri**: SMTP yapılandırması ile sipariş bildirimleri
3. **Wallet Unique Constraint**: `user_id` üzerinde unique index ekleme
4. **Kargo Ücreti Düzeltmesi**: 300₺ altı siparişlerde kargo ücretinin doğru uygulanması
5. **Kredi Kartı Alanlarının Kaldırılması**: Harici ödeme kullanıldığında gereksiz kart formu gizlenmeli
6. **Sipariş E-postaları**: Otomatik sipariş onay ve kargo bilgi e-postaları
7. **Stok Uyarıları**: Düşük stok bildirimleri
