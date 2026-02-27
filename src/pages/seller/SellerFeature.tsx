import { useState } from "react";
import { Star, Sparkles, Loader2, Clock, Zap, Crown } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface FeaturePlan {
  days: number;
  label: string;
  discount: number;
  icon: React.ReactNode;
  popular?: boolean;
}

const PLANS: FeaturePlan[] = [
  { days: 1, label: "1 Gün", discount: 0, icon: <Clock className="h-5 w-5" /> },
  { days: 7, label: "7 Gün", discount: 0.2, icon: <Zap className="h-5 w-5" />, popular: true },
  { days: 30, label: "30 Gün", discount: 0.3, icon: <Crown className="h-5 w-5" /> },
];

const SellerFeature = () => {
  const queryClient = useQueryClient();
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: products, isLoading: productsLoading } = useSellerProducts();
  const { data: settings } = useSellerSettings();
  const { mutateAsync: updateProduct } = useUpdateSellerProduct();

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FeaturePlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const featureCostPerDay = Number(settings?.feature_cost_per_day) || 10;
  const minReputation = Number(settings?.min_reputation_for_feature) || 200;
  const canFeature = (seller?.reputation_points || 0) >= minReputation;

  const getPlanCost = (plan: FeaturePlan) => {
    const base = featureCostPerDay * plan.days;
    return Math.round(base * (1 - plan.discount));
  };

  const openConfirmDialog = (productId: string, plan: FeaturePlan) => {
    setSelectedProduct(productId);
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleFeatureProduct = async () => {
    if (!seller || !canFeature || !selectedProduct || !selectedPlan) return;

    const cost = getPlanCost(selectedPlan);
    if (seller.reputation_points < cost) {
      toast.error("Yeterli puanınız yok!");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct points
      const { error: updateSellerError } = await supabase
        .from("sellers")
        .update({ reputation_points: seller.reputation_points - cost })
        .eq("id", seller.id);
      if (updateSellerError) throw updateSellerError;

      // 2. Feature product
      await updateProduct({ id: selectedProduct, is_featured: true });

      // 3. Record history
      await supabase.from("seller_points_history").insert({
        seller_id: seller.id,
        points: -cost,
        point_type: "purchased",
        reason: `Ürün Öne Çıkarma (${selectedPlan.label})`,
      });

      queryClient.invalidateQueries({ queryKey: ["products", "featured"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });

      toast.success(`Ürün ${selectedPlan.label} süreyle öne çıkarıldı! (${cost} puan kullanıldı)`);
      setDialogOpen(false);
    } catch (error: any) {
      toast.error("İşlem başarısız: " + error.message);
    } finally {
      setIsProcessing(false);
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

  const selectedProductData = products?.find(p => p.id === selectedProduct);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ürün Öne Çıkar</h1>
        <p className="text-muted-foreground">Puanlarınızı kullanarak ürünlerinizi ana sayfada ve kategori listelerinde öne çıkarın</p>
      </div>

      {/* Status Card */}
      <Card className={canFeature ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${canFeature ? "bg-green-100 dark:bg-green-900/40" : "bg-yellow-100 dark:bg-yellow-900/40"}`}>
                <Star className={`h-6 w-6 ${canFeature ? "text-green-600" : "text-yellow-600"}`} />
              </div>
              <div>
                <p className="font-medium">{canFeature ? "Öne çıkarma aktif!" : "Daha fazla puan gerekli"}</p>
                <p className="text-sm text-muted-foreground">
                  Mevcut puan: <span className="font-semibold text-foreground">{seller?.reputation_points}</span> / Gerekli: {minReputation}
                </p>
              </div>
            </div>
            <Badge variant={canFeature ? "default" : "secondary"} className={canFeature ? "bg-green-500" : ""}>
              {canFeature ? "Aktif" : "Kilitli"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Öne Çıkarma Paketleri
          </CardTitle>
          <CardDescription>Süre arttıkça birim maliyet düşer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.days}
                className={`relative p-5 border-2 rounded-xl text-center transition-all ${
                  plan.popular ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary">Popüler</Badge>
                )}
                <div className="flex justify-center mb-3 text-primary">{plan.icon}</div>
                <p className="text-3xl font-bold">{getPlanCost(plan)}</p>
                <p className="text-sm text-muted-foreground mb-1">puan</p>
                <p className="font-semibold text-lg">{plan.label}</p>
                {plan.discount > 0 && (
                  <Badge variant="secondary" className="mt-2">%{plan.discount * 100} İndirim</Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Günlük {Math.round(getPlanCost(plan) / plan.days)} puan
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Ürünleriniz</CardTitle>
          <CardDescription>Öne çıkarmak istediğiniz ürünü ve süreyi seçin</CardDescription>
        </CardHeader>
        <CardContent>
          {products?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz ürün eklemediniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products?.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(product.sale_price || product.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.is_featured ? (
                      <Badge className="bg-yellow-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Öne Çıkan
                      </Badge>
                    ) : canFeature ? (
                      <div className="flex gap-1">
                        {PLANS.map((plan) => (
                          <Button
                            key={plan.days}
                            size="sm"
                            variant={plan.popular ? "default" : "outline"}
                            onClick={() => openConfirmDialog(product.id, plan)}
                            disabled={!product.is_active || seller!.reputation_points < getPlanCost(plan)}
                            className="text-xs"
                          >
                            {plan.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" disabled>Kilitli</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürünü Öne Çıkar</DialogTitle>
            <DialogDescription>
              Aşağıdaki işlemi onaylıyor musunuz?
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && selectedProductData && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {selectedProductData.images?.[0] && (
                  <img src={selectedProductData.images[0]} alt="" className="w-10 h-10 object-cover rounded" />
                )}
                <div>
                  <p className="font-medium text-sm">{selectedProductData.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(selectedProductData.sale_price || selectedProductData.price)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Süre</p>
                  <p className="font-semibold">{selectedPlan.label}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Maliyet</p>
                  <p className="font-semibold">{getPlanCost(selectedPlan)} puan</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Mevcut Puanınız</p>
                  <p className="font-semibold">{seller?.reputation_points}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Kalan Puan</p>
                  <p className="font-semibold">{(seller?.reputation_points || 0) - getPlanCost(selectedPlan)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleFeatureProduct} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerFeature;
