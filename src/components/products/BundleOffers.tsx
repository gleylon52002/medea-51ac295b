import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Package, ShoppingCart } from "lucide-react";

interface BundleOffersProps {
  productId: string;
  currentProductName: string;
  currentPrice: number;
}

const BundleOffers = ({ productId, currentProductName, currentPrice }: BundleOffersProps) => {
  const { addToCart } = useCart();

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
  const discountedTotal = bundleTotal * 0.9; // 10% bundle discount

  const handleAddBundle = async () => {
    // Fetch full product data for each bundle item
    for (const bp of bundleProducts) {
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", bp.id)
        .single();

      if (product) {
        addToCart({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          shortDescription: product.short_description || "",
          price: Number(product.price),
          salePrice: product.sale_price ? Number(product.sale_price) : undefined,
          images: product.images || [],
          category: "",
          categorySlug: "",
          stock: product.stock,
          featured: product.is_featured,
          rating: 0,
          reviewCount: 0,
          createdAt: product.created_at,
          sellerId: product.seller_id,
        }, 1);
      }
    }
  };

  return (
    <div className="border border-border rounded-xl p-5 bg-muted/20">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">Birlikte Sıkça Alınan Ürünler</h3>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        {bundleProducts.map((bp, i) => (
          <div key={bp.id} className="flex items-center gap-2">
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
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground line-through">{formatPrice(bundleTotal)}</p>
          <p className="text-lg font-bold text-primary">{formatPrice(discountedTotal)}</p>
          <p className="text-xs text-green-600 font-medium">%10 paket indirimi</p>
        </div>
        <Button size="sm" onClick={handleAddBundle} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Paketi Ekle
        </Button>
      </div>
    </div>
  );
};

export default BundleOffers;
