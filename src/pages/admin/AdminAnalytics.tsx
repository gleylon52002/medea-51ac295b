import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Activity, Eye, ShoppingCart, Users, TrendingUp, MousePointerClick } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AdminAnalytics = () => {
  const [days, setDays] = useState(7);

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["admin", "analytics-activity", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from("site_activity_logs")
        .select("action_type, page_path, created_at, device_type")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orderData } = useQuery({
    queryKey: ["admin", "analytics-orders", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total, status")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: checkoutData } = useQuery({
    queryKey: ["admin", "analytics-checkout", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from("checkout_events")
        .select("step, created_at")
        .gte("created_at", since);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ga4Setting } = useQuery({
    queryKey: ["admin", "ga4-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ga4_measurement_id")
        .maybeSingle();
      return data?.value as string || "";
    },
  });

  // Process daily traffic data
  const dailyTraffic = (() => {
    if (!activityData) return [];
    const map = new Map<string, { views: number; unique: Set<string>; clicks: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), "yyyy-MM-dd");
      map.set(key, { views: 0, unique: new Set(), clicks: 0 });
    }
    activityData.forEach((a) => {
      const key = format(parseISO(a.created_at), "yyyy-MM-dd");
      const entry = map.get(key);
      if (entry) {
        if (a.action_type === "page_view") entry.views++;
        if (a.action_type === "click") entry.clicks++;
      }
    });
    return Array.from(map.entries()).map(([date, v]) => ({
      date: format(parseISO(date), "dd MMM", { locale: tr }),
      views: v.views,
      clicks: v.clicks,
    }));
  })();

  // Revenue per day
  const dailyRevenue = (() => {
    if (!orderData) return [];
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      map.set(format(subDays(new Date(), i), "yyyy-MM-dd"), 0);
    }
    orderData.forEach((o) => {
      const key = format(parseISO(o.created_at), "yyyy-MM-dd");
      map.set(key, (map.get(key) || 0) + Number(o.total));
    });
    return Array.from(map.entries()).map(([date, total]) => ({
      date: format(parseISO(date), "dd MMM", { locale: tr }),
      revenue: Math.round(total),
    }));
  })();

  // Top pages
  const topPages = (() => {
    if (!activityData) return [];
    const map = new Map<string, number>();
    activityData.filter(a => a.action_type === "page_view").forEach(a => {
      map.set(a.page_path, (map.get(a.page_path) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));
  })();

  // Device breakdown
  const deviceBreakdown = (() => {
    if (!activityData) return [];
    const map = new Map<string, number>();
    activityData.forEach(a => {
      const device = a.device_type || "Bilinmiyor";
      map.set(device, (map.get(device) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  })();

  // Checkout funnel
  const funnelData = (() => {
    if (!checkoutData) return [];
    const steps = ["view_cart", "begin_checkout", "shipping_info", "payment_info", "purchase"];
    const labels: Record<string, string> = {
      view_cart: "Sepet Görüntüleme",
      begin_checkout: "Ödemeye Geçiş",
      shipping_info: "Kargo Bilgisi",
      payment_info: "Ödeme Bilgisi",
      purchase: "Satın Alma",
    };
    const map = new Map<string, number>();
    checkoutData.forEach(c => map.set(c.step, (map.get(c.step) || 0) + 1));
    return steps.map(step => ({
      step: labels[step] || step,
      count: map.get(step) || 0,
    }));
  })();

  // Summary stats
  const totalViews = activityData?.filter(a => a.action_type === "page_view").length || 0;
  const totalOrders = orderData?.length || 0;
  const totalRevenue = orderData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analitik Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Site performansı ve kullanıcı davranışları
            {ga4Setting && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">GA4: {ga4Setting}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <Button key={d} variant={days === d ? "default" : "outline"} size="sm" onClick={() => setDays(d)}>
              {d} Gün
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sayfa Görüntüleme</p>
            </div>
            <p className="text-2xl font-bold mt-1">{totalViews.toLocaleString("tr-TR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sipariş</p>
            </div>
            <p className="text-2xl font-bold mt-1">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gelir</p>
            </div>
            <p className="text-2xl font-bold mt-1">₺{totalRevenue.toLocaleString("tr-TR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Dönüşüm Oranı</p>
            </div>
            <p className="text-2xl font-bold mt-1">%{conversionRate}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList>
            <TabsTrigger value="traffic">Trafik</TabsTrigger>
            <TabsTrigger value="revenue">Gelir</TabsTrigger>
            <TabsTrigger value="pages">Popüler Sayfalar</TabsTrigger>
            <TabsTrigger value="devices">Cihazlar</TabsTrigger>
            <TabsTrigger value="funnel">Dönüşüm Hunisi</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Günlük Trafik</CardTitle>
              <CardDescription>Sayfa görüntüleme ve tıklama verileri</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="Görüntüleme" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" name="Tıklama" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Günlük Gelir</CardTitle>
              <CardDescription>Sipariş bazlı gelir trendi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(val: number) => `₺${val.toLocaleString("tr-TR")}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Gelir" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>En Çok Ziyaret Edilen Sayfalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.map((p, i) => (
                  <div key={p.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}</span>
                      <span className="text-sm truncate max-w-[300px]">{p.page}</span>
                    </div>
                    <span className="text-sm font-medium">{p.count.toLocaleString("tr-TR")}</span>
                  </div>
                ))}
                {topPages.length === 0 && <p className="text-sm text-muted-foreground">Henüz veri yok</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Cihaz Dağılımı</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {deviceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={deviceBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-10">Henüz veri yok</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Checkout Dönüşüm Hunisi</CardTitle>
              <CardDescription>Ödeme sürecindeki adım bazlı kayıp analizi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="step" width={140} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Kullanıcı" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
