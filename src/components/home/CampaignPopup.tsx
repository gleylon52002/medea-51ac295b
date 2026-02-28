import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift, Zap, ArrowRight, Timer } from "lucide-react";

const POPUP_DISMISSED_KEY = "medea_campaign_popup_dismissed";

const CampaignPopup = () => {
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const { data: campaign } = useQuery({
    queryKey: ["popup-campaign"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("discount_value", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!campaign) return;
    const dismissed = sessionStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissed === campaign.id) return;
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [campaign]);

  useEffect(() => {
    if (!campaign?.ends_at) return;
    const interval = setInterval(() => {
      const diff = new Date(campaign.ends_at!).getTime() - Date.now();
      if (diff <= 0) { clearInterval(interval); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [campaign?.ends_at]);

  const handleClose = () => {
    setOpen(false);
    if (campaign) sessionStorage.setItem(POPUP_DISMISSED_KEY, campaign.id);
  };

  if (!campaign) return null;

  const isPercentage = campaign.discount_type === "percentage";
  const discountText = isPercentage ? `%${campaign.discount_value}` : `${campaign.discount_value}₺`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 rounded-2xl">
        <div className="relative bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Gift className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-serif font-bold mb-1">{discountText} İNDİRİM</h3>
            <p className="text-lg font-medium opacity-90">{campaign.name}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-center text-muted-foreground">
            {campaign.description || "Bu fırsatı kaçırmayın! Sınırlı süreli kampanyamızdan yararlanın."}
          </p>

          {campaign.ends_at && (
            <div className="flex items-center justify-center gap-3">
              <Timer className="h-4 w-4 text-destructive animate-pulse" />
              <div className="flex gap-2 font-mono text-sm font-bold">
                {timeLeft.days > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="bg-destructive/10 text-destructive px-2.5 py-1.5 rounded-lg">{timeLeft.days}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Gün</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="bg-destructive/10 text-destructive px-2.5 py-1.5 rounded-lg">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Saat</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="bg-destructive/10 text-destructive px-2.5 py-1.5 rounded-lg">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Dk</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="bg-destructive/10 text-destructive px-2.5 py-1.5 rounded-lg">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Sn</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full gap-2" onClick={handleClose}>
              <Link to="/urunler">
                <Zap className="h-4 w-4" />
                Fırsatı Yakala
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
              Daha sonra
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignPopup;
