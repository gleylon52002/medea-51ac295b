import { Link } from "react-router-dom";
import { ChevronRight, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useGeneralSettings, useContactSettings } from "@/hooks/useSiteSettings";

const ReturnPolicy = () => {
  const { data: general } = useGeneralSettings();
  const { data: contact } = useContactSettings();
  const siteName = general?.site_name || "MEDEA";
  const email = contact?.email || "iade@medea.com.tr";
  const phone = contact?.phone || "+90 (212) 123 45 67";

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">İade ve İptal Koşulları</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">İade ve İptal Koşulları</h1>

          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <div className="bg-secondary/30 rounded-xl p-6 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="font-medium">14 Gün</p>
              <p className="text-sm text-muted-foreground">İade Süresi</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-6 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="font-medium">Ücretsiz</p>
              <p className="text-sm text-muted-foreground">Kargo İadesi</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-6 text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="font-medium">3-5 İş Günü</p>
              <p className="text-sm text-muted-foreground">Para İadesi</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">İade Hakkı</h2>
            <p className="text-muted-foreground mb-4">
              Satın aldığınız ürünleri, teslim tarihinden itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin iade edebilirsiniz.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">İade Şartları</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">Ürün ambalajı açılmamış ve orijinal durumda olmalıdır</span></li>
              <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">Ürün kullanılmamış olmalıdır</span></li>
              <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">Fatura veya teslimat belgesi iade paketine eklenmelidir</span></li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">İade Edilemeyen Ürünler</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3"><XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">Ambalajı açılmış kozmetik ve kişisel bakım ürünleri</span></li>
              <li className="flex items-start gap-3"><XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">Tek kullanımlık ürünler</span></li>
              <li className="flex items-start gap-3"><XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">Çabuk bozulabilir veya son kullanma tarihi geçebilecek ürünler</span></li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">Pazaryeri Ürün İadeleri</h2>
            <p className="text-muted-foreground mb-4">
              {siteName} pazaryerinde satılan ürünlerin iadesi, ilgili satıcı tarafından yönetilir. İade taleplerinizi satıcıya mesaj göndererek iletebilirsiniz. {siteName}, aracı platform olarak iade sürecinin takibini sağlar.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">İade Süreci</h2>
            <div className="space-y-4 mb-6">
              {["İade talebi oluşturun", "Ürünü orijinal ambalajı ile paketleyin", "Kargoya verin", "3-5 iş günü içinde para iadesi"].map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">{i + 1}</div>
                  <p className="text-muted-foreground pt-1">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>İade ve İptal Destek</strong><br />
                Telefon: {phone}<br />
                E-posta: {email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnPolicy;
