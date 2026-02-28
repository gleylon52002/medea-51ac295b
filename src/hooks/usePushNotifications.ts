import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  target_type: string;
  target_user_ids: string[];
  sent_count: number;
  status: string;
  metadata: Record<string, any>;
  sent_by: string | null;
  sent_at: string | null;
  created_at: string;
}

export const usePushNotifications = () => {
  return useQuery({
    queryKey: ["push-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as PushNotification[];
    },
  });
};

export const useSendPushNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      message: string;
      target_type: "all" | "targeted";
      target_user_ids?: string[];
      data?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "send-push-notification",
        { body: payload }
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Bildirim gönderilemedi");
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["push-notifications"] });
      toast.success(`Bildirim ${data.recipients} cihaza gönderildi`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeviceTokenStats = () => {
  return useQuery({
    queryKey: ["device-token-stats"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("push_device_tokens" as any)
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count || 0;
    },
  });
};
