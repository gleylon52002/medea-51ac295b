import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Review = Database["public"]["Tables"]["reviews"]["Row"];

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });
};

export const useProductRating = (productId: string) => {
  return useQuery({
    queryKey: ["reviews", productId, "rating"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("product_id", productId)
        .eq("is_approved", true);
      if (error) throw error;
      if (!data || data.length === 0) return { average: 0, count: 0 };
      const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return { average: Math.round(average * 10) / 10, count: data.length };
    },
    enabled: !!productId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId, rating, comment, images,
    }: {
      productId: string;
      rating: number;
      comment: string;
      images?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Giriş yapmalısınız");

      const { data: hasPurchased, error: checkError } = await supabase.rpc('has_purchased_product', {
        p_user_id: user.id, p_product_id: productId
      });
      if (checkError) throw checkError;
      if (!hasPurchased) throw new Error("Bu ürünü satın almadan değerlendirme yapamazsınız");

      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment,
        images: images || [],
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      toast.success("Yorumunuz gönderildi, onay sonrası yayınlanacaktır");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Yorum gönderilemedi");
    },
  });
};
