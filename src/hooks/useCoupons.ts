import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCoupons = () => {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!coupon) throw new Error("Geçersiz kupon kodu");

      const now = new Date();
      const startsAt = new Date(coupon.starts_at);
      const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;

      if (now < startsAt) {
        throw new Error("Bu kupon henüz aktif değil");
      }

      if (expiresAt && now > expiresAt) {
        throw new Error("Bu kuponun süresi dolmuş");
      }

      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        throw new Error("Bu kupon kullanım limitine ulaşmış");
      }

      if (orderTotal < coupon.minimum_order_amount) {
        throw new Error(`Bu kupon için minimum sipariş tutarı ${coupon.minimum_order_amount}₺`);
      }

      const discount =
        coupon.discount_type === "percentage"
          ? (orderTotal * coupon.discount_value) / 100
          : coupon.discount_value;

      return {
        coupon: coupon as Coupon,
        discount: Math.min(discount, orderTotal),
      };
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, "id" | "used_count" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert({
          ...coupon,
          code: coupon.code.toUpperCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from("coupons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};

export const useIncrementCouponUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ couponId, orderId, userId }: { couponId: string; orderId: string; userId?: string }) => {
      // Increment used_count
      const { data: coupon } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("id", couponId)
        .single();

      if (coupon) {
        await supabase
          .from("coupons")
          .update({ used_count: coupon.used_count + 1 })
          .eq("id", couponId);
      }

      // Record the usage
      await supabase.from("coupon_uses").insert({
        coupon_id: couponId,
        order_id: orderId,
        user_id: userId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
};
