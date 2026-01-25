import { Link } from "react-router-dom";
import { ChevronRight, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";

const ReturnPolicy = () => {
  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">İade ve İptal Koşulları</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">
            İade ve İptal Koşulları
          </h1>

          {/* Quick Info */}
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
            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              İade Hakkı
            </h2>
            <p className="text-muted-foreground mb-4">
              Satın aldığınız ürünleri, teslim tarihinden itibaren 14 gün içinde 
              herhangi bir gerekçe göstermeksizin iade edebilirsiniz. Bu süre, 
              ürünün tarafınıza veya belirttiğiniz üçüncü kişiye teslim edildiği 
              gün başlar.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              İade Şartları
            </h2>
            <p className="text-muted-foreground mb-4">
              İade edilecek ürünlerin aşağıdaki şartları karşılaması gerekmektedir:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Ürün ambalajı açılmamış ve orijinal durumda olmalıdır</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Ürün kullanılmamış olmalıdır</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Fatura veya teslimat belgesi iade paketine eklenmelidir</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Ürün orijinal ambalajı ile birlikte iade edilmelidir</span>
              </li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              İade Edilemeyen Ürünler
            </h2>
            <p className="text-muted-foreground mb-4">
              Aşağıdaki ürünler için cayma hakkı kullanılamaz:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Ambalajı açılmış kozmetik ve kişisel bakım ürünleri</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Tek kullanımlık ürünler</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Çabuk bozulabilir veya son kullanma tarihi geçebilecek ürünler</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Hijyen açısından iade edilmesi uygun olmayan ürünler</span>
              </li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              İade Süreci
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">İade Talebi Oluşturun</p>
                  <p className="text-sm text-muted-foreground">
                    Hesabınızdan veya müşteri hizmetlerimizi arayarak iade talebinde bulunun.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Ürünü Paketleyin</p>
                  <p className="text-sm text-muted-foreground">
                    Ürünü orijinal ambalajı ve faturası ile birlikte paketleyin.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Kargoya Verin</p>
                  <p className="text-sm text-muted-foreground">
                    Anlaşmalı kargo firmamız ücretsiz olarak adresinizden alım yapacaktır.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Para İadesi</p>
                  <p className="text-sm text-muted-foreground">
                    Ürün tarafımıza ulaştıktan sonra 3-5 iş günü içinde ödemeniz iade edilir.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Sipariş İptali
            </h2>
            <p className="text-muted-foreground mb-4">
              Siparişiniz kargoya verilmeden önce iptal etmek isterseniz, müşteri 
              hizmetlerimizi arayarak veya hesabınızdan iptal talebinde bulunabilirsiniz. 
              Kargoya verilmiş siparişler için iade prosedürü uygulanır.
            </p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">
              Hasarlı veya Hatalı Ürün
            </h2>
            <p className="text-muted-foreground mb-4">
              Teslim aldığınız ürün hasarlı veya hatalı ise, 48 saat içinde müşteri 
              hizmetlerimize bildiriniz. Ürünün fotoğrafları talep edilebilir. Hasarlı 
              veya hatalı ürünler için kargo ücreti tarafımızca karşılanır ve yeni ürün 
              gönderilir veya para iadesi yapılır.
            </p>

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>İade ve İptal Destek Hattı</strong><br />
                Telefon: +90 (212) 123 45 67<br />
                E-posta: iade@medea.com.tr<br />
                Çalışma Saatleri: Pazartesi - Cuma 09:00 - 18:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnPolicy;
