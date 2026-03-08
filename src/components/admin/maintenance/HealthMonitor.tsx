import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, ShoppingCart, Users, TrendingUp, 
  AlertTriangle, MessageSquare, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HealthStats {
  productCount: number;
  orderCount: number;
  userCount: number;
  todayRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  unreadMessages: number;
}

const HealthMonitor = () => {
  const [stats, setStats] = useState<HealthStats>({
    productCount: 0,
    orderCount: 0,
    userCount: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { count: productCount },
        { count: orderCount },
        { count: userCount },
        { data: todayOrders },
        { data: pendingOrders },
        { count: lowStockCount },
        { count: unreadMessages },
      ] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, status").eq("status", "delivered").gte("created_at", today.toISOString()),
        supabase.from("orders").select("id").eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", 5).eq("is_active", true),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);

      setStats({
        productCount: productCount || 0,
        orderCount: orderCount || 0,
        userCount: userCount || 0,
        todayRevenue: todayOrders?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0,
        pendingOrders: pendingOrders?.length || 0,
        lowStockCount: lowStockCount || 0,
        unreadMessages: unreadMessages || 0,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch health stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { 
      label: "Aktif Ürün", 
      value: stats.productCount, 
      icon: Package, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      label: "Toplam Sipariş", 
      value: stats.orderCount, 
      icon: ShoppingCart, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      label: "Kullanıcı", 
      value: stats.userCount, 
      icon: Users, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      label: "Bugünkü Gelir", 
      value: `₺${stats.todayRevenue.toLocaleString("tr-TR")}`, 
      icon: TrendingUp, 
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    { 
      label: "Bekleyen Sipariş", 
      value: stats.pendingOrders, 
      icon: ShoppingCart, 
      color: stats.pendingOrders > 0 ? "text-amber-500" : "text-muted-foreground",
      bgColor: stats.pendingOrders > 0 ? "bg-amber-500/10" : "bg-muted/50",
      alert: stats.pendingOrders > 5
    },
    { 
      label: "Düşük Stok", 
      value: stats.lowStockCount, 
      icon: AlertTriangle, 
      color: stats.lowStockCount > 0 ? "text-red-500" : "text-muted-foreground",
      bgColor: stats.lowStockCount > 0 ? "bg-red-500/10" : "bg-muted/50",
      alert: stats.lowStockCount > 0
    },
    { 
      label: "Okunmamış Mesaj", 
      value: stats.unreadMessages, 
      icon: MessageSquare, 
      color: stats.unreadMessages > 0 ? "text-orange-500" : "text-muted-foreground",
      bgColor: stats.unreadMessages > 0 ? "bg-orange-500/10" : "bg-muted/50",
      alert: stats.unreadMessages > 0
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Sistem Sağlığı</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Son güncelleme: {lastUpdate.toLocaleTimeString("tr-TR")}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStats}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {statCards.map((card) => (
          <Card 
            key={card.label} 
            className={cn(
              "p-3 border transition-colors",
              card.alert && "border-destructive/50 animate-pulse"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", card.bgColor)}>
                <card.icon className={cn("h-3.5 w-3.5", card.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                <p className={cn("text-sm font-semibold", card.color)}>
                  {loading ? "..." : card.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HealthMonitor;
