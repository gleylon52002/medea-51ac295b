import { useState } from "react";
import { Star, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSellerProfile, useSellerSettings } from "@/hooks/useSeller";
import { useSellerProducts, useUpdateSellerProduct } from "@/hooks/useSellerProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const SellerFeature = () => {
  const queryClient = useQueryClient();
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: products, isLoading: productsLoading } = useSellerProducts();
  const { data: settings } = useSellerSettings();

  const { mutateAsync: updateProduct } = useUpdateSellerProduct();

  const minReputation = Number(settings?.min_reputation_for_feature) || 200;
  const featureCost = Number(settings?.feature_cost_per_day) || 10;
  const canFeature = (seller?.reputation_points || 0) >= minReputation;

  const handleFeatureProduct = async (productId: string, days: number) => {
    if (!seller || !canFeature) {
      toast.error("Yeterli itibar puanınız yok veya satıcı profili yüklenemedi!");
      return;
    }

    try {
      // 1. Deduct points
      const { error: updateSellerError } = await supabase
        .from("sellers")
        .update({
          reputation_points: seller.reputation_points - featureCost
        })
        .eq("id", seller.id);

      if (updateSellerError) throw updateSellerError;

      // 2. Feature product
      await updateProduct({
        id: productId,
        is_featured: true
      });

      // 3. Record history
      const { error: historyError } = await supabase
        .from("seller_points_history")
        .insert({
          seller_id: seller.id,
          points: -featureCost,
          point_type: "purchased",
          reason: "Ürün Öne Çıkarma (30 Gün)", // Simplification
          // product_id is not in standard interface but maybe in metadata if we had it, keeping it simple
        });

      if (historyError) console.error("History error:", historyError);

      // Invalidate queries to refresh UI immediately
      queryClient.invalidateQueries({ queryKey: ["products", "featured"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });

      toast.success("Ürün başarıyla öne çıkarıldı ve puanınız güncellendi!");
    } catch (error: any) {
      console.error(error);
      toast.error("İşlem başarısız oldu: " + error.message);
    }
  };

  if (sellerLoading || productsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ürün Öne Çıkar</h1>
        <p className="text-muted-foreground">
          Takdir puanlarınızı kullanarak ürünlerinizi öne çıkarın
        </p>
      </div>

      {/* Status Card */}
      <Card className={canFeature ? "border-green-200 bg-green-50/50" : "border-yellow-200 bg-yellow-50/50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${canFeature ? "bg-green-100" : "bg-yellow-100"}`}>
                <Star className={`h-6 w-6 ${canFeature ? "text-green-600" : "text-yellow-600"}`} />
              </div>
              <div>
                <p className="font-medium">
                  {canFeature ? "Öne çıkarma aktif!" : "Daha fazla puan gerekli"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Mevcut puan: {seller?.reputation_points} / Gerekli: {minReputation}
                </p>
              </div>
            </div>
            <Badge variant={canFeature ? "default" : "secondary"} className={canFeature ? "bg-green-500" : ""}>
              {canFeature ? "Aktif" : "Kilitli"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Öne Çıkarma Fiyatları
          </CardTitle>
          <CardDescription>
            Takdir puanlarınızı kullanarak ürünlerinizi ana sayfada ve kategori listelerinde öne çıkarın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold">{featureCost}</p>
              <p className="text-sm text-muted-foreground">puan</p>
              <p className="font-medium mt-2">1 Gün</p>
            </div>
            <div className="p-4 border rounded-lg text-center border-primary bg-primary/5">
              <p className="text-2xl font-bold">{featureCost * 7 * 0.8}</p>
              <p className="text-sm text-muted-foreground">puan</p>
              <p className="font-medium mt-2">7 Gün</p>
              <Badge className="mt-1">%20 İndirim</Badge>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-2xl font-bold">{featureCost * 30 * 0.7}</p>
              <p className="text-sm text-muted-foreground">puan</p>
              <p className="font-medium mt-2">30 Gün</p>
              <Badge className="mt-1">%30 İndirim</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Ürünleriniz</CardTitle>
        </CardHeader>
        <CardContent>
          {products?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz ürün eklemediniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products?.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.sale_price || product.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.is_featured ? (
                      <Badge className="bg-yellow-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Öne Çıkan
                      </Badge>
                    ) : canFeature ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFeatureProduct(product.id, 1)}
                        disabled={!product.is_active}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Öne Çıkar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Kilitli
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-medium text-primary">1.</span>
              <span>Minimum {minReputation} takdir puanına ulaşın</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-primary">2.</span>
              <span>Öne çıkarmak istediğiniz ürünü seçin</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-primary">3.</span>
              <span>Süre seçerek puanlarınızı kullanın</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-primary">4.</span>
              <span>Ürününüz ana sayfa ve kategori listelerinde üst sıralarda görünür</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerFeature;
