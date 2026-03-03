import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Award, Calendar, Star, Trophy, Gift, Heart, Zap, MessageSquare, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const ICON_MAP: Record<string, any> = {
  "shopping-bag": ShoppingBag,
  "message-square": MessageSquare,
  "heart": Heart,
  "zap": Zap,
  "star": Star,
  "gift": Gift,
  "award": Award,
};

const Badges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allBadges } = useQuery({
    queryKey: ["badge-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_definitions")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: userBadges } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge_definitions(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: checkinData } = useQuery({
    queryKey: ["daily-checkin", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .eq("checkin_date", today)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const checkin = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş yapmalısınız");
      // Get yesterday's checkin for streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: yesterdayCheckin } = await supabase
        .from("daily_checkins")
        .select("streak_days")
        .eq("user_id", user.id)
        .eq("checkin_date", yesterday.toISOString().split('T')[0])
        .maybeSingle();

      const streak = (yesterdayCheckin?.streak_days || 0) + 1;
      const points = Math.min(5 + streak, 25); // 5-25 points based on streak

      const { error } = await supabase.from("daily_checkins").insert({
        user_id: user.id,
        streak_days: streak,
        points_earned: points,
      });
      if (error) throw error;
      return { streak, points };
    },
    onSuccess: (data) => {
      toast.success(`Günlük giriş ödülü: +${data.points} puan! 🎯 ${data.streak} gün seri!`);
      queryClient.invalidateQueries({ queryKey: ["daily-checkin"] });
    },
    onError: () => toast.error("Bugün zaten giriş yaptınız!"),
  });

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id));

  return (
    <Layout>
      <SEOHead title="Rozetler & Ödüller - Medea" description="Alışveriş yaparak rozetler kazanın" />
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> Rozetler & Ödüller</h1>
            <p className="text-muted-foreground text-sm">Alışveriş yaparak, yorum yazarak ve topluluğa katkıda bulunarak rozetler kazanın!</p>
          </div>
        </div>

        {/* Daily Check-in */}
        {user && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Günlük Giriş Ödülü</h3>
                <p className="text-sm text-muted-foreground">Her gün giriş yapın, puan kazanın!</p>
              </div>
            </div>
            {checkinData ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Bugün toplandı! +{checkinData.points_earned} puan</span>
              </div>
            ) : (
              <Button onClick={() => checkin.mutate()} disabled={checkin.isPending}>
                {checkin.isPending ? "..." : "Günlük Ödülü Al"}
              </Button>
            )}
          </div>
        )}

        {/* Badge Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges?.map(badge => {
            const earned = earnedBadgeIds.has(badge.id);
            const IconComp = ICON_MAP[badge.icon] || Award;
            const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);

            return (
              <div key={badge.id} className={`rounded-xl border p-4 text-center transition-all ${
                earned ? "bg-primary/5 border-primary/30 shadow-sm" : "opacity-50 grayscale"
              }`}>
                <div className={`h-14 w-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  earned ? "bg-primary/20" : "bg-muted"
                }`}>
                  <IconComp className={`h-7 w-7 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="font-semibold text-sm">{badge.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                {badge.points_reward > 0 && (
                  <span className="text-xs text-primary font-medium mt-1 block">+{badge.points_reward} puan</span>
                )}
                {earned && userBadge && (
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(userBadge.earned_at), { locale: tr, addSuffix: true })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Badges;
