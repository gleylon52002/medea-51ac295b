import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useGeneralSettings, useContactSettings } from "@/hooks/useSiteSettings";

const CookiePolicy = () => {
  const { data: general } = useGeneralSettings();
  const { data: contact } = useContactSettings();
  const siteName = general?.site_name || "MEDEA";
  const companyName = `${siteName} Kozmetik Ticaret Limited Şirketi`;
  const email = contact?.email || "gizlilik@medea.com.tr";
  const phone = contact?.phone || "+90 (212) 123 45 67";

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Çerez Politikası</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">Çerez (Cookie) Politikası</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Çerez Nedir?</h2>
            <p className="text-muted-foreground mb-4">
              Çerezler, web sitelerinin cihazınıza yerleştirdiği küçük metin dosyalarıdır. Bu dosyalar, web sitesinin sizi hatırlamasını, tercihlerinizi kaydetmesini ve size daha iyi bir deneyim sunmasını sağlar.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Kullandığımız Çerez Türleri</h2>
            
            <h3 className="font-medium text-foreground mt-6 mb-3">Zorunlu Çerezler</h3>
            <p className="text-muted-foreground mb-4">
              Web sitesinin düzgün çalışması için gereklidir. Sepet, oturum yönetimi ve güvenlik için kullanılır.
            </p>

            <h3 className="font-medium text-foreground mt-6 mb-3">Performans ve Analitik Çerezler</h3>
            <p className="text-muted-foreground mb-4">
              Ziyaretçilerin web sitemizi nasıl kullandığını anlamamıza yardımcı olur. Google Analytics ve site içi analitik araçları bu kategoriye girer.
            </p>

            <h3 className="font-medium text-foreground mt-6 mb-3">Pazarlama Çerezleri</h3>
            <p className="text-muted-foreground mb-4">
              Size özelleştirilmiş reklamlar göstermek ve pazarlama kampanyalarımızın etkinliğini ölçmek için kullanılır. Onayınız olmadan bu çerezler kullanılmaz.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Çerezleri Yönetme</h2>
            <p className="text-muted-foreground mb-4">
              Çerez tercihlerinizi istediğiniz zaman tarayıcınızın ayarlarından değiştirebilirsiniz. Ancak bazı çerezleri devre dışı bırakmak, web sitemizin bazı özelliklerinin düzgün çalışmamasına neden olabilir.
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{companyName}</strong><br />
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

export default CookiePolicy;
