import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";

const CookiePolicy = () => {
  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Çerez Politikası</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">
            Çerez (Cookie) Politikası
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">
              Son güncelleme: 25 Ocak 2024
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Çerez Nedir?
            </h2>
            <p className="text-muted-foreground mb-4">
              Çerezler, web sitelerinin cihazınıza yerleştirdiği küçük metin dosyalarıdır. 
              Bu dosyalar, web sitesinin sizi hatırlamasını, tercihlerinizi kaydetmesini 
              ve size daha iyi bir deneyim sunmasını sağlar.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Kullandığımız Çerez Türleri
            </h2>
            
            <h3 className="font-medium text-foreground mt-6 mb-3">Zorunlu Çerezler</h3>
            <p className="text-muted-foreground mb-4">
              Bu çerezler, web sitesinin düzgün çalışması için gereklidir. Sepetinize 
              ürün eklemenizi, ödeme yapmanızı ve hesabınıza giriş yapmanızı sağlarlar. 
              Bu çerezler devre dışı bırakılamaz.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Çerez Adı</th>
                    <th className="text-left py-2">Süre</th>
                    <th className="text-left py-2">Amaç</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2">session_id</td>
                    <td className="py-2">Oturum</td>
                    <td className="py-2">Oturum yönetimi</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">cart</td>
                    <td className="py-2">7 gün</td>
                    <td className="py-2">Sepet bilgileri</td>
                  </tr>
                  <tr>
                    <td className="py-2">csrf_token</td>
                    <td className="py-2">Oturum</td>
                    <td className="py-2">Güvenlik</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-medium text-foreground mt-6 mb-3">Performans ve Analitik Çerezler</h3>
            <p className="text-muted-foreground mb-4">
              Bu çerezler, ziyaretçilerin web sitemizi nasıl kullandığını anlamamıza 
              yardımcı olur. Hangi sayfaların en çok ziyaret edildiğini, kullanıcıların 
              sitede ne kadar zaman geçirdiğini ve hata mesajlarını izlememizi sağlar.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Çerez Adı</th>
                    <th className="text-left py-2">Süre</th>
                    <th className="text-left py-2">Amaç</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2">_ga</td>
                    <td className="py-2">2 yıl</td>
                    <td className="py-2">Google Analytics</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gid</td>
                    <td className="py-2">24 saat</td>
                    <td className="py-2">Google Analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-medium text-foreground mt-6 mb-3">Pazarlama Çerezleri</h3>
            <p className="text-muted-foreground mb-4">
              Bu çerezler, size özelleştirilmiş reklamlar göstermek ve pazarlama 
              kampanyalarımızın etkinliğini ölçmek için kullanılır. Onayınız olmadan 
              bu çerezler kullanılmaz.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Çerez Adı</th>
                    <th className="text-left py-2">Süre</th>
                    <th className="text-left py-2">Amaç</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2">_fbp</td>
                    <td className="py-2">3 ay</td>
                    <td className="py-2">Facebook Pixel</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gcl_au</td>
                    <td className="py-2">3 ay</td>
                    <td className="py-2">Google Ads</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Çerezleri Yönetme
            </h2>
            <p className="text-muted-foreground mb-4">
              Çerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz. Tarayıcınızın 
              ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Ancak bazı 
              çerezleri devre dışı bırakmak, web sitemizin bazı özelliklerinin düzgün 
              çalışmamasına neden olabilir.
            </p>
            <p className="text-muted-foreground mb-4">
              Popüler tarayıcılarda çerez ayarları:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/tr/kb/cerezleri-etkinlestirme-ve-devre-disi-birakma" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/tr-tr/microsoft-edge/microsoft-edge-de-%C3%A7erezleri-silme-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              İletişim
            </h2>
            <p className="text-muted-foreground mb-4">
              Çerez politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
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

export default CookiePolicy;
