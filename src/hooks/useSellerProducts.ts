import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  images: string[];
  category_id: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  seller_id: string | null;
  ingredients: string | null;
  usage_instructions: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const useSellerProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-products", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get seller id
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!seller) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SellerProduct[];
    },
    enabled: !!user,
  });
};

export const useCreateSellerProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<SellerProduct>) => {
      if (!user) throw new Error("Giriş yapmanız gerekiyor");

      // Get seller id
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("id, status")
        .eq("user_id", user.id)
        .single();

      if (sellerError || !seller) {
        throw new Error("Satıcı hesabınız bulunamadı");
      }

      if (seller.status !== "active") {
        throw new Error("Satıcı hesabınız aktif değil");
      }

      // Generate slug from name
      const slug = data.name
        ?.toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { data: result, error } = await supabase
        .from("products")
        .insert({
          name: data.name,
          slug: `${slug}-${Date.now()}`,
          description: data.description,
          short_description: data.short_description,
          price: data.price,
          sale_price: data.sale_price,
          images: data.images || [],
          category_id: data.category_id,
          stock: data.stock || 0,
          is_active: false, // Needs admin approval
          seller_id: seller.id,
          ingredients: data.ingredients,
          usage_instructions: data.usage_instructions,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      toast.success("Ürün eklendi! Admin onayından sonra yayınlanacaktır.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateSellerProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SellerProduct> & { id: string }) => {
      if (!user) throw new Error("Giriş yapmanız gerekiyor");

      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description,
          short_description: data.short_description,
          price: data.price,
          sale_price: data.sale_price,
          images: data.images,
          category_id: data.category_id,
          stock: data.stock,
          ingredients: data.ingredients,
          usage_instructions: data.usage_instructions,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      toast.success("Ürün güncellendi!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteSellerProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      toast.success("Ürün silindi!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
