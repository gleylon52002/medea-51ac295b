import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Initializes Hotjar or Microsoft Clarity tracking based on site_settings.
 * Keys: 'hotjar_id' or 'clarity_id' in site_settings table.
 */
export const useHeatmapTracking = () => {
  useEffect(() => {
    const initTracking = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["hotjar_id", "clarity_id"]);

      if (!data) return;

      for (const setting of data) {
        const val = typeof setting.value === "string" ? setting.value : String(setting.value);
        if (!val) continue;

        if (setting.key === "hotjar_id") {
          // Hotjar initialization
          const script = document.createElement("script");
          script.innerHTML = `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${val},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`;
          document.head.appendChild(script);
        }

        if (setting.key === "clarity_id") {
          // Microsoft Clarity initialization
          const script = document.createElement("script");
          script.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${val}");`;
          document.head.appendChild(script);
        }
      }
    };

    initTracking();
  }, []);
};
