import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  template_type: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmsSettings {
  id: string;
  provider: string;
  config: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmsLog {
  id: string;
  template_id: string | null;
  phone: string;
  content: string;
  provider: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, any>;
  sent_at: string | null;
  created_at: string;
}

export const useSmsTemplates = () => {
  return useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as SmsTemplate[];
    },
  });
};

export const useSmsSettings = () => {
  return useQuery({
    queryKey: ["sms-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_settings" as any)
        .select("*")
        .order("provider");
      if (error) throw error;
      return data as unknown as SmsSettings[];
    },
  });
};

export const useSmsLogs = () => {
  return useQuery({
    queryKey: ["sms-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as SmsLog[];
    },
  });
};

export const useCreateSmsTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: Omit<SmsTemplate, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("sms_templates" as any)
        .insert(template as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("SMS şablonu oluşturuldu");
    },
    onError: () => toast.error("Şablon oluşturulamadı"),
  });
};

export const useUpdateSmsTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SmsTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("sms_templates" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("SMS şablonu güncellendi");
    },
    onError: () => toast.error("Şablon güncellenemedi"),
  });
};

export const useDeleteSmsTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sms_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("SMS şablonu silindi");
    },
    onError: () => toast.error("Şablon silinemedi"),
  });
};

export const useUpdateSmsSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SmsSettings> & { id: string }) => {
      const { error } = await supabase
        .from("sms_settings" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-settings"] });
      toast.success("SMS ayarları güncellendi");
    },
    onError: () => toast.error("Ayarlar güncellenemedi"),
  });
};
