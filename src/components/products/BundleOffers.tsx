import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface BundleOffersProps {
  productId: string;
  currentProductName: string;
  currentPrice: number;
}

const BundleOffers = ({ productId, currentProductName, currentPrice }: BundleOffersProps) => {
  // Find products frequently bought together (from order_items)
  const { data: bundleProducts } = useQuery({
    queryKey: ["bundle-offers", productId],
    queryFn: async () => {
      // Get order IDs that contain this product
      const { data: orderIds } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("product_id", productId)
        .limit(50);

      if (!orderIds || orderIds.length === 0) return [];

      const ids = orderIds.map(o => o.order_id);

      // Get other products from those orders
      const { data: coProducts } = await supabase
        .from("order_items")
        .select("product_id, product_name, product_image, unit_price")
        .in("order_id", ids)
        .neq("product_id", productId)
        .limit(100);

      if (!coProducts) return [];

      // Count frequency and pick top 3
      const freq: Record<string, { count: number; name: string; image: string; price: number; id: string }> = {};
      for (const p of coProducts) {
        if (!p.product_id) continue;
        if (!freq[p.product_id]) {
          freq[p.product_id] = { count: 0, name: p.product_name, image: p.product_image || "", price: Number(p.unit_price), id: p.product_id };
        }
        freq[p.product_id].count++;
      }

      return Object.values(freq)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!bundleProducts || bundleProducts.length === 0) return null;

  const bundleTotal = currentPrice + bundleProducts.reduce((s, p) => s + p.price, 0);

  return (
    <div className="border border-border rounded-xl p-5 bg-muted/20">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">Birlikte Sıkça Alınan Ürünler</h3>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        {bundleProducts.map((bp, i) => (
          <Link key={bp.id} to={`/urun/${bp.id}`} className="flex items-center gap-2 hover:opacity-80 transition">
            {i > 0 && <span className="text-muted-foreground text-lg font-bold">+</span>}
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
              {bp.image && (
                <img src={bp.image} alt={bp.name} className="w-10 h-10 rounded object-cover" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate max-w-[120px]">{bp.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(bp.price)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Paket toplamı</p>
          <p className="text-lg font-bold text-primary">{formatPrice(bundleTotal)}</p>
        </div>
      </div>
    </div>
  );
};

export default BundleOffers;
