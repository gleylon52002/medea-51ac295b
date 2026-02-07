import { Package, ShoppingCart, TrendingUp, Star, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSellerProfile, useSellerTransactions, useSellerNotifications } from "@/hooks/useSeller";
import { useSellerProducts } from "@/hooks/useSellerProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SellerDashboard = () => {
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: products, isLoading: productsLoading } = useSellerProducts();
  const { data: transactions } = useSellerTransactions();
  const { data: notifications } = useSellerNotifications();

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const totalEarnings = transactions?.filter(t => t.status === "completed").reduce((sum, t) => sum + (Number(t.net_amount) || 0), 0) || 0;
  const pendingEarnings = transactions?.filter(t => t.status === "pending").reduce((sum, t) => sum + (Number(t.net_amount) || 0), 0) || 0;

  if (sellerLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>Satıcı profili bulunamadı.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = [
    {
      title: "Toplam Ürün",
      value: products?.length || 0,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Toplam Sipariş",
      value: seller.total_orders,
      icon: ShoppingCart,
      color: "text-green-500",
    },
    {
      title: "Toplam Kazanç",
      value: formatPrice(totalEarnings),
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Takdir Puanı",
      value: seller.reputation_points,
      icon: Star,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hoş Geldiniz, {seller.company_name}!</h1>
          <p className="text-muted-foreground">Satış performansınızı buradan takip edebilirsiniz.</p>
        </div>
      </div>

      {/* Status Alerts */}
      {seller.status === "suspended" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hesabınız Askıda</AlertTitle>
          <AlertDescription>
            {seller.suspended_reason} - {seller.suspended_until && `Bitiş: ${new Date(seller.suspended_until).toLocaleDateString("tr-TR")}`}
          </AlertDescription>
        </Alert>
      )}

      {seller.penalty_points >= 30 && seller.status === "active" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Uyarı: Yüksek Ceza Puanı</AlertTitle>
          <AlertDescription>
            Ceza puanınız {seller.penalty_points}'a ulaştı. 50 puana ulaştığınızda hesabınız askıya alınacaktır.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/satici/urunler">
                <Package className="mr-2 h-4 w-4" />
                Yeni Ürün Ekle
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/satici/siparisler">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Siparişleri Görüntüle
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/satici/one-cikar">
                <Star className="mr-2 h-4 w-4" />
                Ürün Öne Çıkar
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Son Bildirimler</CardTitle>
            {unreadNotifications.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {unreadNotifications.length} okunmamış
              </span>
            )}
          </CardHeader>
          <CardContent>
            {unreadNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Yeni bildirim yok</p>
            ) : (
              <div className="space-y-2">
                {unreadNotifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                  </div>
                ))}
                {unreadNotifications.length > 3 && (
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link to="/satici/bildirimler">
                      Tümünü gör ({unreadNotifications.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Kazanç Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Toplam Satış</p>
              <p className="text-xl font-bold">{formatPrice(seller.total_sales)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Net Kazanç (Ödendi)</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(totalEarnings)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Bekleyen Kazanç</p>
              <p className="text-xl font-bold text-yellow-600">{formatPrice(pendingEarnings)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Komisyon oranı: %{seller.commission_rate}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerDashboard;
