import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProductTags = (productId: string) => {
  return useQuery({
    queryKey: ["product-tags", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_tags")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

export const useAllProductTags = () => {
  return useQuery({
    queryKey: ["product-tags-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_tags")
        .select("product_id, tag");
      if (error) throw error;
      return data;
    },
  });
};
