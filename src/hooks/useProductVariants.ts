import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VariantType = "color" | "weight" | "scent";

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: VariantType;
  name: string;
  value: string;
  color_code: string | null;
  price_adjustment: number;
  stock: number;
  images: string[];
  sku: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVariantInput {
  product_id: string;
  variant_type: VariantType;
  name: string;
  value: string;
  color_code?: string;
  price_adjustment?: number;
  stock?: number;
  images?: string[];
  sku?: string;
  is_active?: boolean;
  sort_order?: number;
}

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variant: CreateVariantInput) => {
      const { data, error } = await supabase
        .from("product_variants")
        .insert(variant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", variables.product_id] });
      toast.success("Varyant eklendi");
    },
    onError: () => {
      toast.error("Varyant eklenemedi");
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductVariant> & { id: string }) => {
      const { data, error } = await supabase
        .from("product_variants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", data.product_id] });
      toast.success("Varyant güncellendi");
    },
    onError: () => {
      toast.error("Varyant güncellenemedi");
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", data.productId] });
      toast.success("Varyant silindi");
    },
    onError: () => {
      toast.error("Varyant silinemedi");
    },
  });
};

// Get variant type display name
export const getVariantTypeLabel = (type: VariantType): string => {
  const labels: Record<VariantType, string> = {
    color: "Renk",
    weight: "Ağırlık",
    scent: "Koku/Aroma",
  };
  return labels[type];
};
