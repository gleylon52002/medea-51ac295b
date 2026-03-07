import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Mail, ArrowRight, Loader2, AlertCircle, Clock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useOrderByNumber } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const paymentStatus = searchParams.get("payment");
  const status = searchParams.get("status"); // from payment provider redirect
  const { data: order, isLoading } = useOrderByNumber(orderNumber);

  const isPending = paymentStatus === "pending" || status === "pending";
  const isFailed = status === "failed";

  return (
    <Layout>
      <div className="container-main py-16 lg:py-24">
        <div className="max-w-lg mx-auto text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isFailed ? "bg-red-100" : isPending ? "bg-amber-100" : "bg-green-100"
          }`}>
            {isFailed ? (
              <AlertCircle className="h-10 w-10 text-red-600" />
            ) : isPending ? (
              <Clock className="h-10 w-10 text-amber-600" />
            ) : (
              <CheckCircle className="h-10 w-10 text-green-600" />
            )}
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-4">
            {isFailed 
              ? "Ödeme Başarısız" 
              : isPending 
                ? "Ödeme Bekleniyor" 
                : "Siparişiniz Alındı!"
            }
          </h1>

          <p className="text-muted-foreground mb-8">
            {isFailed
              ? "Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi seçin."
              : isPending
                ? "Siparişiniz oluşturuldu, ödeme onayı bekleniyor. Onay sonrası siparişiniz hazırlanacaktır."
                : "Siparişiniz başarıyla oluşturuldu. Sipariş detaylarını e-posta adresinize gönderdik."
            }
          </p>

          <div className="bg-muted/30 rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">Sipariş Numaranız</p>
            <p className="text-2xl font-semibold text-foreground">{orderNumber || "—"}</p>
            {isLoading ? (
              <div className="flex justify-center mt-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : order && (
              <div className="mt-4 pt-4 border-t border-border text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Ara Toplam:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Kargo:</span>
                  <span>{order.shipping_cost === 0 ? "Ücretsiz" : formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Toplam:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                {order.payment_status && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ödeme Durumu:</span>
                      <span className={`font-medium ${
                        order.payment_status === "paid" ? "text-green-600" :
                        order.payment_status === "failed" ? "text-red-600" : "text-amber-600"
                      }`}>
                        {order.payment_status === "paid" ? "Ödendi" :
                         order.payment_status === "failed" ? "Başarısız" : "Beklemede"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
