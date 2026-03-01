import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useIsMobile } from "@/hooks/use-mobile";

const AppPromotionPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { data: settings } = useSiteSettings();
  const isMobile = useIsMobile();

  const appSettings = settings?.app_promotion as {
    android_url?: string;
    ios_url?: string;
    android_logo?: string;
    ios_logo?: string;
    enabled?: boolean;
  } | undefined;

  useEffect(() => {
    if (!appSettings?.enabled || isMobile) return;
    if (!appSettings.android_url && !appSettings.ios_url) return;

    const dismissed = sessionStorage.getItem("app_promo_dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [appSettings, isMobile]);

  if (!isVisible || isMobile) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("app_promo_dismissed", "1");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 max-w-[300px] relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Kapat"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Mobil Uygulamamız</p>
            <p className="text-xs text-muted-foreground">Daha iyi deneyim için indirin</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {appSettings?.android_url && (
            <a
              href={appSettings.android_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              {appSettings.android_logo ? (
                <img src={appSettings.android_logo} alt="Android" className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">A</span>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">İNDİR</p>
                <p className="text-sm font-medium text-foreground">Google Play</p>
              </div>
            </a>
          )}

          {appSettings?.ios_url && (
            <a
              href={appSettings.ios_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              {appSettings.ios_logo ? (
                <img src={appSettings.ios_logo} alt="iOS" className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">i</span>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">İNDİR</p>
                <p className="text-sm font-medium text-foreground">App Store</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPromotionPopup;
