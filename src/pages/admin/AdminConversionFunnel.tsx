import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Cell } from "recharts";
import { TrendingDown, Users, ShoppingCart, CreditCard, CheckCircle } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  view_cart: "Sepet Görüntüleme",
  begin_checkout: "Ödeme Başlangıcı",
  shipping_info: "Teslimat Bilgileri",
  payment_method: "Ödeme Yöntemi",
  order_confirmed: "Sipariş Onayı",
  order_completed: "Sipariş Tamamlandı",
};

const STEP_ORDER = ["view_cart", "begin_checkout", "shipping_info", "payment_method", "order_confirmed", "order_completed"];

const STEP_ICONS = [Users, ShoppingCart, ShoppingCart, CreditCard, CheckCircle, CheckCircle];
const STEP_COLORS = ["hsl(var(--primary))", "hsl(var(--primary) / 0.85)", "hsl(var(--primary) / 0.7)", "hsl(var(--primary) / 0.55)", "hsl(var(--primary) / 0.4)", "hsl(142 76% 36%)"];

const AdminConversionFunnel = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["checkout-funnel-events"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("checkout_events" as any)
        .select("step, session_id, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Array<{ step: string; session_id: string; created_at: string }>;
    },
  });

  const funnelData = useMemo(() => {
    if (!events) return [];

    const stepCounts: Record<string, Set<string>> = {};
    STEP_ORDER.forEach(step => { stepCounts[step] = new Set(); });

    events.forEach(e => {
      if (stepCounts[e.step]) {
        stepCounts[e.step].add(e.session_id);
      }
    });

    return STEP_ORDER.map((step, i) => {
      const count = stepCounts[step].size;
      const prevCount = i > 0 ? stepCounts[STEP_ORDER[i - 1]].size : count;
      const dropOff = prevCount > 0 ? ((prevCount - count) / prevCount * 100) : 0;

      return {
        step: STEP_LABELS[step] || step,
        count,
        dropOff: Math.round(dropOff),
        color: STEP_COLORS[i],
      };
    });
  }, [events]);

  const totalSessions = funnelData[0]?.count || 0;
  const completedSessions = funnelData[funnelData.length - 1]?.count || 0;
  const overallConversion = totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(1) : "0";
  const biggestDropStep = funnelData.reduce((max, d) => d.dropOff > (max?.dropOff || 0) ? d : max, funnelData[0]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dönüşüm Hunisi</h1>
        <p className="text-muted-foreground">Son 30 gün - Checkout adımlarında kullanıcı kayıp analizi</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Oturum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Checkout başlatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dönüşüm Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overallConversion}%</div>
            <p className="text-xs text-muted-foreground">Tamamlanan siparişler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              En Büyük Kayıp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{biggestDropStep?.dropOff || 0}%</div>
            <p className="text-xs text-muted-foreground">{biggestDropStep?.step}</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Adım Bazlı Huni</CardTitle>
          <CardDescription>Her adımda kaç oturum kaldığı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="step" type="category" width={160} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, "Oturum"]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" name="Oturum" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Drop-off Details */}
      <Card>
        <CardHeader>
          <CardTitle>Adım Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: step.color, color: "white" }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.step}</p>
                    <p className="text-xs text-muted-foreground">{step.count} oturum</p>
                  </div>
                </div>
                {i > 0 && (
                  <div className={`text-sm font-semibold ${step.dropOff > 30 ? "text-destructive" : step.dropOff > 15 ? "text-amber-600" : "text-green-600"}`}>
                    {step.dropOff > 0 ? `↓ ${step.dropOff}% kayıp` : "Kayıp yok"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConversionFunnel;
