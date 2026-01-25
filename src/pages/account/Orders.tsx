import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const mockOrders = [
  {
    id: "MDA12345678",
    date: "2024-01-15",
    status: "delivered",
    total: 299.90,
    items: [
      { name: "Lavanta Sabunu", quantity: 2, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=100" },
      { name: "Argan Yağlı Yüz Maskesi", quantity: 1, image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=100" },
    ],
  },
  {
    id: "MDA12345679",
    date: "2024-01-20",
    status: "shipping",
    total: 189.90,
    items: [
      { name: "Vanilya Mum", quantity: 1, image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=100" },
    ],
  },
  {
    id: "MDA12345680",
    date: "2024-01-22",
    status: "preparing",
    total: 79.90,
    items: [
      { name: "Bal Lip Balm", quantity: 2, image: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=100" },
    ],
  },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  preparing: { label: "Hazırlanıyor", variant: "secondary" },
  shipping: { label: "Kargoda", variant: "default" },
  delivered: { label: "Teslim Edildi", variant: "outline" },
};

const Orders = () => {
  return (
    <div>
      <h2 className="font-serif text-xl font-medium mb-6">Siparişlerim</h2>

      {mockOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz siparişiniz bulunmuyor.</p>
          <Button asChild>
            <Link to="/urunler">Alışverişe Başla</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <div key={order.id} className="border border-border rounded-xl p-4 lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="font-medium">Sipariş #{order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.date).toLocaleDateString("tr-TR", {
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
                  {order.items.slice(0, 3).map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-background"
                    />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-sm font-medium border-2 border-background">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {order.items.map((item) => `${item.name} (${item.quantity})`).join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="font-semibold">{formatPrice(order.total)}</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/hesabim/siparisler/${order.id}`}>
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
