import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, Package, Clock, BarChart3, Target } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { differenceInDays, subDays } from "date-fns";

const SellerStockForecast = () => {
  const { user } = useAuth();

  const { data: seller } = useQuery({
    queryKey: ["seller-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sellers").select("id, commission_rate").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-stock-forecast", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data } = await supabase.from("products").select("id, name, stock, price, sale_price, images, created_at").eq("seller_id", seller.id).eq("is_active", true);
      return data || [];
    },
    enabled: !!seller,
  });

  const { data: transactions } = useQuery({
    queryKey: ["seller-tx-forecast", seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const thirtyDaysAgo = subDays(new Date(), 90).toISOString();
      const { data } = await supabase.from("seller_transactions").select("product_id, sale_amount, created_at, order_item:order_items(quantity)").eq("seller_id", seller.id).gte("created_at", thirtyDaysAgo);
      return data || [];
    },
    enabled: !!seller,
  });

  // Category benchmark
  const { data: categoryAvg } = useQuery({
    queryKey: ["category-benchmark", seller?.id],
    queryFn: async () => {
      if (!seller) return null;
      // Get total sellers count and average sales
      const { data: allSellers } = await supabase.from("sellers").select("total_sales, total_orders").eq("status", "active");
      if (!allSellers || allSellers.length === 0) return null;
      const avgSales = allSellers.reduce((s, sel) => s + Number(sel.total_sales), 0) / allSellers.length;
      const avgOrders = allSellers.reduce((s, sel) => s + Number(sel.total_orders), 0) / allSellers.length;
      const topSales = Math.max(...allSellers.map(s => Number(s.total_sales)));
      return { avgSales, avgOrders, topSales, totalSellers: allSellers.length };
    },
    enabled: !!seller,
  });

  const forecasts = useMemo(() => {
    if (!products || !transactions) return [];
    
    return products.map(product => {
      const productTx = transactions.filter(t => t.product_id === product.id);
      const totalSold = productTx.reduce((s, t) => s + ((t.order_item as any)?.quantity || 1), 0);
      const daysActive = Math.max(1, differenceInDays(new Date(), new Date(product.created_at)));
      const dailyRate = totalSold / Math.min(daysActive, 90);
      const daysUntilEmpty = dailyRate > 0 ? Math.round(product.stock / dailyRate) : Infinity;
      const monthlyRevenue = dailyRate * 30 * (product.sale_price || product.price);

      return {
        ...product,
        totalSold,
        dailyRate: Math.round(dailyRate * 100) / 100,
        daysUntilEmpty,
        monthlyRevenue,
        urgency: daysUntilEmpty <= 7 ? "critical" : daysUntilEmpty <= 14 ? "warning" : "ok",
      };
    }).sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
  }, [products, transactions]);

  // Revenue forecast
  const monthlyForecast = useMemo(() => {
    return forecasts.reduce((s, f) => s + f.monthlyRevenue, 0);
  }, [forecasts]);

  if (isLoading) return <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stok Tahmini & Benchmark</h1>
        <p className="text-muted-foreground">Ürün stok tükenme tahminleri ve kategori karşılaştırması</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelir Tahmini (30 Gün)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(monthlyForecast)}</div>
            <p className="text-xs text-muted-foreground">Mevcut satış hızına göre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{forecasts.filter(f => f.urgency === "critical").length}</div>
            <p className="text-xs text-muted-foreground">7 gün içinde bitecek</p>
          </CardContent>
        </Card>

        {categoryAvg && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benchmark</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryAvg.topSales > 0
                  ? `%${Math.round(((transactions?.length || 0) / categoryAvg.topSales) * 100)}`
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground">En iyi satıcıya göre konumunuz</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stock Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Ürün Stok Tahminleri</CardTitle>
          <CardDescription>Satış hızına göre stok tükenme süresi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecasts.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {f.images?.[0] && <img src={f.images[0]} alt={f.name} className="w-10 h-10 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">Stok: {f.stock} | Günlük satış: ~{f.dailyRate}</p>
                </div>
                <div className="text-right">
                  <Badge variant={f.urgency === "critical" ? "destructive" : f.urgency === "warning" ? "secondary" : "outline"}>
                    <Clock className="h-3 w-3 mr-1" />
                    {f.daysUntilEmpty === Infinity ? "Yeterli" : `${f.daysUntilEmpty} gün`}
                  </Badge>
                  {f.urgency !== "ok" && (
                    <p className="text-[10px] text-red-500 mt-1">Sipariş verme zamanı!</p>
                  )}
                </div>
              </div>
            ))}
            {forecasts.length === 0 && <p className="text-center text-muted-foreground py-4">Ürün bulunamadı</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerStockForecast;
