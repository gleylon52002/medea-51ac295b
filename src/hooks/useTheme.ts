import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ThemeSettings {
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  accent_hue: number;
  accent_saturation: number;
  accent_lightness: number;
}

export const useTheme = () => {
  const { data: themeSettings } = useQuery({
    queryKey: ["site-settings", "theme"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "theme")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as ThemeSettings | undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (themeSettings) {
      const root = document.documentElement;
      
      // Apply primary color
      root.style.setProperty('--primary', `${themeSettings.primary_hue} ${themeSettings.primary_saturation}% ${themeSettings.primary_lightness}%`);
      root.style.setProperty('--olive', `${themeSettings.primary_hue} ${themeSettings.primary_saturation}% ${themeSettings.primary_lightness}%`);
      root.style.setProperty('--olive-light', `${themeSettings.primary_hue} ${Math.max(themeSettings.primary_saturation - 5, 0)}% ${Math.min(themeSettings.primary_lightness + 15, 100)}%`);
      root.style.setProperty('--ring', `${themeSettings.primary_hue} ${themeSettings.primary_saturation}% ${themeSettings.primary_lightness}%`);
      
      // Apply accent color
      root.style.setProperty('--accent', `${themeSettings.accent_hue} ${themeSettings.accent_saturation}% ${themeSettings.accent_lightness}%`);
      root.style.setProperty('--terracotta', `${themeSettings.accent_hue} ${themeSettings.accent_saturation}% ${themeSettings.accent_lightness}%`);
      
      // Update sidebar primary
      root.style.setProperty('--sidebar-primary', `${themeSettings.primary_hue} ${themeSettings.primary_saturation}% ${themeSettings.primary_lightness}%`);
      root.style.setProperty('--sidebar-ring', `${themeSettings.primary_hue} ${themeSettings.primary_saturation}% ${themeSettings.primary_lightness}%`);
    }
  }, [themeSettings]);

  return themeSettings;
};
