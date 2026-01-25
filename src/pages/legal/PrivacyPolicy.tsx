import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Gizlilik Politikası</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">
            Gizlilik Politikası
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">
              Son güncelleme: 25 Ocak 2024
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              1. Giriş
            </h2>
            <p className="text-muted-foreground mb-4">
              MEDEA Kozmetik olarak, gizliliğinize saygı duyuyoruz ve kişisel 
              bilgilerinizi korumayı taahhüt ediyoruz. Bu Gizlilik Politikası, 
              web sitemizi ziyaret ettiğinizde veya hizmetlerimizi kullandığınızda 
              bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu 
              açıklamaktadır.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              2. Topladığımız Bilgiler
            </h2>
            <p className="text-muted-foreground mb-4">
              Sizden doğrudan veya dolaylı olarak aşağıdaki bilgileri toplayabiliriz:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong>Kişisel bilgiler:</strong> Ad, soyad, e-posta adresi, telefon 
                  numarası, teslimat adresi</li>
              <li><strong>Ödeme bilgileri:</strong> Kredi kartı bilgileri (güvenli ödeme 
                  sağlayıcıları aracılığıyla işlenir)</li>
              <li><strong>Cihaz bilgileri:</strong> IP adresi, tarayıcı türü, işletim sistemi</li>
              <li><strong>Kullanım bilgileri:</strong> Ziyaret ettiğiniz sayfalar, tıkladığınız 
                  bağlantılar, alışveriş tercihleri</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              3. Bilgilerin Kullanımı
            </h2>
            <p className="text-muted-foreground mb-4">
              Topladığımız bilgileri şu amaçlarla kullanırız:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Siparişlerinizi işlemek ve teslim etmek</li>
              <li>Hesabınızı yönetmek</li>
              <li>Müşteri desteği sağlamak</li>
              <li>Size ürün güncellemeleri ve promosyonlar göndermek (onayınız dahilinde)</li>
              <li>Web sitemizi ve hizmetlerimizi geliştirmek</li>
              <li>Dolandırıcılığı önlemek ve güvenliği sağlamak</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              4. Çerezler
            </h2>
            <p className="text-muted-foreground mb-4">
              Web sitemiz, deneyiminizi iyileştirmek için çerezler kullanmaktadır. 
              Çerezler, tarayıcınıza yerleştirilen küçük metin dosyalarıdır. Kullandığımız 
              çerez türleri:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li><strong>Zorunlu çerezler:</strong> Web sitesinin çalışması için gerekli</li>
              <li><strong>Analitik çerezler:</strong> Ziyaretçi davranışlarını anlamamıza yardımcı olur</li>
              <li><strong>Pazarlama çerezleri:</strong> Size özelleştirilmiş reklamlar göstermek için</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              5. Bilgi Paylaşımı
            </h2>
            <p className="text-muted-foreground mb-4">
              Kişisel bilgilerinizi üçüncü taraflarla yalnızca şu durumlarda paylaşırız:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>Siparişinizi teslim etmek için (kargo şirketleri)</li>
              <li>Ödemenizi işlemek için (ödeme sağlayıcıları)</li>
              <li>Yasal zorunluluklar gereği (yetkili makamlar)</li>
              <li>Açık onayınız olduğunda</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              6. Veri Güvenliği
            </h2>
            <p className="text-muted-foreground mb-4">
              Kişisel bilgilerinizi korumak için uygun teknik ve organizasyonel önlemler 
              alıyoruz. Bunlar arasında SSL şifreleme, güvenli sunucular ve erişim 
              kontrolleri bulunmaktadır.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              7. Haklarınız
            </h2>
            <p className="text-muted-foreground mb-4">
              KVKK kapsamında kişisel verilerinizle ilgili çeşitli haklara sahipsiniz. 
              Detaylı bilgi için KVKK Aydınlatma Metnimizi inceleyebilirsiniz.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              8. İletişim
            </h2>
            <p className="text-muted-foreground mb-4">
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>MEDEA Kozmetik Ticaret Limited Şirketi</strong><br />
                E-posta: gizlilik@medea.com.tr<br />
                Telefon: +90 (212) 123 45 67
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
