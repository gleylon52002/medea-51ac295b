import { useState } from "react";
import { Bell, BellOff, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface ProductAlertsProps {
  productId: string;
  currentPrice: number;
  stock: number;
  variantId?: string;
}

const ProductAlerts = ({ productId, currentPrice, stock, variantId }: ProductAlertsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentPrice * 0.9));

  const { data: priceAlert } = useQuery({
    queryKey: ["price-alert", productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: stockAlert } = useQuery({
    queryKey: ["stock-alert", productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("stock_alerts")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const createPriceAlert = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Auth required");
      const { error } = await supabase.from("price_alerts").insert({
        user_id: user.id,
        product_id: productId,
        target_price: targetPrice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alert", productId] });
      toast.success(`Fiyat ${formatPrice(targetPrice)} altına düştüğünde bildirilecek`);
    },
  });

  const createStockAlert = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Auth required");
      const { error } = await supabase.from("stock_alerts").insert({
        user_id: user.id,
        product_id: productId,
        variant_id: variantId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alert", productId] });
      toast.success("Ürün stoğa girdiğinde bildirilecek");
    },
  });

  const cancelAlert = useMutation({
    mutationFn: async (type: "price" | "stock") => {
      if (type === "price" && priceAlert) {
        await supabase.from("price_alerts").update({ is_active: false }).eq("id", priceAlert.id);
      } else if (type === "stock" && stockAlert) {
        await supabase.from("stock_alerts").update({ is_active: false }).eq("id", stockAlert.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alert", productId] });
      queryClient.invalidateQueries({ queryKey: ["stock-alert", productId] });
      toast.success("Alarm iptal edildi");
    },
  });

  if (!user) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Price Alert */}
      {stock > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              {priceAlert ? (
                <>
                  <BellOff className="h-3.5 w-3.5" />
                  Fiyat Alarmı Aktif
                </>
              ) : (
                <>
                  <TrendingDown className="h-3.5 w-3.5" />
                  Fiyat Alarmı
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-3">
            {priceAlert ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Hedef: <span className="font-semibold text-foreground">{formatPrice(Number(priceAlert.target_price))}</span>
                </p>
                <Button size="sm" variant="destructive" className="w-full" onClick={() => cancelAlert.mutate("price")}>
                  Alarmı İptal Et
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Fiyat düşünce bildir:</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="text-sm"
                  />
                  <span className="text-sm text-muted-foreground self-center">₺</span>
                </div>
                <Button size="sm" className="w-full" onClick={() => createPriceAlert.mutate()}>
                  Alarm Kur
                </Button>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Stock Alert - only show when out of stock */}
      {stock === 0 && (
        stockAlert ? (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => cancelAlert.mutate("stock")}>
            <BellOff className="h-3.5 w-3.5" />
            Stok Alarmı Aktif
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => createStockAlert.mutate()}>
            <Bell className="h-3.5 w-3.5" />
            Stoğa Gelince Bildir
          </Button>
        )
      )}
    </div>
  );
};

export default ProductAlerts;
