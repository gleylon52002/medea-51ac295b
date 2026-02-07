import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Package, Clock, CheckCircle, Truck, XCircle, MapPin, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, safeJsonParse } from "@/lib/utils";
import { useSellerTransactions, useUpdateOrderShipping } from "@/hooks/useSeller";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusMap = {
  pending: { label: "Bekliyor", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Onaylandı", icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Hazırlanıyor", icon: Package, color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Kargoda", icon: Truck, color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Teslim Edildi", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  cancelled: { label: "İptal", icon: XCircle, color: "bg-red-100 text-red-700" },
  refunded: { label: "İade", icon: XCircle, color: "bg-orange-100 text-orange-700" },
};

const SellerOrders = () => {
  const { data: transactions, isLoading } = useSellerTransactions();
  const updateShipping = useUpdateOrderShipping();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");

  // Fetch shipping companies
  const { data: shippingCompanies } = useQuery({
    queryKey: ["shipping-companies"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_companies").select("*").eq("is_active", true);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Group transactions by order
  const orders = transactions?.reduce((acc: any[], transaction: any) => {
    const existingOrder = acc.find(o => o.order_id === transaction.order_id);
    if (existingOrder) {
      existingOrder.items.push(transaction);
      existingOrder.totalAmount += transaction.sale_amount;
      existingOrder.netAmount += transaction.net_amount;
    } else {
      acc.push({
        ...transaction.order,
        order_id: transaction.order_id,
        items: [transaction],
        totalAmount: transaction.sale_amount,
        netAmount: transaction.net_amount,
        // Use the transaction status as a fallback if order status is generic, 
        // but prefer order status for shipping flow
        displayStatus: transaction.order?.status || transaction.status
      });
    }
    return acc;
  }, []) || [];

  const handleOpenShippingModal = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || "");
    setShippingCompany(order.shipping_company || "");
    setIsShippingModalOpen(true);
  };

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    await updateShipping.mutateAsync({
      orderId: selectedOrder.order_id,
      trackingNumber,
      shippingCompany
    });

    setIsShippingModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Siparişlerim</h1>
        <p className="text-muted-foreground">Ürünlerinize gelen siparişleri yönetin ve kargolayın</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz sipariş yok</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order: any) => {
            const status = statusMap[order.displayStatus as keyof typeof statusMap] || statusMap.pending;
            const StatusIcon = status.icon;

            // Parse shipping address
            const address = safeJsonParse(order.shipping_address, null as any);

            return (
              <Card key={order.order_id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="text-muted-foreground">Sipariş No:</span>
                        {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      {(order.displayStatus === 'pending' || order.displayStatus === 'confirmed' || order.displayStatus === 'preparing') && (
                        <Button size="sm" onClick={() => handleOpenShippingModal(order)}>
                          <Truck className="h-4 w-4 mr-2" />
                          Kargoya Ver
                        </Button>
                      )}
                      {order.displayStatus === 'shipped' && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenShippingModal(order)}>
                          <Package className="h-4 w-4 mr-2" />
                          Kargo Bilgisi
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div className="space-y-4">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={item.product?.images?.[0] || "/placeholder.svg"}
                            alt={item.product?.name}
                            className="h-16 w-16 rounded-md object-cover border"
                          />
                          <div>
                            <p className="font-medium text-sm line-clamp-2">{item.product?.name}</p>
                            {item.order_item?.variant_info && (
                              <p className="text-xs text-muted-foreground">
                                {item.order_item.variant_info.name}
                              </p>
                            )}
                            <div className="flex gap-4 mt-1 text-sm">
                              <span className="text-muted-foreground">Adet: {item.order_item?.quantity || 1}</span>
                              <span className="font-medium">{formatPrice(item.sale_amount)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-muted/20 p-4 rounded-lg space-y-3 h-fit">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Teslimat Bilgileri
                      </h4>
                      {address && typeof address === 'object' ? (
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p className="font-medium text-foreground">{address.full_name || 'İsimsiz'}</p>
                          <p>{address.address || 'Adres bilgisi yok'}</p>
                          <p>
                            {address.district || ''}
                            {address.city ? `, ${address.city}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Phone className="h-3 w-3" />
                            {address.phone || 'Telefon yok'}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Adres bilgisi bulunamadı</p>
                      )}

                      {order.notes && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-sm group">
                          <p className="font-medium text-yellow-800 flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3" />
                            Müşteri Notu:
                          </p>
                          <p className="text-yellow-700 italic">"{order.notes}"</p>
                        </div>
                      )}

                      {order.tracking_number && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Kargo Takip</p>
                          <p className="text-sm font-medium">{order.shipping_company}</p>
                          <p className="text-sm font-mono bg-background p-1 rounded border inline-block mt-1">
                            {order.tracking_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isShippingModalOpen} onOpenChange={setIsShippingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgileri Gir</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitShipping} className="space-y-4">
            <div className="space-y-2">
              <Label>Kargo Firması</Label>
              <Select value={shippingCompany} onValueChange={setShippingCompany} required>
                <SelectTrigger>
                  <SelectValue placeholder="Firma Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {shippingCompanies?.map((company: any) => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                  {(!shippingCompanies || shippingCompanies.length === 0) && (
                    <SelectItem value="other">Diğer</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Takip Numarası</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Takip numarasını giriniz"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShippingModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={updateShipping.isPending}>
                {updateShipping.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrders;
