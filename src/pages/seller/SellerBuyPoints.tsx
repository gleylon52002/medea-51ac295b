import { useState } from "react";
import { Star, ShoppingCart, Loader2, Gift, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSellerProfile } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonus_points: number;
  is_active: boolean;
  sort_order: number;
}

const SellerBuyPoints = () => {
  const queryClient = useQueryClient();
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["seller-point-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_point_packages" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as PointPackage[];
    },
  });

  const handlePurchase = async (pkg: PointPackage) => {
    if (!seller) return;
    setPurchasing(pkg.id);

    try {
      const totalPoints = pkg.points + pkg.bonus_points;

      // Update seller reputation points
      const { error: updateError } = await supabase
        .from("sellers")
        .update({
          reputation_points: seller.reputation_points + totalPoints,
        })
        .eq("id", seller.id);

      if (updateError) throw updateError;

      // Record in points history
      const { error: historyError } = await supabase
        .from("seller_points_history")
        .insert({
          seller_id: seller.id,
          points: totalPoints,
          point_type: "purchased",
          reason: `${pkg.name} paketi satın alındı (${pkg.points}${pkg.bonus_points > 0 ? ` + ${pkg.bonus_points} bonus` : ""} puan)`,
        });

      if (historyError) console.error("History error:", historyError);

      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      queryClient.invalidateQueries({ queryKey: ["seller-points-history"] });

      toast.success(`${totalPoints} puan başarıyla hesabınıza eklendi!`);
    } catch (error: any) {
      toast.error("Satın alma başarısız: " + error.message);
    } finally {
      setPurchasing(null);
    }
  };

  if (sellerLoading || packagesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Puan Satın Al</h1>
        <p className="text-muted-foreground">
          İtibar puanı satın alarak ürünlerinizi öne çıkarın
        </p>
      </div>

      {/* Current Balance */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mevcut Bakiyeniz</p>
                <p className="text-3xl font-bold">{seller?.reputation_points || 0} <span className="text-base font-normal text-muted-foreground">puan</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Puan Paketleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages?.map((pkg, index) => {
            const isPopular = index === 2;
            return (
              <Card
                key={pkg.id}
                className={`relative ${isPopular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Popüler
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>
                    {pkg.points} puan
                    {pkg.bonus_points > 0 && (
                      <span className="text-primary font-medium"> + {pkg.bonus_points} bonus</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{formatPrice(pkg.price)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(pkg.price / (pkg.points + pkg.bonus_points)).toFixed(2)} ₺ / puan
                    </p>
                  </div>

                  {pkg.bonus_points > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-primary">
                      <Gift className="h-4 w-4" />
                      <span>{pkg.bonus_points} bonus puan hediye!</span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Satın Al
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Puanlar Ne İşe Yarar?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Ürünlerinizi ana sayfada ve kategori listelerinde öne çıkarabilirsiniz</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Öne çıkan ürünler daha fazla görünürlük ve satış elde eder</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Bonus puanlar sadece belirli paketlerle kazanılır</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Puanlar iade edilemez, süresiz geçerlidir</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerBuyPoints;
