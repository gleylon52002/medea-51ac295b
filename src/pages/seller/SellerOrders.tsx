import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { useSellerTransactions } from "@/hooks/useSeller";

const statusMap = {
  pending: { label: "Bekliyor", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Onaylandı", icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Hazırlanıyor", icon: Package, color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Kargoda", icon: Truck, color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Teslim Edildi", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  cancelled: { label: "İptal", icon: XCircle, color: "bg-red-100 text-red-700" },
};

const SellerOrders = () => {
  const { data: transactions, isLoading } = useSellerTransactions();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Siparişlerim</h1>
        <p className="text-muted-foreground">Ürünlerinize gelen siparişleri takip edin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sipariş Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions?.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz sipariş yok</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ürünleriniz satıldığında siparişler burada görünecek
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-lg border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sipariş #{transaction.order_id?.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <Badge variant="secondary" className={
                      transaction.status === "completed" ? "bg-green-100 text-green-700" :
                      transaction.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      transaction.status === "refunded" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }>
                      {transaction.status === "completed" ? "Tamamlandı" :
                       transaction.status === "pending" ? "Bekliyor" :
                       transaction.status === "refunded" ? "İade" : "İptal"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Satış Tutarı</p>
                      <p className="font-medium">{formatPrice(transaction.sale_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Komisyon (%{transaction.commission_rate})</p>
                      <p className="font-medium text-red-600">-{formatPrice(transaction.commission_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Kazanç</p>
                      <p className="font-medium text-green-600">{formatPrice(transaction.net_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ödeme</p>
                      <p className="font-medium">
                        {transaction.paid_at 
                          ? new Date(transaction.paid_at).toLocaleDateString("tr-TR")
                          : "Bekliyor"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrders;
