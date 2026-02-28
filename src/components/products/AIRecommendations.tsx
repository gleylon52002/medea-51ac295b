import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "./ProductCard";
import { Sparkles, Loader2 } from "lucide-react";
import { ProductWithCategory } from "@/hooks/useProducts";

interface AIRecommendationsProps {
  currentProductId?: string;
  title?: string;
  limit?: number;
}

const AIRecommendations = ({ currentProductId, title = "Size Özel Öneriler", limit = 4 }: AIRecommendationsProps) => {
  const { user } = useAuth();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["ai-recommendations", user?.id, currentProductId],
    queryFn: async () => {
      // Strategy 1: If user is logged in, get products from same categories they've interacted with
      if (user) {
        const { data: interactions } = await supabase
          .from("user_interactions")
          .select("product_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const viewedIds = interactions?.map(i => i.product_id) || [];

        if (viewedIds.length > 0) {
          // Get categories of viewed products
          const { data: viewedProducts } = await supabase
            .from("products")
            .select("category_id")
            .in("id", viewedIds)
            .not("category_id", "is", null);

          const categoryIds = [...new Set(viewedProducts?.map(p => p.category_id).filter(Boolean))];

          if (categoryIds.length > 0) {
            const excludeIds = currentProductId ? [...viewedIds, currentProductId] : viewedIds;
            const { data } = await supabase
              .from("products")
              .select("*, categories(*)")
              .eq("is_active", true)
              .in("category_id", categoryIds)
              .not("id", "in", `(${excludeIds.join(",")})`)
              .limit(limit);

            if (data && data.length >= 2) return data as ProductWithCategory[];
          }
        }
      }

      // Strategy 2: Fallback to popular/featured products
      const { data: popular } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .not("id", "eq", currentProductId || "00000000-0000-0000-0000-000000000000")
        .limit(limit);

      return (popular || []) as ProductWithCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default AIRecommendations;
