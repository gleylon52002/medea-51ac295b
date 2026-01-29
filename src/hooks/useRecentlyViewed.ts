import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductWithCategory } from "./useProducts";

const STORAGE_KEY = "medea_recently_viewed";
const MAX_ITEMS = 8;

interface RecentlyViewedProduct {
  id: string;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const recentIds: RecentlyViewedProduct[] = JSON.parse(stored);
        const ids = recentIds.map((r) => r.id);

        if (ids.length === 0) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            categories (*)
          `)
          .in("id", ids)
          .eq("is_active", true);

        if (error) throw error;

        // Sort by view order
        const sortedData = ids
          .map((id) => data?.find((p) => p.id === id))
          .filter(Boolean) as ProductWithCategory[];

        setProducts(sortedData);
      } catch (error) {
        console.error("Error fetching recently viewed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, []);

  return { products, isLoading };
};

export const addToRecentlyViewed = (productId: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let recentIds: RecentlyViewedProduct[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    recentIds = recentIds.filter((r) => r.id !== productId);

    // Add to front
    recentIds.unshift({
      id: productId,
      viewedAt: Date.now(),
    });

    // Keep only MAX_ITEMS
    recentIds = recentIds.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIds));
  } catch (error) {
    console.error("Error saving to recently viewed:", error);
  }
};

export const clearRecentlyViewed = () => {
  localStorage.removeItem(STORAGE_KEY);
};
