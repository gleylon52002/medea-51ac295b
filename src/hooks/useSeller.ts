import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SellerApplication {
  id: string;
  user_id: string;
  company_name: string;
  tax_number: string;
  identity_number: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  bank_name: string;
  iban: string;
  account_holder: string;
  description: string | null;
  category_focus: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  user_id: string;
  application_id: string | null;
  company_name: string;
  tax_number: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  bank_name: string;
  iban: string;
  account_holder: string;
  commission_rate: number;
  reputation_points: number;
  penalty_points: number;
  total_sales: number;
  total_orders: number;
  is_featured: boolean;
  status: "active" | "suspended" | "banned";
  suspended_reason: string | null;
  suspended_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerNotification {
  id: string;
  seller_id: string;
  title: string;
  message: string;
  notification_type: "points" | "order" | "review" | "system" | "warning" | "suspension";
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SellerPointsHistory {
  id: string;
  seller_id: string;
  points: number;
  point_type: "reputation" | "penalty" | "purchased" | "refund";
  reason: string;
  order_id: string | null;
  review_id: string | null;
  created_at: string;
}

export interface SellerTransaction {
  id: string;
  seller_id: string;
  order_id: string | null;
  order_item_id: string | null;
  product_id: string | null;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  status: "pending" | "completed" | "refunded" | "cancelled";
  paid_at: string | null;
  created_at: string;
}

// Hook for checking seller status
export const useSellerStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-status", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check if user has an active seller account
      const { data: seller } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (seller) {
        return { type: "seller" as const, data: seller as Seller };
      }

      // Check if user has a pending application
      const { data: application } = await supabase
        .from("seller_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (application) {
        return { type: "application" as const, data: application as SellerApplication };
      }

      return null;
    },
    enabled: !!user,
  });
};

// Hook for seller profile
export const useSellerProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Seller | null;
    },
    enabled: !!user,
  });
};

// Hook for seller notifications
export const useSellerNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!seller) return [];

      const { data, error } = await supabase
        .from("seller_notifications")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SellerNotification[];
    },
    enabled: !!user,
  });
};

// Hook for seller points history
export const useSellerPointsHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-points-history", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!seller) return [];

      const { data, error } = await supabase
        .from("seller_points_history")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SellerPointsHistory[];
    },
    enabled: !!user,
  });
};

// Hook for seller transactions
export const useSellerTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!seller) return [];

      const { data, error } = await supabase
        .from("seller_transactions")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SellerTransaction[];
    },
    enabled: !!user,
  });
};

// Hook for submitting seller application
export const useSubmitSellerApplication = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<SellerApplication, "id" | "user_id" | "status" | "rejection_reason" | "reviewed_at" | "reviewed_by" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Giriş yapmanız gerekiyor");

      const { data: result, error } = await supabase
        .from("seller_applications")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Zaten bir başvurunuz bulunuyor");
        }
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-status"] });
      toast.success("Başvurunuz alındı! İnceleme sonucu size bildirilecektir.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook for marking notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("seller_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
    },
  });
};

// Hook for seller settings
export const useSellerSettings = () => {
  return useQuery({
    queryKey: ["seller-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_settings")
        .select("*");

      if (error) throw error;

      const settings: Record<string, string | number> = {};
      data.forEach((item: { key: string; value: unknown }) => {
        settings[item.key] = item.value as string | number;
      });

      return settings;
    },
  });
};
