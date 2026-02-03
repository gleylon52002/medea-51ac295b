import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GeneralSettings {
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
}

interface ContactSettings {
  email: string;
  phone: string;
  address: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach((item) => {
        settings[item.key] = item.value;
      });
      
      return settings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useGeneralSettings = () => {
  const { data: settings, ...rest } = useSiteSettings();
  
  return {
    ...rest,
    data: settings?.general as GeneralSettings | undefined,
  };
};

export const useContactSettings = () => {
  const { data: settings, ...rest } = useSiteSettings();
  
  return {
    ...rest,
    data: settings?.contact as ContactSettings | undefined,
  };
};