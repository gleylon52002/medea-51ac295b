import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, Tag, TrendingUp, Flame, ArrowRight, Zap, Gift, Timer } from "lucide-react";

const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const hasTime = timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0;
  if (!hasTime) return <Badge variant="destructive" className="text-xs">Sona erdi</Badge>;

  return (
    <div className="flex items-center gap-1">
      <Timer className="h-3.5 w-3.5 text-destructive animate-pulse" />
      <div className="flex gap-0.5 font-mono text-xs font-bold">
        {timeLeft.days > 0 && <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{timeLeft.days}g</span>}
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="text-destructive">:</span>
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="text-destructive">:</span>
        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, "0")}</span>
      </div>
    </div>
  );
};

const Campaigns = () => {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["active-campaigns"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !campaigns || campaigns.length === 0) return null;

  const gradients = [
    "from-primary/90 to-primary/60",
    "from-destructive/90 to-destructive/60",
    "from-orange-500/90 to-yellow-500/60",
    "from-emerald-600/90 to-teal-500/60",
  ];

  return (
    <section className="container-main py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Flame className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold">Kampanyalar</h2>
            <p className="text-sm text-muted-foreground">Kaçırılmayacak fırsatlar</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/urunler" className="gap-1">
            Tümünü Gör <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((campaign, index) => {
          const discount = campaign.discount_value;
          const isPercentage = campaign.discount_type === "percentage";
          const gradient = gradients[index % gradients.length];

          return (
            <Link key={campaign.id} to="/urunler" className="group">
              <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${gradient} text-white h-full hover:scale-[1.02] transition-transform duration-300`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <CardContent className="relative p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        {index % 2 === 0 ? <Zap className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                      </div>
                      <Badge className="bg-white/20 text-white border-0 font-bold text-sm backdrop-blur-sm">
                        {isPercentage ? `%${discount}` : `${discount}₺`} İNDİRİM
                      </Badge>
                    </div>
                    {campaign.ends_at && <CountdownTimer endsAt={campaign.ends_at} />}
                  </div>

                  <h3 className="font-bold text-xl mb-2 group-hover:translate-x-1 transition-transform">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-white/80 line-clamp-2 mb-4">
                    {campaign.description || "Bu fırsatı kaçırmayın!"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      {(campaign as any).min_purchase_amount && (
                        <span>Min. {(campaign as any).min_purchase_amount}₺</span>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-1">
                      Alışverişe Başla <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default Campaigns;
