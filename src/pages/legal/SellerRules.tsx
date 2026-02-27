import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useGeneralSettings, useContactSettings } from "@/hooks/useSiteSettings";

const SellerRules = () => {
  const { data: general } = useGeneralSettings();
  const { data: contact } = useContactSettings();
  const siteName = general?.site_name || "MEDEA";
  const email = contact?.email || "info@medea.com.tr";
  const phone = contact?.phone || "+90 (212) 123 45 67";

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Satıcı Kuralları</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-8">
            {siteName} Pazaryeri Satıcı Kuralları ve Politikaları
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-muted-foreground">Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">1. Satıcı Olma Şartları</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Gerçek veya tüzel kişi olarak ticari faaliyet yürütüyor olmak</li>
              <li>Geçerli vergi numarası ve T.C. kimlik numarasına sahip olmak</li>
              <li>Başvuru formundaki tüm bilgileri eksiksiz ve doğru şekilde doldurmak</li>
              <li>Banka hesap bilgilerini (IBAN) doğru şekilde sağlamak</li>
              <li>Admin onayı sonrası satıcı hesabı aktif hale gelir</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">2. Ürün Listeleme Kuralları</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Yalnızca yasal ve {siteName} politikalarına uygun ürünler listelenebilir</li>
              <li>Ürün fotoğrafları net, gerçek ve yanıltıcı olmayan kalitede olmalıdır</li>
              <li>Ürün açıklamaları doğru, detaylı ve Türkçe dil kurallarına uygun olmalıdır</li>
              <li>Fiyatlandırma piyasa koşullarına uygun ve adil olmalıdır</li>
              <li>Stok bilgileri güncel tutulmalıdır</li>
              <li>Eklenen ürünler admin onayından geçtikten sonra yayınlanır</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">3. Sipariş ve Kargo</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Siparişler en geç 48 saat içinde hazırlanmalıdır</li>
              <li>Kargo takip numarası sisteme girilmelidir</li>
              <li>Ürünler güvenli şekilde paketlenmelidir</li>
              <li>Anlaşmalı kargo firmaları kullanılmalıdır</li>
              <li>Teslimat süreleri konusunda müşteri bilgilendirilmelidir</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">4. Komisyon ve Ödeme</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Varsayılan komisyon oranı %15'tir (admin tarafından değiştirilebilir)</li>
              <li>Satıcı ürünleri için yalnızca kredi kartı ile ödeme kabul edilir</li>
              <li>Hak edişler sipariş teslim edildikten sonra hesaplanır</li>
              <li>Ödemeler belirtilen banka hesabına yapılır</li>
              <li>Fatura ve kazanç raporları satıcı panelinden takip edilebilir</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">5. İtibar ve Puan Sistemi</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Her satıcı 100 başlangıç itibar puanıyla başlar</li>
              <li>Olumlu müşteri değerlendirmeleri puan kazandırır</li>
              <li>Geç kargo, iade, şikayet gibi durumlar ceza puanı oluşturur</li>
              <li>Belirli ceza eşiğine ulaşan hesaplar otomatik askıya alınır</li>
              <li>İtibar puanları ile ürün öne çıkarma yapılabilir</li>
              <li>Ek puanlar satın alınabilir</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">6. Yasaklar ve İhlaller</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Sahte, taklit veya kaçak ürün satışı kesinlikle yasaktır</li>
              <li>Yanıltıcı ürün bilgisi veya görsel kullanmak yasaktır</li>
              <li>Platform dışı ödeme yönlendirmesi yasaktır</li>
              <li>Müşteri bilgilerinin kötüye kullanımı yasaktır</li>
              <li>Sahte yorum veya sipariş manipülasyonu yasaktır</li>
              <li>İhlal durumunda hesap askıya alınabilir veya kapatılabilir</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">7. İade ve İptal</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Müşteri yasal hakları çerçevesinde 14 gün içinde iade yapabilir</li>
              <li>İade masrafları satıcı kaynaklı hatalarda satıcıya aittir</li>
              <li>İade edilen ürünler kontrol edildikten sonra iade işlemi tamamlanır</li>
              <li>Müşteri şikayetlerine 24 saat içinde yanıt verilmelidir</li>
            </ul>

            <h2 className="font-serif text-xl font-medium text-foreground mt-8 mb-4">8. İletişim</h2>
            <p className="text-muted-foreground">
              Satıcı kuralları hakkında sorularınız için bizimle iletişime geçebilirsiniz.
            </p>

            <div className="mt-4 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{siteName}</strong><br />
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

export default SellerRules;
