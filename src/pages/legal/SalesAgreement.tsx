import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useGeneralSettings, useContactSettings } from "@/hooks/useSiteSettings";

const SalesAgreement = () => {
  const { data: general } = useGeneralSettings();
  const { data: contact } = useContactSettings();
  const siteName = general?.site_name || "MEDEA";
  const companyName = `${siteName} Kozmetik Ticaret Limited Şirketi`;
  const email = contact?.email || "info@medea.com.tr";
  const phone = contact?.phone || "+90 (212) 123 45 67";
  const address = contact?.address || "Türkiye";

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Mesafeli Satış Sözleşmesi</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">Mesafeli Satış Sözleşmesi</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Madde 1 - Taraflar</h2>
            <p className="text-muted-foreground mb-4">
              <strong>SATICI:</strong><br />
              Unvan: {companyName}<br />
              Adres: {address}<br />
              Telefon: {phone}<br />
              E-posta: {email}
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>ALICI:</strong><br />
              Sipariş sırasında beyan edilen ad, soyad, adres ve iletişim bilgileri.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Madde 2 - Sözleşmenin Konusu</h2>
            <p className="text-muted-foreground mb-4">
              İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesinden elektronik ortamda siparişini verdiği, sözleşmede belirtilen niteliklere sahip mal/hizmetin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Madde 3 - Ürün Bilgileri</h2>
            <p className="text-muted-foreground mb-4">
              Ürünlerin temel özellikleri (türü, miktarı, rengi, fiyatı vb.) ürünün satış sayfasında belirtilmektedir. Satıcı, siparişin iletilmesinden önce alıcıyı tüm bu özellikler hakkında bilgilendirmiştir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Madde 4 - Ödeme ve Teslimat</h2>
            <p className="text-muted-foreground mb-4">
              <strong>4.1 Ödeme:</strong> Kabul edilen ödeme yöntemleri: Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme (kimlik doğrulama gereklidir).
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>4.2 Teslimat:</strong> Ürünler, sipariş onayından itibaren en geç 30 gün içinde teslim edilecektir. Ortalama teslimat süresi 2-5 iş günüdür.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>4.3 Kargo:</strong> 300 TL üzeri siparişlerde kargo ücretsizdir. 300 TL altı siparişlerde kargo ücreti 29,90 TL'dir.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>4.4 Pazaryeri Ürünleri:</strong> {siteName} pazaryerinde satıcılar tarafından listelenen ürünlerin satışı ve teslimatı ilgili satıcı tarafından gerçekleştirilir. {siteName}, aracı platform olarak komisyon kesintisi uygular.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Madde 5 - Cayma Hakkı</h2>
            <p className="text-muted-foreground mb-4">
              ALICI, satın aldığı ürünü teslim tarihinden itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir.
            </p>
            <p className="text-muted-foreground mb-4"><strong>Cayma hakkının kullanılamayacağı ürünler:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Ambalajı açılmış kozmetik ve kişisel bakım ürünleri</li>
              <li>Tek kullanımlık ürünler</li>
              <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Madde 6 - Genel Hükümler</h2>
            <p className="text-muted-foreground mb-4">
              Bu sözleşmeden doğabilecek uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Bu sözleşme, sipariş tarihinde elektronik ortamda taraflarca okunarak kabul edilmiştir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesAgreement;
