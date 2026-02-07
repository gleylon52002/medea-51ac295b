import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Package, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSellerTransactions } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { safeJsonParse } from "@/lib/utils";
import CargoCompaniesModal from "@/components/seller/CargoCompaniesModal";

const SellerCargo = () => {
    const { data: transactions, isLoading } = useSellerTransactions();
    const [searchTerm, setSearchTerm] = useState("");

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    // Filter for orders that are relevant to cargo (confirmed, preparing, shipped)
    const cargoOrders = transactions?.filter(t =>
        ["confirmed", "preparing", "shipped", "delivered"].includes(t.order?.status || "")
    ).reduce((acc: any[], t: any) => {
        // Group by order like in SellerOrders
        const existing = acc.find(o => o.order_id === t.order_id);
        if (!existing) {
            acc.push({ ...t.order, items: [t] });
        } else {
            existing.items.push(t);
        }
        return acc;
    }, []) || [];

    const filteredOrders = cargoOrders.filter((order: any) =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.tracking_number && order.tracking_number.includes(searchTerm))
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Kargo İşlemleri</h1>
                    <p className="text-muted-foreground">Kargo gönderimlerini ve takibini buradan yönetin</p>
                </div>
                <CargoCompaniesModal />
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Sipariş No veya Takip No ile ara..."
                    className="pl-9 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid gap-4">
                {filteredOrders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Kargo işlemi bekleyen veya gönderilen sipariş bulunamadı</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredOrders.map((order: any) => {
                        const isShipped = order.status === "shipped" || order.status === "delivered";
                        const address = safeJsonParse(order.shipping_address, null as any);

                        return (
                            <Card key={order.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row border-b last:border-0">
                                        {/* Status & Icon */}
                                        <div className={`w-full sm:w-24 flex flex-col items-center justify-center p-4 ${isShipped ? 'bg-indigo-50 text-indigo-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                            <Truck className="h-8 w-8 mb-2" />
                                            <span className="text-xs font-bold uppercase">{order.status === 'shipped' ? 'Kargoda' : order.status === 'delivered' ? 'Teslim Edildi' : 'Hazırlanıyor'}</span>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Sipariş No</p>
                                                <p className="font-medium">{order.order_number}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Alıcı</p>
                                                <p className="font-medium">{address?.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{address?.city} / {address?.district}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Kargo Firması</p>
                                                <p className="font-medium">{order.shipping_company || "-"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Takip No</p>
                                                {order.tracking_number ? (
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">{order.tracking_number}</code>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-yellow-600 font-medium">Girilmedi</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {/* Action buttons could go here, e.g. "Update Tracking" */}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SellerCargo;
