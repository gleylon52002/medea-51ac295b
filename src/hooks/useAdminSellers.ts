import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SellerApplication, Seller } from "./useSeller";

// Hook for fetching all seller applications (admin)
export const useSellerApplications = () => {
  return useQuery({
    queryKey: ["admin-seller-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SellerApplication[];
    },
  });
};

// Hook for fetching all sellers (admin)
export const useAllSellers = () => {
  return useQuery({
    queryKey: ["admin-all-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Seller[];
    },
  });
};

// Hook for fetching all transactions (admin)
export const useAllTransactions = () => {
  return useQuery({
    queryKey: ["admin-all-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_transactions")
        .select(`
          *,
          seller:sellers (
            company_name,
            id
          ),
          order:orders (
            order_number,
            shipping_address,
            status,
            tracking_number,
            shipping_company,
            created_at,
            shipping_cost
          ),
          product:products (
            name,
            images
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // @ts-ignore
      return data;
    },
  });
};

// Hook for approving seller application
export const useApproveSellerApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, commissionRate }: { applicationId: string; commissionRate?: number }) => {
      // Get application details
      const { data: application, error: fetchError } = await supabase
        .from("seller_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchError || !application) {
        throw new Error("Başvuru bulunamadı");
      }

      // Update application status
      const { error: updateError } = await supabase
        .from("seller_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // Create seller record
      const { data: seller, error: createError } = await supabase
        .from("sellers")
        .insert({
          user_id: application.user_id,
          application_id: applicationId,
          company_name: application.company_name,
          tax_number: application.tax_number,
          phone: application.phone,
          address: application.address,
          city: application.city,
          district: application.district,
          bank_name: application.bank_name,
          iban: application.iban,
          account_holder: application.account_holder,
          commission_rate: commissionRate || 15,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add seller role to user
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: application.user_id,
          role: "seller",
        });

      if (roleError && roleError.code !== "23505") {
        console.error("Role error:", roleError);
      }

      // Create welcome notification
      await supabase.from("seller_notifications").insert({
        seller_id: seller.id,
        title: "Hoş Geldiniz! 🎉",
        message: "Satıcı başvurunuz onaylandı. Artık ürünlerinizi satışa çıkarabilirsiniz!",
        notification_type: "system",
      });

      return seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seller-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-sellers"] });
      toast.success("Başvuru onaylandı ve satıcı hesabı oluşturuldu!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook for rejecting seller application
export const useRejectSellerApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      const { error } = await supabase
        .from("seller_applications")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seller-applications"] });
      toast.success("Başvuru reddedildi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook for updating seller (admin)
export const useUpdateSeller = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sellerId,
      data
    }: {
      sellerId: string;
      data: Partial<Seller>
    }) => {
      const { error } = await supabase
        .from("sellers")
        .update(data)
        .eq("id", sellerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-sellers"] });
      toast.success("Satıcı bilgileri güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook for adding points to seller
export const useAddSellerPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sellerId,
      points,
      pointType,
      reason
    }: {
      sellerId: string;
      points: number;
      pointType: "reputation" | "penalty" | "purchased";
      reason: string;
    }) => {
      // Add to points history
      const { error: historyError } = await supabase
        .from("seller_points_history")
        .insert({
          seller_id: sellerId,
          points: pointType === "penalty" ? -Math.abs(points) : Math.abs(points),
          point_type: pointType,
          reason,
        });

      if (historyError) throw historyError;

      // Get current seller data
      const { data: seller, error: fetchError } = await supabase
        .from("sellers")
        .select("reputation_points, penalty_points")
        .eq("id", sellerId)
        .single();

      if (fetchError) throw fetchError;

      // Update seller points
      const updateData: Partial<Seller> = {};
      if (pointType === "penalty") {
        updateData.penalty_points = (seller.penalty_points || 0) + Math.abs(points);
      } else {
        updateData.reputation_points = (seller.reputation_points || 0) + Math.abs(points);
      }

      const { error: updateError } = await supabase
        .from("sellers")
        .update(updateData)
        .eq("id", sellerId);

      if (updateError) throw updateError;

      // Create notification
      const notificationType = pointType === "penalty" ? "warning" : "points";
      const title = pointType === "penalty"
        ? `⚠️ ${Math.abs(points)} Ceza Puanı`
        : `🎉 +${Math.abs(points)} Takdir Puanı`;

      await supabase.from("seller_notifications").insert({
        seller_id: sellerId,
        title,
        message: reason,
        notification_type: notificationType,
        metadata: { points, point_type: pointType },
      });

      // Check if seller should be suspended/banned
      const { data: settings } = await supabase
        .from("seller_settings")
        .select("key, value")
        .in("key", ["suspension_threshold", "ban_threshold"]);

      const settingsMap = settings?.reduce((acc, s) => {
        acc[s.key] = Number(s.value);
        return acc;
      }, {} as Record<string, number>) || {};

      const newPenaltyPoints = updateData.penalty_points || seller.penalty_points || 0;

      if (newPenaltyPoints >= (settingsMap.ban_threshold || 100)) {
        await supabase
          .from("sellers")
          .update({
            status: "banned",
            suspended_reason: "Ceza puanı limitini aştınız"
          })
          .eq("id", sellerId);

        await supabase.from("seller_notifications").insert({
          seller_id: sellerId,
          title: "🚫 Hesabınız Kapatıldı",
          message: "Ceza puanı limitini aştığınız için hesabınız kalıcı olarak kapatılmıştır.",
          notification_type: "suspension",
        });
      } else if (newPenaltyPoints >= (settingsMap.suspension_threshold || 50)) {
        await supabase
          .from("sellers")
          .update({
            status: "suspended",
            suspended_reason: "Yüksek ceza puanı",
            suspended_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
          })
          .eq("id", sellerId);

        await supabase.from("seller_notifications").insert({
          seller_id: sellerId,
          title: "⏸️ Hesabınız Askıya Alındı",
          message: "Yüksek ceza puanı nedeniyle hesabınız 7 gün süreyle askıya alınmıştır.",
          notification_type: "suspension",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      queryClient.invalidateQueries({ queryKey: ["seller-points-history"] });
      toast.success("Puan eklendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook for updating seller settings
export const useUpdateSellerSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Record<string, string | number>) => {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("seller_settings")
          .update({ value: String(value) })
          .eq("key", key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-settings"] });
      toast.success("Ayarlar güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
// Hook for fetching all payout requests (admin)
export const useAdminPayoutRequests = () => {
  return useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_payout_requests" as any)
        .select(`
          *,
          seller:sellers (
            company_name,
            id,
            iban,
            bank_name,
            account_holder
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Hook for updating payout request status (admin)
export const useUpdatePayoutRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status, adminNotes }: { requestId: string; status: string; adminNotes?: string }) => {
      const { data: request, error: fetchError } = await supabase
        .from("seller_payout_requests" as any)
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError || !request) throw new Error("Talep bulunamadı");

      const { error: updateError } = await supabase
        .from("seller_payout_requests" as any)
        .update({
          status,
          admin_notes: adminNotes,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Handle balance based on status
      if (status === 'paid') {
        // Deduct from pending balance (already locked when request was created)
        const { error: balanceError } = await (supabase.rpc as any)('deduct_seller_balance', {
          p_seller_id: (request as any).seller_id,
          p_amount: (request as any).amount
        });
        if (balanceError) throw balanceError;
      } else if (status === 'rejected') {
        // Unlock balance back to available
        const { error: unlockError } = await (supabase.rpc as any)('reject_payout_and_unlock', {
          p_seller_id: (request as any).seller_id,
          p_amount: (request as any).amount
        });
        if (unlockError) throw unlockError;
      }

      // Create notification for seller
      await supabase.from("seller_notifications").insert({
        seller_id: (request as any).seller_id,
        title: status === 'paid' ? "💰 Ödemeniz Yapıldı" :
          status === 'approved' ? "✅ Ödeme Talebiniz Onaylandı" : "❌ Ödeme Talebiniz Reddedildi",
        message: status === 'paid' ? `${(request as any).amount} TL tutarındaki ödemeniz banka hesabınıza aktarılmıştır.` :
          status === 'rejected' ? `Ödeme talebiniz reddedildi. Bakiyeniz serbest bırakıldı. Sebep: ${adminNotes || 'Belirtilmedi'}` :
            "Ödeme talebiniz işleme alınmıştır.",
        notification_type: status === 'rejected' ? "warning" : "system",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["escrow-balance"] });
      toast.success("Ödeme talebi güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
