import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from("products").select("id, stock", { count: "exact" }),
        supabase.from("orders").select("id, total, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);

      const totalProducts = productsRes.count || 0;
      const lowStockProducts = productsRes.data?.filter(p => p.stock <= 5).length || 0;
      const totalOrders = ordersRes.count || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === "pending").length || 0;
      const totalRevenue = ordersRes.data?.filter(o => o.status === "delivered").reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
      const totalUsers = usersRes.count || 0;

      return {
        totalProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalUsers,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["admin", "low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, images")
        .lte("stock", 5)
        .order("stock", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const statusLabels: Record<string, string> = {
    pending: "Beklemede",
    confirmed: "Onaylandı",
    preparing: "Hazırlanıyor",
    shipped: "Kargoda",
    delivered: "Teslim Edildi",
    cancelled: "İptal",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">MEDEA yönetim paneline hoş geldiniz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Ürün
            </CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
            {stats?.lowStockProducts ? (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {stats.lowStockProducts} düşük stok
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Siparişler
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
            {stats?.pendingOrders ? (
              <p className="text-sm text-amber-600 mt-1">
                {stats.pendingOrders} beklemede
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kullanıcılar
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Kayıtlı kullanıcı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Gelir
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</div>
            <p className="text-sm text-muted-foreground mt-1">Teslim edilen siparişler</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Son Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(Number(order.total))}</p>
                      <span className={`text-xs px-2 py-1 rounded ${order.status === "delivered" ? "bg-green-100 text-green-700" :
                          order.status === "cancelled" ? "bg-red-100 text-red-700" :
                            order.status === "pending" ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                        }`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Henüz sipariş yok</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Düşük Stoklu Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                    </div>
                    <span className={`text-sm font-medium ${product.stock === 0 ? "text-destructive" : "text-amber-600"
                      }`}>
                      {product.stock === 0 ? "Tükendi" : `${product.stock} adet`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Düşük stoklu ürün yok</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
