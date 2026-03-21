import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Home } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <SEOHead title="Sayfa Bulunamadı | MEDEA Kozmetik" noIndex />
      <div className="container-main py-16 lg:py-24">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="font-serif text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-medium">Aradığınız Sayfa Bulunamadı</h2>
          <p className="text-muted-foreground">
            Bu sayfa taşınmış veya kaldırılmış olabilir. Aşağıdaki bağlantılardan devam edebilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild>
              <Link to="/"><Home className="h-4 w-4 mr-2" /> Ana Sayfa</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/urunler"><ShoppingBag className="h-4 w-4 mr-2" /> Doğal Sabunlarımızı Keşfet</Link>
            </Button>
          </div>

          <div className="pt-8 border-t">
            <h3 className="font-medium mb-4">Popüler Ürünler</h3>
            <div className="space-y-2 text-sm">
              <Link to="/urun/medea-limon-esansli-seffaf-banyo-sabunu--ferahlatici-dogal-kati-sabun" className="block text-primary hover:underline">
                Limon Esanslı Doğal Katı Sabun
              </Link>
              <Link to="/urun/medea-inek-sutlu-seffaf-banyo-sabunu--besleyici-dogal-kati-sabun" className="block text-primary hover:underline">
                İnek Sütlü Besleyici Sabun
              </Link>
              <Link to="/urun/medea-aktif-karbonlu-seffaf-banyo-sabunu--derin-temizleyici-dogal-kati-sabun" className="block text-primary hover:underline">
                Aktif Karbonlu Derin Temizleyici Sabun
              </Link>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-medium mb-3">Kategoriler</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/kategori/dogal-sabunlar">Doğal Sabunlar</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/kategori/yuz-maskeleri">Yüz Maskeleri</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/kategori/mumlar">Mumlar</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
