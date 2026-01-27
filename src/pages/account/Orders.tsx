import { Link } from "react-router-dom";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useOrders } from "@/hooks/useOrders";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusMap: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Beklemede", variant: "secondary" },
  confirmed: { label: "Onaylandı", variant: "default" },
  preparing: { label: "Hazırlanıyor", variant: "default" },
  shipped: { label: "Kargoda", variant: "default" },
  delivered: { label: "Teslim Edildi", variant: "outline" },
  cancelled: { label: "İptal Edildi", variant: "destructive" },
};

const Orders = () => {
  const { data: orders, isLoading, error } = useOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Siparişler yüklenirken bir hata oluştu.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-medium mb-6">Siparişlerim</h2>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz siparişiniz bulunmuyor.</p>
          <Button asChild>
            <Link to="/urunler">Alışverişe Başla</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-xl p-4 lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="font-medium">Sipariş #{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={statusMap[order.status].variant}>
                  {statusMap[order.status].label}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {order.order_items.slice(0, 3).map((item, i) => (
                    <img
                      key={i}
                      src={item.product_image || "/placeholder.svg"}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-background"
                    />
                  ))}
                  {order.order_items.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-sm font-medium border-2 border-background">
                      +{order.order_items.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {order.order_items.map((item) => `${item.product_name} (${item.quantity})`).join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="font-semibold">{formatPrice(order.total)}</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/hesabim/siparisler/${order.order_number}`}>
                    Detayları Gör
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
