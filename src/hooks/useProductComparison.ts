import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductWithCategory } from "./useProducts";
import { useState, useEffect } from "react";

const getSessionId = () => {
  if (typeof window === "undefined") return null;
  let sessionId = localStorage.getItem("comparison-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("comparison-session-id", sessionId);
  }
  return sessionId;
};

export interface ComparisonItem {
  id: string;
  user_id: string | null;
  session_id: string | null;
  product_id: string;
  created_at: string;
  product?: ProductWithCategory;
}

export const useComparisonProducts = () => {
  const { user } = useAuth();
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["comparison-products", user?.id || sessionId],
    queryFn: async () => {
      let query = supabase
        .from("product_comparisons")
        .select(`
          *,
          product:products(
            *,
            categories(*)
          )
        `)
        .order("created_at", { ascending: true });

      if (user) {
        query = query.eq("user_id", user.id);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ComparisonItem[];
    },
  });
};

export const useAddToComparison = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async (productId: string) => {
      const insertData: {
        product_id: string;
        user_id?: string;
        session_id?: string;
      } = { product_id: productId };

      if (user) {
        insertData.user_id = user.id;
      } else if (sessionId) {
        insertData.session_id = sessionId;
      }

      const { data, error } = await supabase
        .from("product_comparisons")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-products"] });
      toast.success("Karşılaştırmaya eklendi");
    },
    onError: () => {
      toast.error("Karşılaştırmaya eklenemedi");
    },
  });
};

export const useRemoveFromComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_comparisons")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-products"] });
      toast.success("Karşılaştırmadan çıkarıldı");
    },
    onError: () => {
      toast.error("Karşılaştırmadan çıkarılamadı");
    },
  });
};

export const useClearComparison = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async () => {
      let query = supabase.from("product_comparisons").delete();

      if (user) {
        query = query.eq("user_id", user.id);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-products"] });
      toast.success("Karşılaştırma temizlendi");
    },
    onError: () => {
      toast.error("Karşılaştırma temizlenemedi");
    },
  });
};

export const useIsInComparison = (productId: string) => {
  const { data: comparisons } = useComparisonProducts();
  return comparisons?.some((c) => c.product_id === productId) || false;
};
