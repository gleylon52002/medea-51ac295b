import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
  category_name: string | null;
  category_slug: string | null;
}

export const useProductSearch = (query: string) => {
  return useQuery({
    queryKey: ["product-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          sale_price,
          images,
          categories (
            name,
            slug
          )
        `)
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return data.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        images: product.images,
        category_name: product.categories?.name || null,
        category_slug: product.categories?.slug || null,
      })) as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
};
