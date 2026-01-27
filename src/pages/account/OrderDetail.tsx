import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Package, Truck, MapPin, CreditCard, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { useOrderByNumber } from "@/hooks/useOrders";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const statusMap: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Beklemede", variant: "secondary" },
  confirmed: { label: "Onaylandı", variant: "default" },
  preparing: { label: "Hazırlanıyor", variant: "default" },
  shipped: { label: "Kargoda", variant: "default" },
  delivered: { label: "Teslim Edildi", variant: "outline" },
  cancelled: { label: "İptal Edildi", variant: "destructive" },
};

const paymentStatusMap: Record<PaymentStatus, string> = {
  pending: "Bekliyor",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade Edildi",
};

const paymentMethodMap: Record<PaymentMethod, string> = {
  credit_card: "Kredi / Banka Kartı",
  bank_transfer: "Havale / EFT",
  cash_on_delivery: "Kapıda Ödeme",
};

interface ShippingAddress {
  full_name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  district: string;
  postal_code?: string;
}

const OrderDetail = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { data: order, isLoading, error } = useOrderByNumber(orderNumber || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Sipariş bulunamadı.</p>
        <Button asChild>
          <Link to="/hesabim/siparisler">Siparişlere Dön</Link>
        </Button>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as unknown as ShippingAddress;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/hesabim/siparisler">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="font-serif text-xl font-medium">Sipariş #{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Status & Payment */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sipariş Durumu</span>
          </div>
          <Badge variant={statusMap[order.status].variant}>
            {statusMap[order.status].label}
          </Badge>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ödeme Durumu</span>
          </div>
          <p className="font-medium">{paymentStatusMap[order.payment_status]}</p>
        </div>
      </div>

      {/* Tracking */}
      {order.tracking_number && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Kargo Takip</span>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Takip No: </span>
            <span className="font-mono">{order.tracking_number}</span>
          </p>
          {order.shipping_company && (
            <p className="text-sm text-muted-foreground mt-1">
              Kargo: {order.shipping_company}
            </p>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="border border-border rounded-lg overflow-hidden mb-6">
        <div className="p-4 bg-muted/30 border-b border-border">
          <h3 className="font-medium">Ürünler</h3>
        </div>
        <div className="divide-y divide-border">
          {order.order_items.map((item) => (
            <div key={item.id} className="p-4 flex gap-4">
              <img
                src={item.product_image || "/placeholder.svg"}
                alt={item.product_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">Adet: {item.quantity}</p>
                <p className="text-sm text-muted-foreground">
                  Birim Fiyat: {formatPrice(item.unit_price)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(item.total_price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address & Payment Method */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Teslimat Adresi</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{shippingAddress.full_name}</p>
            <p>{shippingAddress.address}</p>
            <p>{shippingAddress.district}, {shippingAddress.city} {shippingAddress.postal_code}</p>
            <p>{shippingAddress.phone}</p>
          </div>
        </div>
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Ödeme Yöntemi</span>
          </div>
          <p className="text-sm">{paymentMethodMap[order.payment_method]}</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ara Toplam</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kargo</span>
            <span>{order.shipping_cost === 0 ? "Ücretsiz" : formatPrice(order.shipping_cost)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-base">
            <span>Toplam</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="mt-6 p-4 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Sipariş Notu</span>
          </div>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
