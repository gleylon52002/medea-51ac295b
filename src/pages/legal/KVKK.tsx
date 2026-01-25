import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";

const KVKK = () => {
  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
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
            <p className="text-muted-foreground mb-6">
              Son güncelleme: 25 Ocak 2024
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              1. Veri Sorumlusu
            </h2>
            <p className="text-muted-foreground mb-4">
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel 
              verileriniz; veri sorumlusu olarak MEDEA Kozmetik Ticaret Limited Şirketi 
              ("MEDEA" veya "Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              2. Kişisel Verilerin İşlenme Amaçları
            </h2>
            <p className="text-muted-foreground mb-4">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Ürün ve hizmetlerin sunulması</li>
              <li>Sipariş işlemlerinin gerçekleştirilmesi</li>
              <li>Müşteri ilişkileri yönetimi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Pazarlama ve iletişim faaliyetleri (onayınız dahilinde)</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              3. İşlenen Kişisel Veriler
            </h2>
            <p className="text-muted-foreground mb-4">
              İşlenen kişisel veri kategorileri şunlardır:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Kimlik bilgileri (ad, soyad, T.C. kimlik numarası)</li>
              <li>İletişim bilgileri (adres, telefon, e-posta)</li>
              <li>Müşteri işlem bilgileri (sipariş geçmişi, ödeme bilgileri)</li>
              <li>Pazarlama bilgileri (çerez verileri, tercihler)</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              4. Kişisel Verilerin Aktarımı
            </h2>
            <p className="text-muted-foreground mb-4">
              Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi 
              doğrultusunda; iş ortaklarımıza, tedarikçilerimize, kargo şirketlerine, 
              ödeme kuruluşlarına ve kanunen yetkili kamu kurumlarına aktarılabilir.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi
            </h2>
            <p className="text-muted-foreground mb-4">
              Kişisel verileriniz; internet sitesi, mobil uygulama, müşteri hizmetleri 
              kanalları aracılığıyla otomatik ve otomatik olmayan yollarla toplanmaktadır. 
              Hukuki sebepler: sözleşmenin kurulması ve ifası, yasal yükümlülük, meşru 
              menfaat ve açık rızanızdır.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              6. Haklarınız
            </h2>
            <p className="text-muted-foreground mb-4">
              KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz 
                  edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde 
                  zararın giderilmesini talep etme</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              7. Başvuru
            </h2>
            <p className="text-muted-foreground mb-4">
              Haklarınızı kullanmak için kvkk@medea.com.tr adresine e-posta gönderebilir 
              veya şirket adresimize yazılı başvuruda bulunabilirsiniz.
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>MEDEA Kozmetik Ticaret Limited Şirketi</strong><br />
                Adres: Caferağa Mah. Moda Cad. No: 123, Kadıköy, İstanbul<br />
                E-posta: kvkk@medea.com.tr<br />
                Telefon: +90 (212) 123 45 67
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KVKK;
