import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Package, Clock, RotateCcw, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { differenceInDays, differenceInHours, subDays } from "date-fns";

const SellerScorecard = () => {
  const { user } = useAuth();

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ["seller-scorecard", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sellers").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["seller-scorecard-stats", seller?.id],
    queryFn: async () => {
      if (!seller) return null;
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Get orders for this seller's products
      const { data: orders } = await supabase
        .from("seller_transactions")
        .select("*, order:orders(status, created_at, updated_at)")
        .eq("seller_id", seller.id)
        .gte("created_at", thirtyDaysAgo);

      // Get reviews for seller's products
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, product:products!inner(seller_id)")
        .eq("products.seller_id", seller.id)
        .eq("is_approved", true);

      const totalOrders = orders?.length || 0;
      const deliveredOrders = orders?.filter((o) => (o.order as any)?.status === "delivered") || [];
      const cancelledOrders = orders?.filter((o) => (o.order as any)?.status === "cancelled") || [];

      // Calculate average delivery time (order created to shipped)
      const shippedOrders = orders?.filter((o) => ["shipped", "delivered"].includes((o.order as any)?.status)) || [];
      const avgDeliveryHours = shippedOrders.length > 0
        ? shippedOrders.reduce((sum, o) => {
            const created = new Date((o.order as any)?.created_at);
            const updated = new Date((o.order as any)?.updated_at);
            return sum + differenceInHours(updated, created);
          }, 0) / shippedOrders.length
        : 0;

      // Calculate ratings
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;
      const deliveryRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0;

      // Calculate overall score (0-100)
      const ratingScore = avgRating * 20; // Max 100
      const deliveryScore = Math.max(0, 100 - (avgDeliveryHours / 24) * 10); // Lose 10 points per day
      const cancellationScore = Math.max(0, 100 - cancellationRate * 5); // Lose 5 points per %
      const overallScore = Math.round((ratingScore * 0.4 + deliveryScore * 0.3 + cancellationScore * 0.3));

      return {
        totalOrders,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        avgDeliveryHours: Math.round(avgDeliveryHours),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews?.length || 0,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        overallScore,
      };
    },
    enabled: !!seller,
  });

  if (sellerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Mükemmel", variant: "default" as const };
    if (score >= 80) return { label: "Çok İyi", variant: "default" as const };
    if (score >= 60) return { label: "İyi", variant: "secondary" as const };
    if (score >= 40) return { label: "Orta", variant: "outline" as const };
    return { label: "Geliştirilmeli", variant: "destructive" as const };
  };

  const scoreBadge = stats ? getScoreBadge(stats.overallScore) : null;

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Genel Performans Puanı</p>
              <div className="flex items-center gap-3">
                <span className={`text-5xl font-bold ${getScoreColor(stats?.overallScore || 0)}`}>
                  {stats?.overallScore || 0}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
                {scoreBadge && <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>}
              </div>
            </div>
            <Award className={`h-16 w-16 ${getScoreColor(stats?.overallScore || 0)}`} />
          </div>
          <Progress value={stats?.overallScore || 0} className="mt-4 h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Son 30 günlük performansa göre hesaplanmıştır
          </p>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Ortalama Puan</span>
            </div>
            <p className="text-2xl font-bold">{stats?.avgRating || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.reviewCount || 0} değerlendirme</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Ort. Kargo Süresi</span>
            </div>
            <p className="text-2xl font-bold">{stats?.avgDeliveryHours || 0}s</p>
            <p className="text-xs text-muted-foreground">Sipariş → Kargo</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Teslimat Oranı</span>
            </div>
            <p className="text-2xl font-bold">%{stats?.deliveryRate || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.deliveredOrders || 0} teslim</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">İptal Oranı</span>
            </div>
            <p className="text-2xl font-bold">%{stats?.cancellationRate || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.cancelledOrders || 0} iptal</p>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performans İpuçları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(stats?.avgDeliveryHours || 0) > 48 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Kargo sürenizi kısaltın</p>
                <p className="text-xs text-muted-foreground">Siparişleri 24 saat içinde kargoya verin</p>
              </div>
            </div>
          )}
          {(stats?.cancellationRate || 0) > 5 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">İptal oranınız yüksek</p>
                <p className="text-xs text-muted-foreground">Stok durumunu düzenli kontrol edin</p>
              </div>
            </div>
          )}
          {(stats?.avgRating || 0) < 4 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Müşteri memnuniyetini artırın</p>
                <p className="text-xs text-muted-foreground">Ürün kalitesi ve iletişimi iyileştirin</p>
              </div>
            </div>
          )}
          {(stats?.overallScore || 0) >= 80 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Award className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Harika gidiyorsunuz!</p>
                <p className="text-xs text-muted-foreground">Performansınız ortalamanın üzerinde</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerScorecard;
