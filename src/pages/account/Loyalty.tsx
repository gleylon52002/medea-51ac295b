import { Award, Gift, TrendingUp, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLoyaltyPoints, useLoyaltyTransactions, getTierLabel, getTierColor, getNextTierInfo } from "@/hooks/useLoyalty";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Layout from "@/components/layout/Layout";

const LoyaltyPage = () => {
  const { user } = useAuth();
  const { data: loyalty, isLoading } = useLoyaltyPoints();
  const { data: transactions } = useLoyaltyTransactions();

  if (!user) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <p className="text-muted-foreground">Sadakat programını görüntülemek için giriş yapın.</p>
        </div>
      </Layout>
    );
  }

  const points = loyalty?.points || 0;
  const totalEarned = loyalty?.total_earned || 0;
  const tier = loyalty?.tier || "bronze";
  const nextTier = getNextTierInfo(tier, totalEarned);

  const tierBenefits: Record<string, string[]> = {
    bronze: ["Her 100₺ alışverişe 10 puan", "Doğum günü bonusu"],
    silver: ["Her 100₺ alışverişe 15 puan", "Doğum günü bonusu", "%5 özel indirim"],
    gold: ["Her 100₺ alışverişe 20 puan", "Doğum günü bonusu", "%10 özel indirim", "Ücretsiz kargo"],
    platinum: ["Her 100₺ alışverişe 30 puan", "Doğum günü bonusu", "%15 özel indirim", "Ücretsiz kargo", "Öncelikli destek"],
  };

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Sadakat Programı</h1>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Points Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <p className="text-4xl font-bold text-foreground">{points.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Kullanılabilir Puan</p>
              <Badge className={`mt-3 ${getTierColor(tier)}`}>
                {getTierLabel(tier)} Üye
              </Badge>

              {nextTier && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{getTierLabel(tier)}</span>
                    <span>{nextTier.name}</span>
                  </div>
                  <Progress value={nextTier.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {nextTier.name} seviyesine {nextTier.remaining.toLocaleString()} puan kaldı
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Toplam Kazanılan</span>
                <span className="font-semibold">{totalEarned.toLocaleString()} puan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Toplam Harcanan</span>
                <span className="font-semibold">{(loyalty?.total_spent || 0).toLocaleString()} puan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Puan Değeri</span>
                <span className="font-semibold">{(points * 0.01).toFixed(2)}₺</span>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Seviye Avantajları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(tierBenefits[tier] || tierBenefits.bronze).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Puan Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                    <span className={`font-semibold ${tx.points > 0 ? "text-green-600" : "text-destructive"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Henüz puan işlemi yok. Alışveriş yaparak puan kazanmaya başlayın!
              </p>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="mt-8 p-6 bg-muted/30 rounded-xl">
          <h2 className="font-serif text-xl font-semibold mb-4">Nasıl Çalışır?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-medium mb-1">Alışveriş Yapın</h3>
              <p className="text-sm text-muted-foreground">Her 100₺ alışverişte puan kazanın</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-medium mb-1">Puan Biriktirin</h3>
              <p className="text-sm text-muted-foreground">Seviye atlayarak daha fazla avantaj elde edin</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-medium mb-1">İndirim Kullanın</h3>
              <p className="text-sm text-muted-foreground">100 puan = 1₺ olarak harcayın</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoyaltyPage;
