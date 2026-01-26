import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavorites = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useIsFavorite = (productId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["favorites", user?.id, productId],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!productId,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Giriş yapmalısınız");

      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add favorite
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: (result, productId) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      if (result.action === "added") {
        toast.success("Favorilere eklendi");
      } else {
        toast.info("Favorilerden çıkarıldı");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "İşlem başarısız");
    },
  });
};
