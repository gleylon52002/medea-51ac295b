import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductWithCategory } from "./useProducts";

export interface RelatedProduct {
  id: string;
  product_id: string;
  related_product_id: string;
  relation_type: string;
  sort_order: number;
  created_at: string;
}

export interface RelatedProductWithDetails extends RelatedProduct {
  related_product: ProductWithCategory;
}

export const useRelatedProducts = (productId: string) => {
  return useQuery({
    queryKey: ["related-products", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("related_products")
        .select(`
          *,
          related_product:products!related_products_related_product_id_fkey(
            *,
            categories(*)
          )
        `)
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as RelatedProductWithDetails[];
    },
    enabled: !!productId,
  });
};

export const useAddRelatedProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      relatedProductId,
      relationType = "related",
    }: {
      productId: string;
      relatedProductId: string;
      relationType?: string;
    }) => {
      const { data, error } = await supabase
        .from("related_products")
        .insert({
          product_id: productId,
          related_product_id: relatedProductId,
          relation_type: relationType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["related-products", variables.productId] });
      toast.success("İlgili ürün eklendi");
    },
    onError: () => {
      toast.error("İlgili ürün eklenemedi");
    },
  });
};

export const useRemoveRelatedProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from("related_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["related-products", data.productId] });
      toast.success("İlgili ürün kaldırıldı");
    },
    onError: () => {
      toast.error("İlgili ürün kaldırılamadı");
    },
  });
};
