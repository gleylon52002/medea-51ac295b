import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useLoyaltyPoints = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["loyalty-points", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useLoyaltyTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["loyalty-transactions", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useEarnPoints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ points, description, orderId }: { points: number; description: string; orderId?: string }) => {
      if (!user) throw new Error("Auth required");

      // Ensure loyalty_points record exists
      const { data: existing } = await supabase
        .from("loyalty_points")
        .select("id, points, total_earned")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("loyalty_points")
          .update({
            points: existing.points + points,
            total_earned: existing.total_earned + points,
            tier: getTier(existing.total_earned + points),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("loyalty_points").insert({
          user_id: user.id,
          points,
          total_earned: points,
          tier: getTier(points),
        });
      }

      // Log transaction
      await supabase.from("loyalty_transactions").insert({
        user_id: user.id,
        points,
        transaction_type: "earn",
        description,
        order_id: orderId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-points"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    },
  });
};

export const getTier = (totalEarned: number): string => {
  if (totalEarned >= 10000) return "platinum";
  if (totalEarned >= 5000) return "gold";
  if (totalEarned >= 2000) return "silver";
  return "bronze";
};

export const getTierLabel = (tier: string): string => {
  const labels: Record<string, string> = {
    bronze: "Bronz",
    silver: "Gümüş",
    gold: "Altın",
    platinum: "Platin",
  };
  return labels[tier] || "Bronz";
};

export const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    bronze: "text-amber-700 bg-amber-100",
    silver: "text-slate-600 bg-slate-100",
    gold: "text-yellow-700 bg-yellow-100",
    platinum: "text-purple-700 bg-purple-100",
  };
  return colors[tier] || colors.bronze;
};

export const getNextTierInfo = (tier: string, totalEarned: number) => {
  const tiers = [
    { name: "bronze", threshold: 0 },
    { name: "silver", threshold: 2000 },
    { name: "gold", threshold: 5000 },
    { name: "platinum", threshold: 10000 },
  ];

  const currentIndex = tiers.findIndex((t) => t.name === tier);
  if (currentIndex >= tiers.length - 1) return null;

  const next = tiers[currentIndex + 1];
  return {
    name: getTierLabel(next.name),
    threshold: next.threshold,
    remaining: next.threshold - totalEarned,
    progress: ((totalEarned - tiers[currentIndex].threshold) / (next.threshold - tiers[currentIndex].threshold)) * 100,
  };
};
