import { useEffect } from "react";
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
  const general = settings?.general as GeneralSettings | undefined;

  // Dynamically apply favicon from database
  useEffect(() => {
    if (general?.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = general.favicon_url;
      link.type = "image/png";

      let shortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
      if (!shortcut) {
        shortcut = document.createElement("link");
        shortcut.rel = "shortcut icon";
        document.head.appendChild(shortcut);
      }
      shortcut.href = general.favicon_url;
    }
  }, [general?.favicon_url]);

  return {
    ...rest,
    data: general,
  };
};

export const useContactSettings = () => {
  const { data: settings, ...rest } = useSiteSettings();
  
  return {
    ...rest,
    data: settings?.contact as ContactSettings | undefined,
  };
};