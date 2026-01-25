import { Link } from "react-router-dom";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const OrderSuccess = () => {
  const orderNumber = `MDA${Date.now().toString().slice(-8)}`;

  return (
    <Layout>
      <div className="container-main py-16 lg:py-24">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-4">
            Siparişiniz Alındı!
          </h1>

          <p className="text-muted-foreground mb-8">
            Siparişiniz başarıyla oluşturuldu. Sipariş detaylarını e-posta adresinize gönderdik.
          </p>

          <div className="bg-muted/30 rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">Sipariş Numaranız</p>
            <p className="text-2xl font-semibold text-foreground">{orderNumber}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">E-posta Onayı</p>
                <p className="text-xs text-muted-foreground">Sipariş detayları gönderildi</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">Kargo Takibi</p>
                <p className="text-xs text-muted-foreground">SMS ile bilgilendirileceksiniz</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/hesabim/siparisler">
                Siparişlerimi Görüntüle
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/urunler">Alışverişe Devam Et</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccess;
