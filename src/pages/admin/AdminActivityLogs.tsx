import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Activity, Eye, ShoppingCart, CreditCard, Users, Monitor, Smartphone, Tablet, Search, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

const actionIcons: Record<string, any> = {
  page_view: Eye,
  product_view: Eye,
  add_to_cart: ShoppingCart,
  purchase: CreditCard,
  seller_login: Users,
};

const actionLabels: Record<string, string> = {
  page_view: "Sayfa Görüntüleme",
  product_view: "Ürün Görüntüleme",
  add_to_cart: "Sepete Ekleme",
  purchase: "Satın Alma",
  seller_login: "Satıcı Girişi",
};

const deviceIcons: Record<string, any> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const AdminActivityLogs = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "today": return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case "week": return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "month": return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      default: return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
    }
  };

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin", "activity-logs", actionFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("site_activity_logs")
        .select("*")
        .gte("created_at", getDateFilter())
        .order("created_at", { ascending: false })
        .limit(500);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "activity-stats", dateRange],
    queryFn: async () => {
      const since = getDateFilter();
      const { data, error } = await supabase
        .from("site_activity_logs")
        .select("action_type, device_type, session_id")
        .gte("created_at", since);

      if (error) throw error;
      const items = data as any[];

      const uniqueSessions = new Set(items.map((i: any) => i.session_id)).size;
      const pageViews = items.filter((i: any) => i.action_type === "page_view").length;
      const productViews = items.filter((i: any) => i.action_type === "product_view").length;
      const cartAdds = items.filter((i: any) => i.action_type === "add_to_cart").length;
      const purchases = items.filter((i: any) => i.action_type === "purchase").length;
      const deviceCounts = items.reduce((acc: any, i: any) => {
        acc[i.device_type || "unknown"] = (acc[i.device_type || "unknown"] || 0) + 1;
        return acc;
      }, {});

      return { uniqueSessions, pageViews, productViews, cartAdds, purchases, deviceCounts };
    },
  });

  const deleteLogsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("site_activity_logs").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity-stats"] });
      setSelectedIds(new Set());
      toast.success("Loglar silindi");
    },
    onError: () => toast.error("Loglar silinemedi"),
  });

  const filteredLogs = logs?.filter((log: any) =>
    !search || 
    log.page_path?.toLowerCase().includes(search.toLowerCase()) ||
    log.session_id?.toLowerCase().includes(search.toLowerCase()) ||
    log.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(log.action_detail)?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredLogs) return;
    if (selectedIds.size === filteredLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const exportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    const headers = ["Zaman", "Aksiyon", "Sayfa", "IP", "Cihaz", "Oturum"];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString("tr-TR"),
      actionLabels[log.action_type] || log.action_type,
      log.page_path || "",
      log.ip_address || "",
      log.device_type || "",
      log.session_id || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aktivite-loglari-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Site Aktivite Logları</h1>
          <p className="text-muted-foreground mt-1">Kullanıcı aktivitelerini ve site trafiğini takip edin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filteredLogs?.length}>
            <Download className="h-4 w-4 mr-1" /> Dışa Aktar
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => deleteLogsMutation.mutate(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4 mr-1" /> {selectedIds.size} Log Sil
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ziyaretçi</span></div><p className="text-2xl font-bold mt-1">{stats?.uniqueSessions || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Eye className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Sayfa</span></div><p className="text-2xl font-bold mt-1">{stats?.pageViews || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Eye className="h-4 w-4 text-purple-500" /><span className="text-xs text-muted-foreground">Ürün</span></div><p className="text-2xl font-bold mt-1">{stats?.productViews || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-orange-500" /><span className="text-xs text-muted-foreground">Sepet</span></div><p className="text-2xl font-bold mt-1">{stats?.cartAdds || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Satış</span></div><p className="text-2xl font-bold mt-1">{stats?.purchases || 0}</p></CardContent></Card>
      </div>

      {/* Device Distribution */}
      {stats?.deviceCounts && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Cihaz Dağılımı</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {Object.entries(stats.deviceCounts).map(([device, count]) => {
                const DeviceIcon = deviceIcons[device] || Monitor;
                const total = Object.values(stats.deviceCounts).reduce((a: number, b: any) => a + (b as number), 0) as number;
                const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <div key={device} className="flex items-center gap-2">
                    <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{device}</span>
                    <Badge variant="secondary" className="text-xs">{pct}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="IP, sayfa, oturum ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Aksiyon" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Aksiyonlar</SelectItem>
            <SelectItem value="page_view">Sayfa Görüntüleme</SelectItem>
            <SelectItem value="product_view">Ürün Görüntüleme</SelectItem>
            <SelectItem value="add_to_cart">Sepete Ekleme</SelectItem>
            <SelectItem value="purchase">Satın Alma</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tarih" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="week">Son 7 Gün</SelectItem>
            <SelectItem value="month">Son 30 Gün</SelectItem>
            <SelectItem value="all">Tümü</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredLogs?.length ? selectedIds.size === filteredLogs.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Zaman</TableHead>
                  <TableHead>Aksiyon</TableHead>
                  <TableHead>Sayfa</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Cihaz</TableHead>
                  <TableHead>Oturum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => {
                    const ActionIcon = actionIcons[log.action_type] || Activity;
                    const DeviceIcon = deviceIcons[log.device_type] || Monitor;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Checkbox checked={selectedIds.has(log.id)} onCheckedChange={() => toggleSelect(log.id)} />
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ActionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">{actionLabels[log.action_type] || log.action_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{log.page_path}</TableCell>
                        <TableCell className="text-xs font-mono">{log.ip_address || "-"}</TableCell>
                        <TableCell><DeviceIcon className="h-4 w-4 text-muted-foreground" /></TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{log.session_id?.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteLogsMutation.mutate([log.id])}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Log bulunamadı</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogs;
