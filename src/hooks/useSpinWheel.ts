import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpinWheelSlice {
  id: string;
  label: string;
  prize_type: string;
  discount_value: number;
  min_cart_amount: number;
  probability: number;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  config_id: string;
  created_at: string;
}

export interface SpinWheelConfig {
  id: string;
  is_active: boolean;
  cooldown_hours: number;
  coupon_prefix: string;
  coupon_expiry_hours: number;
  trigger_type: string;
  trigger_delay_seconds: number;
  trigger_scroll_percent: number;
  wheel_colors: string[];
  center_color: string;
  border_color: string;
}

export const useSpinWheelConfig = () => {
  return useQuery({
    queryKey: ["spin-wheel-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spin_wheel_config")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SpinWheelConfig | null;
    },
  });
};

export const useSpinWheelSlices = (configId?: string) => {
  return useQuery({
    queryKey: ["spin-wheel-slices", configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spin_wheel_slices")
        .select("*")
        .eq("config_id", configId!)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SpinWheelSlice[];
    },
    enabled: !!configId,
  });
};

export const useSpinWheelAllConfigs = () => {
  return useQuery({
    queryKey: ["spin-wheel-all-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spin_wheel_config")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SpinWheelConfig[];
    },
  });
};

export const useSpinWheelAllSlices = (configId?: string) => {
  return useQuery({
    queryKey: ["spin-wheel-all-slices", configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spin_wheel_slices")
        .select("*")
        .eq("config_id", configId!)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as SpinWheelSlice[];
    },
    enabled: !!configId,
  });
};

export const useSpinWheelStats = () => {
  return useQuery({
    queryKey: ["spin-wheel-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todaySpins } = await supabase
        .from("spin_results")
        .select("id, is_winner, coupon_code")
        .gte("created_at", today.toISOString());

      const { data: allSpins } = await supabase
        .from("spin_results")
        .select("id, is_winner, coupon_code")
        .order("created_at", { ascending: false });

      // Count how many coupons were used (converted)
      const wonCoupons = (allSpins || []).filter(s => s.coupon_code).map(s => s.coupon_code);
      let convertedCount = 0;
      if (wonCoupons.length > 0) {
        const { count } = await supabase
          .from("coupon_uses")
          .select("id", { count: "exact" })
          .in("coupon_id", wonCoupons.filter(Boolean) as string[]);
        convertedCount = count || 0;
      }

      return {
        todayTotal: todaySpins?.length || 0,
        todayWinners: todaySpins?.filter(s => s.is_winner).length || 0,
        allTimeTotal: allSpins?.length || 0,
        allTimeWinners: allSpins?.filter(s => s.is_winner).length || 0,
        convertedCoupons: convertedCount,
        conversionRate: wonCoupons.length > 0 ? (convertedCount / wonCoupons.length * 100) : 0,
      };
    },
  });
};

export const useUserLastSpin = (userId?: string) => {
  return useQuery({
    queryKey: ["user-last-spin", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spin_results")
        .select("created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
