import { useState, useEffect } from "react";
import { Clock, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const FlashSaleBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const { data: flashCampaign } = useQuery({
    queryKey: ["flash-campaign"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .not("ends_at", "is", null)
        .gte("ends_at", now)
        .order("ends_at", { ascending: true })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!flashCampaign?.ends_at) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(flashCampaign.ends_at!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashCampaign?.ends_at]);

  if (!flashCampaign) return null;

  const isPercentage = flashCampaign.discount_type === "percentage";
  const hasTime = timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0;

  if (!hasTime) return null;

  return (
    <Link to="/urunler" className="block">
      <div className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground">
        <div className="container-main py-3 flex flex-wrap items-center justify-center gap-4 text-sm md:text-base">
          <div className="flex items-center gap-2 font-bold">
            <Flame className="h-5 w-5 animate-pulse" />
            <span>FLASH SATIŞ</span>
          </div>

          <span className="font-medium">{flashCampaign.name}</span>

          <Badge variant="secondary" className="bg-white/20 text-white border-0 font-bold">
            {isPercentage ? `%${flashCampaign.discount_value}` : `${flashCampaign.discount_value}₺`} İNDİRİM
          </Badge>

          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <div className="flex gap-1 font-mono font-bold">
              <span className="bg-black/20 px-2 py-0.5 rounded">{String(timeLeft.hours).padStart(2, "0")}</span>
              <span>:</span>
              <span className="bg-black/20 px-2 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, "0")}</span>
              <span>:</span>
              <span className="bg-black/20 px-2 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FlashSaleBanner;
