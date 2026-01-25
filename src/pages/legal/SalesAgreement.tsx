import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";

const SalesAgreement = () => {
  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Mesafeli Satış Sözleşmesi</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">
            Mesafeli Satış Sözleşmesi
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">
              Son güncelleme: 25 Ocak 2024
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 1 - Taraflar
            </h2>
            <p className="text-muted-foreground mb-4">
              <strong>SATICI:</strong><br />
              Unvan: MEDEA Kozmetik Ticaret Limited Şirketi<br />
              Adres: Caferağa Mah. Moda Cad. No: 123, Kadıköy, İstanbul<br />
              Telefon: +90 (212) 123 45 67<br />
              E-posta: info@medea.com.tr
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>ALICI:</strong><br />
              Sipariş sırasında beyan edilen ad, soyad, adres ve iletişim bilgileri.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 2 - Sözleşmenin Konusu
            </h2>
            <p className="text-muted-foreground mb-4">
              İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait www.medea.com.tr 
              internet sitesinden elektronik ortamda siparişini verdiği, sözleşmede 
              belirtilen niteliklere sahip mal/hizmetin satışı ve teslimi ile ilgili 
              olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli 
              Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve 
              yükümlülüklerini düzenler.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 3 - Ürün Bilgileri
            </h2>
            <p className="text-muted-foreground mb-4">
              Ürünlerin temel özellikleri (türü, miktarı, rengi, fiyatı vb.) ürünün 
              satış sayfasında belirtilmektedir. Satıcı, siparişin iletilmesinden 
              önce alıcıyı tüm bu özellikler hakkında bilgilendirmiştir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 4 - Ödeme ve Teslimat
            </h2>
            <p className="text-muted-foreground mb-4">
              <strong>4.1 Ödeme:</strong> Alıcı, siparişi onaylamadan önce ödeme yöntemini 
              seçecektir. Kabul edilen ödeme yöntemleri: Kredi kartı, banka kartı, 
              havale/EFT ve kapıda ödeme.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>4.2 Teslimat:</strong> Ürünler, sipariş onayından itibaren en geç 
              30 gün içinde teslim edilecektir. Teslimat süresi, ürün stok durumuna ve 
              kargo mesafesine göre değişebilir. Ortalama teslimat süresi 2-5 iş günüdür.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>4.3 Kargo:</strong> 300 TL üzeri siparişlerde kargo ücretsizdir. 
              300 TL altı siparişlerde kargo ücreti 29,90 TL'dir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 5 - Cayma Hakkı
            </h2>
            <p className="text-muted-foreground mb-4">
              ALICI, satın aldığı ürünü teslim tarihinden itibaren 14 (on dört) gün 
              içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin 
              cayma hakkına sahiptir. Cayma hakkı süresi, hizmet ifasına ilişkin 
              sözleşmelerde sözleşmenin kurulduğu gün; mal teslimine ilişkin 
              sözleşmelerde ise tüketicinin veya belirlediği üçüncü kişinin malı 
              teslim aldığı gün başlar.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Cayma hakkının kullanılamayacağı ürünler:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Ambalajı açılmış kozmetik ve kişisel bakım ürünleri</li>
              <li>Tek kullanımlık ürünler</li>
              <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 6 - Cayma Hakkının Kullanılması
            </h2>
            <p className="text-muted-foreground mb-4">
              Cayma hakkını kullanmak isteyen ALICI, bu talebini yazılı olarak veya 
              kalıcı veri saklayıcısı ile SATICI'ya bildirmelidir. SATICI, cayma 
              bildiriminin kendisine ulaşmasından itibaren 14 gün içinde ürün bedelini 
              ALICI'ya iade edecektir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 7 - Genel Hükümler
            </h2>
            <p className="text-muted-foreground mb-4">
              7.1 ALICI, bu sözleşmeyi kabul etmekle, sipariş onayı öncesinde SATICI 
              tarafından sağlanan ön bilgilendirme formunu ve cayma hakkı formunu 
              okuduğunu, anladığını ve kabul ettiğini beyan eder.
            </p>
            <p className="text-muted-foreground mb-4">
              7.2 Bu sözleşmeden doğabilecek uyuşmazlıklarda Tüketici Hakem Heyetleri 
              ve Tüketici Mahkemeleri yetkilidir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Madde 8 - Yürürlük
            </h2>
            <p className="text-muted-foreground mb-4">
              ALICI, siparişi onayladığında bu sözleşmenin tüm koşullarını kabul 
              etmiş sayılır. SATICI, siparişin gerçekleşmesi öncesinde işbu sözleşmenin 
              tüm koşullarının ALICI tarafından okunduğuna dair onay alır.
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Bu sözleşme, sipariş tarihinde elektronik ortamda taraflarca 
                okunarak kabul edilmiştir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesAgreement;
