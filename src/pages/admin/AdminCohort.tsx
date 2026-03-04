import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

const AdminCohort = () => {
  const { data: cohortData, isLoading } = useQuery({
    queryKey: ["admin-cohort"],
    queryFn: async () => {
      const months = 6;
      const cohorts: { month: string; registered: number; purchased: number; retention: number }[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const start = startOfMonth(subMonths(new Date(), i));
        const end = endOfMonth(subMonths(new Date(), i));
        const monthLabel = format(start, "MMM yyyy", { locale: tr });

        // Users registered in this month
        const { count: regCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());

        // Of those users, how many placed orders?
        const { data: usersInMonth } = await supabase
          .from("profiles")
          .select("user_id")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());

        let purchaseCount = 0;
        if (usersInMonth && usersInMonth.length > 0) {
          const userIds = usersInMonth.map(u => u.user_id);
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .in("user_id", userIds);
          purchaseCount = count || 0;
        }

        const registered = regCount || 0;
        cohorts.push({
          month: monthLabel,
          registered,
          purchased: purchaseCount,
          retention: registered > 0 ? Math.round((purchaseCount / registered) * 100) : 0,
        });
      }

      return cohorts;
    },
  });

  if (isLoading) return <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  const maxReg = Math.max(...(cohortData?.map(c => c.registered) || [1]));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold">Cohort Analizi</h1>
        <p className="text-muted-foreground mt-1">Kayıt dönemine göre kullanıcı satın alma davranışları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son 6 Ay Cohort Tablosu</CardTitle>
          <CardDescription>Her ayda kayıt olan kullanıcıların sipariş oranları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cohortData?.map(c => (
              <div key={c.month} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium">{c.month}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 rounded bg-primary/20" style={{ width: `${(c.registered / maxReg) * 100}%`, minWidth: 4 }} />
                    <span className="text-xs text-muted-foreground">{c.registered} kayıt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 rounded bg-primary" style={{ width: `${(c.purchased / Math.max(maxReg, 1)) * 100}%`, minWidth: c.purchased > 0 ? 4 : 0 }} />
                    <span className="text-xs text-muted-foreground">{c.purchased} sipariş</span>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className={`text-sm font-bold ${c.retention > 30 ? "text-green-600" : c.retention > 10 ? "text-yellow-600" : "text-red-500"}`}>
                    %{c.retention}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Isı Haritası Entegrasyonu</CardTitle>
          <CardDescription>Hotjar veya Microsoft Clarity kullanarak kullanıcı davranışlarını takip edin</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Site ayarlarından Hotjar veya Clarity izleme kodunu ekleyerek kullanıcıların nereye tıkladığını, hangi alanlarda vakit geçirdiğini ve nerede kaybolduğunu görüntüleyebilirsiniz.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-1">Hotjar</h4>
              <p className="text-xs text-muted-foreground mb-2">Isı haritaları, oturum kayıtları, anketler</p>
              <code className="text-xs bg-muted p-2 rounded block">Site Ayarları → hotjar_id</code>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-1">Microsoft Clarity</h4>
              <p className="text-xs text-muted-foreground mb-2">Ücretsiz ısı haritası ve oturum tekrarı</p>
              <code className="text-xs bg-muted p-2 rounded block">Site Ayarları → clarity_id</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCohort;
