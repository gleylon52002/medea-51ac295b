import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export interface ProductWithCategory extends Product {
  categories: Category | null;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductWithCategory[];
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);

      if (error) throw error;
      return data as ProductWithCategory[];
    },
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["products", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as ProductWithCategory | null;
    },
    enabled: !!slug,
  });
};

export const useProductsByCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ["products", "category", categorySlug],
    queryFn: async () => {
      // First get the category
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!category) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true)
        .eq("category_id", category.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductWithCategory[];
    },
    enabled: !!categorySlug,
  });
};
