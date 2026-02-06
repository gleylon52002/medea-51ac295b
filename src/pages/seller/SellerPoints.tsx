import { Star, TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSellerProfile, useSellerPointsHistory, useSellerSettings } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SellerPoints = () => {
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: pointsHistory, isLoading: historyLoading } = useSellerPointsHistory();
  const { data: settings } = useSellerSettings();

  const suspensionThreshold = Number(settings?.suspension_threshold) || 50;
  const banThreshold = Number(settings?.ban_threshold) || 100;
  const minForFeature = Number(settings?.min_reputation_for_feature) || 200;

  if (sellerLoading || historyLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!seller) return null;

  const penaltyProgress = (seller.penalty_points / suspensionThreshold) * 100;
  const featureProgress = (seller.reputation_points / minForFeature) * 100;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Puanlarım</h1>
        <p className="text-muted-foreground">Takdir ve ceza puanlarınızı takip edin</p>
      </div>

      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Award className="h-5 w-5" />
              Takdir Puanı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {seller.reputation_points}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Öne çıkarma için gereken</span>
                <span className="font-medium">{minForFeature} puan</span>
              </div>
              <Progress value={Math.min(featureProgress, 100)} className="h-2" />
              {seller.reputation_points >= minForFeature && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Ürünlerinizi öne çıkarabilirsiniz!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-red-200",
          seller.penalty_points >= 30 ? "bg-red-50" : "bg-red-50/30"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Ceza Puanı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">
              {seller.penalty_points}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Askıya alma limiti</span>
                <span className="font-medium">{suspensionThreshold} puan</span>
              </div>
              <Progress 
                value={Math.min(penaltyProgress, 100)} 
                className="h-2 [&>div]:bg-red-500" 
              />
              {seller.penalty_points >= 30 && seller.penalty_points < suspensionThreshold && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Dikkat! Ceza puanınız yüksek.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How Points Work */}
      <Card>
        <CardHeader>
          <CardTitle>Puan Sistemi Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Takdir Puanı Kazanma
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span>Başarılı satış</span>
                  <Badge variant="secondary">+{settings?.reputation_per_sale || 5}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>5 yıldızlı değerlendirme</span>
                  <Badge variant="secondary">+{settings?.reputation_per_5star || 10}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>4 yıldızlı değerlendirme</span>
                  <Badge variant="secondary">+{settings?.reputation_per_4star || 5}</Badge>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Ceza Puanı
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span>Sipariş iptali</span>
                  <Badge variant="destructive">+{settings?.penalty_per_cancel || 15}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>Onaylı şikayet</span>
                  <Badge variant="destructive">+{settings?.penalty_per_complaint || 25}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>1 yıldızlı değerlendirme</span>
                  <Badge variant="destructive">+{settings?.penalty_per_1star || 10}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>2 yıldızlı değerlendirme</span>
                  <Badge variant="destructive">+{settings?.penalty_per_2star || 5}</Badge>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Önemli:</strong> {suspensionThreshold} ceza puanına ulaşıldığında hesabınız 7 gün askıya alınır. 
              {banThreshold} puanda ise hesabınız kalıcı olarak kapatılır.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Puan Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {pointsHistory?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Henüz puan geçmişi yok
            </p>
          ) : (
            <div className="space-y-3">
              {pointsHistory?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {item.point_type === "penalty" ? (
                      <div className="p-2 rounded-lg bg-red-100 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={item.point_type === "penalty" ? "destructive" : "default"}
                    className={item.point_type !== "penalty" ? "bg-green-500" : ""}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerPoints;
