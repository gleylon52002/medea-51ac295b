import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useGeneralSettings, useContactSettings } from "@/hooks/useSiteSettings";

const KVKK = () => {
  const { data: general } = useGeneralSettings();
  const { data: contact } = useContactSettings();
  const siteName = general?.site_name || "MEDEA";
  const companyName = `${siteName} Kozmetik Ticaret Limited Şirketi`;
  const email = contact?.email || "kvkk@medea.com.tr";
  const phone = contact?.phone || "+90 (212) 123 45 67";
  const address = contact?.address || "Türkiye";

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">KVKK Aydınlatma Metni</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">
            Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">1. Veri Sorumlusu</h2>
            <p className="text-muted-foreground mb-4">
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu olarak {companyName} ("{siteName}" veya "Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">2. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Ürün ve hizmetlerin sunulması</li>
              <li>Sipariş işlemlerinin gerçekleştirilmesi</li>
              <li>Pazaryeri satıcı başvurularının değerlendirilmesi</li>
              <li>Müşteri ilişkileri yönetimi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Pazarlama ve iletişim faaliyetleri (onayınız dahilinde)</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>Sadakat programı yönetimi</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">3. İşlenen Kişisel Veriler</h2>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Kimlik bilgileri (ad, soyad, T.C. kimlik numarası)</li>
              <li>İletişim bilgileri (adres, telefon, e-posta)</li>
              <li>Müşteri işlem bilgileri (sipariş geçmişi, ödeme bilgileri)</li>
              <li>Pazarlama bilgileri (çerez verileri, tercihler)</li>
              <li>Site kullanım verileri (ziyaret, tıklama, cihaz bilgileri)</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">4. Kişisel Verilerin Aktarımı</h2>
            <p className="text-muted-foreground mb-4">
              Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda; iş ortaklarımıza, tedarikçilerimize, pazaryeri satıcılarına, kargo şirketlerine, ödeme kuruluşlarına ve kanunen yetkili kamu kurumlarına aktarılabilir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
            <p className="text-muted-foreground mb-4">
              Kişisel verileriniz; internet sitesi, mobil uygulama, müşteri hizmetleri kanalları aracılığıyla otomatik ve otomatik olmayan yollarla toplanmaktadır. Hukuki sebepler: sözleşmenin kurulması ve ifası, yasal yükümlülük, meşru menfaat ve açık rızanızdır.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">6. Haklarınız</h2>
            <p className="text-muted-foreground mb-4">KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">7. Başvuru</h2>
            <p className="text-muted-foreground mb-4">
              Haklarınızı kullanmak için {email} adresine e-posta gönderebilir veya şirket adresimize yazılı başvuruda bulunabilirsiniz.
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{companyName}</strong><br />
                Adres: {address}<br />
                E-posta: {email}<br />
                Telefon: {phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KVKK;
